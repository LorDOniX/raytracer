// otevre stranku a ceka na "Render time" v konzoli
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const url = process.argv[2];
const profile = mkdtempSync(join(tmpdir(), "rt-chrome-"));
const chrome = spawn(process.env.CHROME || "google-chrome", ["--headless=new", "--no-sandbox", "--disable-gpu", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
const wsUrl = await new Promise(r => { let b = ""; chrome.stderr.on("data", d => { b += d; const m = b.match(/DevTools listening on (ws:\/\/\S+)/); if (m) r(m[1]); }); });
const pages = await (await fetch(`http://127.0.0.1:${new URL(wsUrl).port}/json/list`)).json();
const ws = new WebSocket(pages.find(p => p.type == "page").webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener("open", r));
let id = 0;
const done = new Promise(resolve => ws.addEventListener("message", e => {
	const msg = JSON.parse(e.data);
	if (msg.method == "Runtime.consoleAPICalled") {
		const text = msg.params.args.map(a => a.value ?? a.description).join(" ");
		if (msg.params.type != "log" || /Render|threads/.test(text)) console.log(`[${msg.params.type}] ${text}`);
		if (/Render time/.test(text)) resolve();
	}
	if (msg.method == "Runtime.exceptionThrown") { console.log("EXCEPTION", JSON.stringify(msg.params.exceptionDetails).slice(0, 300)); resolve(); }
	if (msg.id == 3) console.log("crossOriginIsolated:", msg.result.result.value);
}));
ws.send(JSON.stringify({ id: ++id, method: "Runtime.enable" }));
ws.send(JSON.stringify({ id: ++id, method: "Page.navigate", params: { url } }));
await done;
ws.send(JSON.stringify({ id: ++id, method: "Runtime.evaluate", params: { expression: "crossOriginIsolated" } }));
await new Promise(r => setTimeout(r, 300));
ws.close();
await new Promise(r => { chrome.on("exit", r); chrome.kill(); });
rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
