import type { SceneConfig } from "./scene";
import type { CubemapData } from "./cubemap";
import type { BVHData } from "./bvh";

// obdelnik obrazku v pixelech
export interface Tile {
	x: number;
	y: number;
	width: number;
	height: number;
}

// zpravy hlavni vlakno -> worker
export type WorkerRequest =
	// nacte model a postavi BVH, posila se jen jednomu workeru, odpoved "scene"
	| { type: "build"; config: SceneConfig }
	| { type: "init"; config: SceneConfig; scene: BVHData; log: boolean }
	// posila se az po "ready", pred prvnim pruhem
	| { type: "cubemap"; cubemap: CubemapData | null }
	| { type: "tile"; tile: Tile };

// zpravy worker -> hlavni vlakno
export type WorkerResponse =
	| { type: "scene"; scene: BVHData }
	| { type: "ready" }
	| { type: "tile"; tile: Tile; pixels: Uint8ClampedArray<ArrayBuffer> }
	| { type: "error"; message: string };
