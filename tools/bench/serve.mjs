// staticky server s cross-origin isolation: node serve.mjs <adresar> <port>
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
const [root, port] = process.argv.slice(2);
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".jpg": "image/jpeg", ".ply": "text/plain", ".map": "application/json" };
createServer(async (req, res) => {
	let path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
	if (path.endsWith("/")) path += "index.html";
	try {
		const data = await readFile(join(root, path));
		res.writeHead(200, { "Content-Type": types[extname(path)] || "application/octet-stream",
			"Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" });
		res.end(data);
	} catch { res.writeHead(404); res.end(); }
}).listen(port);
