import Graphics from "./graphics";
import Cubemap from "./cubemap";
import type { CubemapData } from "./cubemap";
import type { SceneConfig } from "./scene";
import type { Tile, WorkerRequest, WorkerResponse } from "./messages";

export interface RenderOptions {
	// pocet web workeru, ktere renderuji paralelne
	threadsCount: number;
	// vyska pruhu obrazku v pixelech, ktery si worker bere najednou
	tileHeight: number;
	startTime: number;
}

export default class Render {
	private _config: SceneConfig;
	private _opts: RenderOptions;
	private _graphics: Graphics;

	constructor(config: SceneConfig, opts?: Partial<RenderOptions>) {
		this._config = config;
		this._opts = Object.assign({
			// kazdy worker si sam stavi geometrii a BVH (~60 MB, ~1.5 s), vic workeru se pri tom brzdi
			threadsCount: Math.min(navigator.hardwareConcurrency || 4, 4),
			tileHeight: 8,
			startTime: 0
		}, opts);
		let canvas = document.getElementById("canvas");

		if (!(canvas instanceof HTMLCanvasElement)) {
			throw new Error("Missing canvas element #canvas");
		}

		this._graphics = new Graphics(canvas, config.camera.width, config.camera.height);
	}

	async render(): Promise<void> {
		let threads = Math.max(Math.floor(this._opts.threadsCount), 1);
		let workers = Array.from({ length: threads }, () => new Worker(new URL("./render.worker.ts", import.meta.url), { type: "module" }));

		try {
			// kazdy worker si nacte model a postavi BVH, mezitim se dekoduje pozadi
			let [cubemap] = await Promise.all([
				this._loadCubemap(),
				...workers.map((worker, ind) => this._init(worker, ind == 0))
			]);

			workers.forEach(worker => this._send(worker, { type: "cubemap", cubemap }));

			let startTime = Date.now();

			console.log(`Render`);
			console.log(`Pre render time ${((startTime - this._opts.startTime) / 1000).toFixed(2)}s`);
			console.log(`Render starting with ${ threads } threads...`);

			await this._renderTiles(workers);

			console.log(`Render time ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
		}
		finally {
			workers.forEach(worker => worker.terminate());
		}
	}

	private async _loadCubemap(): Promise<CubemapData | null> {
		if (!(this._config.raytracer.background ?? true)) {
			return null;
		}

		if (!crossOriginIsolated) {
			console.warn("Cross-origin isolation is not enabled (COOP/COEP headers), cubemap is copied into every worker");
		}

		return Cubemap.load();
	}

	private _init(worker: Worker, log: boolean): Promise<void> {
		return new Promise((resolve, reject) => {
			worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
				if (e.data.type == "ready") {
					resolve();
				}
				else if (e.data.type == "error") {
					reject(new Error(e.data.message));
				}
			};
			worker.onerror = e => reject(new Error(e.message));

			this._send(worker, { type: "init", config: this._config, log });
		});
	}

	// obrazek rozdelime na pruhy, volny worker si vezme dalsi pruh
	private _renderTiles(workers: Worker[]): Promise<void> {
		let { width, height } = this._config.camera;
		let tileHeight = Math.max(Math.floor(this._opts.tileHeight), 1);
		let tiles: Tile[] = [];

		for (let y = 0; y < height; y += tileHeight) {
			tiles.push({ x: 0, y, width, height: Math.min(tileHeight, height - y) });
		}

		let total = tiles.length;
		let done = 0;
		let lastStatus = 0;

		return new Promise((resolve, reject) => {
			let next = (worker: Worker) => {
				let tile = tiles.shift();

				if (tile) {
					this._send(worker, { type: "tile", tile });
				}
			};

			workers.forEach(worker => {
				worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
					let message = e.data;

					if (message.type == "error") {
						reject(new Error(message.message));
						return;
					}

					if (message.type != "tile") return;

					let { x, y, width, height } = message.tile;
					this._graphics.putPixels(message.pixels, x, y, width, height);
					done++;

					// stav po 10 %
					let status = Math.floor(done / total * 10) * 10;

					if (status > lastStatus) {
						lastStatus = status;
						console.log(`Render status ${status}%`);
					}

					if (done == total) {
						resolve();
					}
					else {
						next(worker);
					}
				};
				worker.onerror = e => reject(new Error(e.message));

				next(worker);
			});
		});
	}

	private _send(worker: Worker, message: WorkerRequest): void {
		worker.postMessage(message);
	}
}
