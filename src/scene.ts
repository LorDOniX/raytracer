import Ply from "./ply";
import Geometry from "./geometry";
import BVH from "./bvh";
import Camera from "./camera";
import Vector3 from "./vector3";
import Raytracer from "./raytracer";
import type { Matrix3 } from "./camera";
import type { RaytracerOptions } from "./raytracer";

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

// nacte model, postavi geometrii a BVH a pripravi raytracer
export async function createRaytracer(config: SceneConfig): Promise<Raytracer> {
	let cameraConfig = config.camera;
	let camera = new Camera(cameraConfig.width, cameraConfig.height, cameraConfig.fovY);
	camera.setEye(new Vector3(...cameraConfig.eye));
	camera.setTransformationMatrix(cameraConfig.transformation);

	let ply = new Ply();
	await ply.load(config.model);
	let geometry = new Geometry(ply);
	let bvh = new BVH(geometry.mesh);

	return new Raytracer(camera, bvh, config.raytracer);
}
