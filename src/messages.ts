import type { SceneConfig } from "./scene";
import type { CubemapData } from "./cubemap";

// obdelnik obrazku v pixelech
export interface Tile {
	x: number;
	y: number;
	width: number;
	height: number;
}

// zpravy hlavni vlakno -> worker
export type WorkerRequest =
	| { type: "init"; config: SceneConfig; log: boolean }
	// posila se az po "ready", pred prvnim pruhem
	| { type: "cubemap"; cubemap: CubemapData | null }
	| { type: "tile"; tile: Tile };

// zpravy worker -> hlavni vlakno
export type WorkerResponse =
	| { type: "ready" }
	| { type: "tile"; tile: Tile; pixels: Uint8ClampedArray<ArrayBuffer> }
	| { type: "error"; message: string };
