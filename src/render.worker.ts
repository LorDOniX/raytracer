import { createRaytracer } from "./scene";
import Cubemap from "./cubemap";
import type Raytracer from "./raytracer";
import type { WorkerRequest, WorkerResponse } from "./messages";

let raytracer: Raytracer | null = null;

function send(message: WorkerResponse, transfer: Transferable[] = []): void {
	self.postMessage(message, { transfer });
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
	let message = e.data;

	try {
		switch (message.type) {
			case "init":
				// informace o scene vypisuje jen prvni worker
				if (!message.log) {
					console.log = () => {};
				}

				raytracer = await createRaytracer(message.config);
				send({ type: "ready" });
				break;

			case "cubemap":
				if (!raytracer) {
					throw new Error("Worker is not initialized");
				}

				raytracer.setCubemap(message.cubemap ? new Cubemap(message.cubemap) : null);
				break;

			case "tile": {
				if (!raytracer) {
					throw new Error("Worker is not initialized");
				}

				let { x, y, width, height } = message.tile;
				let pixels = raytracer.renderTile(x, y, width, height);

				// pixely se predaji bez kopirovani
				send({ type: "tile", tile: message.tile, pixels }, [pixels.buffer]);
				break;
			}
		}
	}
	catch (e) {
		send({ type: "error", message: e instanceof Error ? e.message : String(e) });
	}
};
