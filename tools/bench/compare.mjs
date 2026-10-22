// pouziti: node compare.mjs a.bin b.bin
import { readFileSync } from "node:fs";
const [a, b] = process.argv.slice(2).map(f => readFileSync(f));
let diff = 0, maxDelta = 0;
for (let i = 0; i < a.length; i += 4) {
	const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2]));
	if (d > 0) diff++;
	maxDelta = Math.max(maxDelta, d);
}
console.log(`pixelu ${a.length / 4}, rozdilnych ${diff} (${(diff / (a.length / 4) * 100).toFixed(2)} %), max odchylka ${maxDelta}`);
