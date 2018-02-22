import * as $dom from "./onix/dom";
import Ply from "./ply";
import Geometry from "./geometry";
import Camera from "./camera";
import Vector3 from "./vector3";
import BVH from "./bvh";
import Render from "./render";

const SIZE = {
	TRI_69K: "/model/bun_zipper.ply",
	TRI_16K: "/model/bun_zipper_res2.ply",
	TRI_4K: "/model/bun_zipper_res3.ply",
	TRI_1K: "/model/bun_zipper_res4.ply"
};

class Main {
	constructor() {
		this._startTime = Date.now();
		this._ply = new Ply();

		this._run();
	}

	async _run() {
		let camera = new Camera(1920, 1080);
		camera.setEye(new Vector3(-0.067, 0.237, 0.184));
		camera.setTransformationMatrix([
			[-0.982, 0.064, 0.177],
			[-0.189, -0.334, -0.924],
			[0, 0.940, -0.340]
		]);
		await this._ply.load(SIZE.TRI_69K);
		let geometry = new Geometry(this._ply);
		let bvh = new BVH(geometry);
		let render = new Render(camera, bvh, {
			startTime: this._startTime
		});
		await render.render();
	}
};

$dom.load(() => {
	new Main();
});
