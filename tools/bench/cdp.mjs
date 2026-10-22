// pouziti: node cdp.mjs <url> <vystup.bin> [pocet behu]
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url, out, runsArg] = process.argv.slice(2);
const runs = parseInt(runsArg || "3");
const times = [];
const totals = [];
let pixels = null;

for (let run = 0; run < runs; run++) {
	const profile = mkdtempSync(join(tmpdir(), "rt-chrome-"));
	const chrome = spawn(process.env.CHROME || "google-chrome", ["--headless=new", "--no-sandbox", "--disable-gpu", "--remote-debugging-port=0",
		`--user-data-dir=${profile}`, "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
	const wsBrowser = await new Promise((resolve, reject) => {
		let buf = "";
		chrome.stderr.on("data", d => {
			buf += d;
			const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
			if (m) resolve(m[1]);
		});
		setTimeout(() => reject(new Error("chrome start timeout")), 20000);
	});
	const port = new URL(wsBrowser).port;
	const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
	const ws = new WebSocket(pages.find(p => p.type == "page").webSocketDebuggerUrl);
	await new Promise(r => ws.addEventListener("open", r));
	let id = 0;
	const pending = new Map();
	ws.addEventListener("message", e => {
		const msg = JSON.parse(e.data);
		if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
		if (msg.method == "Runtime.consoleAPICalled" && process.env.LOGS) {
			const text = msg.params.args.map(a => a.value ?? a.description).join(" ");
			if (/time|warn/i.test(text) || msg.params.type != "log") console.log("   [console]", text);
		}
		if (msg.method == "Runtime.exceptionThrown") console.error("PAGE ERROR", JSON.stringify(msg.params.exceptionDetails).slice(0, 500));
	});
	const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
	await send("Runtime.enable");
	await send("Page.navigate", { url });
	const res = await send("Runtime.evaluate", { awaitPromise: true, returnByValue: true, expression: `
		new Promise((resolve, reject) => {
			const start = Date.now();
			const check = () => {
				if (window.__bench) resolve(window.__bench);
				else if (Date.now() - start > 600000) reject(new Error("render timeout"));
				else setTimeout(check, 50);
			};
			check();
		})` });
	ws.close();
	await new Promise(r => { chrome.on("exit", r); chrome.kill(); });
	rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
	if (res.result.exceptionDetails) { console.error(JSON.stringify(res.result.exceptionDetails)); process.exit(1); }
	const bench = res.result.result.value;
	times.push(bench.render);
	totals.push(bench.render + bench.prepare);
	pixels = Buffer.from(bench.pixels, "base64");
	console.log(`beh ${run + 1}: render ${bench.render.toFixed(0)} ms, priprava ${bench.prepare.toFixed(0)} ms, izolace ${bench.isolated}`);
}
writeFileSync(out, pixels);
times.sort((a, b) => a - b);
totals.sort((a, b) => a - b);
console.log(`MEDIAN render ${times[Math.floor(times.length / 2)].toFixed(0)} ms, celkem ${totals[Math.floor(totals.length / 2)].toFixed(0)} ms`);
