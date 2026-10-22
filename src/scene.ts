import Ply from "./ply";
import Geometry from "./geometry";
import BVH from "./bvh";
import Camera from "./camera";
import Vector3 from "./vector3";
import Raytracer from "./raytracer";
import type { Matrix3 } from "./camera";
import type { RaytracerOptions } from "./raytracer";
import type { BVHData } from "./bvh";

// popis sceny - posila se do workeru, proto jen obycejna data
export interface SceneConfig {
	// url PLY modelu
	model: string;
	camera: {
		width: number;
		height: number;
		fovY?: number;
		eye: [number, number, number];
		transformation: Matrix3;
	};
	raytracer: Partial<RaytracerOptions>;
}

// nacte model a postavi geometrii a BVH, dela se jednou a vysledek dostanou vsechny workery
export async function buildScene(config: SceneConfig): Promise<BVHData> {
	let ply = new Ply();
	await ply.load(config.model);
	let geometry = new Geometry(ply);

	return BVH.build(geometry.mesh).data;
}

// pripravi raytracer nad hotovou scenou
export function createRaytracer(config: SceneConfig, scene: BVHData): Raytracer {
	let cameraConfig = config.camera;
	let camera = new Camera(cameraConfig.width, cameraConfig.height, cameraConfig.fovY);
	camera.setEye(new Vector3(...cameraConfig.eye));
	camera.setTransformationMatrix(cameraConfig.transformation);

	return new Raytracer(camera, new BVH(scene), config.raytracer);
}
