import Graphics from "./graphics";
import Cubemap from "./cubemap";
import type { CubemapData } from "./cubemap";
import type { SceneConfig } from "./scene";
import type { BVHData } from "./bvh";
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
			// scena se stavi jednou a sdili, kazdy dalsi worker stoji jen start a zahrati JIT,
			// pri malem obrazku se vic nez 8 workeru nevyplati
			threadsCount: Math.min(navigator.hardwareConcurrency || 4, 8),
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
			if (!crossOriginIsolated) {
				console.warn("Cross-origin isolation is not enabled (COOP/COEP headers), scene and cubemap are copied into every worker");
			}

			// prvni worker nacte model a postavi BVH, mezitim se dekoduje pozadi
			let [cubemap, scene] = await Promise.all([
				this._loadCubemap(),
				this._build(workers[0])
			]);

			// hotovou scenu dostanou vsechny workery (pri cross-origin isolation sdilenou)
			await Promise.all(workers.map((worker, ind) => this._init(worker, scene, ind == 0)));

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

		return Cubemap.load();
	}

	private async _build(worker: Worker): Promise<BVHData> {
		let response = await this._request(worker, { type: "build", config: this._config }, "scene");

		return response.scene;
	}

	private async _init(worker: Worker, scene: BVHData, log: boolean): Promise<void> {
		await this._request(worker, { type: "init", config: this._config, scene, log }, "ready");
	}

	// posle workeru zpravu a pocka na odpoved daneho typu
	private _request<T extends WorkerResponse["type"]>(worker: Worker, message: WorkerRequest, type: T): Promise<Extract<WorkerResponse, { type: T }>> {
		return new Promise((resolve, reject) => {
			worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
				let response = e.data;

				if (response.type == type) {
					resolve(response as Extract<WorkerResponse, { type: T }>);
				}
				else if (response.type == "error") {
					reject(new Error(response.message));
				}
			};
			worker.onerror = e => reject(new Error(e.message));

			this._send(worker, message);
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
