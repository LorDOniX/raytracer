// upravi main.ts v kopii projektu pro mereni: vetsi obrazek a po renderu ulozi cas a pixely do window.__bench
// pouziti: node instrument.mjs <cesta k main.ts> <sirka> <vyska>
import { readFileSync, writeFileSync } from "node:fs";

const [file, width, height] = process.argv.slice(2);
let s = readFileSync(file, "utf8");
const replace = (from, to) => {
	if (!s.includes(from)) {
		console.error(`instrument: v ${file} chybi "${from}"`);
		process.exit(1);
	}
	s = s.replace(from, to);
};

replace("width: 320 * 0.5,", `width: ${width},`);
replace("height: 240 * 0.5,", `height: ${height},`);
replace("\t\tawait render.render();", `\t\tlet renderStart = performance.now();
\t\tawait render.render();
\t\tlet benchCanvas = document.getElementById("canvas") as HTMLCanvasElement;
\t\tlet benchData = benchCanvas.getContext("2d")!.getImageData(0, 0, benchCanvas.width, benchCanvas.height).data;
\t\tlet benchBin = "";
\t\tfor (let i = 0; i < benchData.length; i++) benchBin += String.fromCharCode(benchData[i]);
\t\t(window as any).__bench = { render: performance.now() - renderStart, prepare: renderStart, pixels: btoa(benchBin), isolated: crossOriginIsolated };`);
writeFileSync(file, s);
