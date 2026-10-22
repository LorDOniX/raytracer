import "../less/main.less";
import Render from "./render";

const SIZE = {
	TRI_69K: "/model/bun_zipper.ply",
	TRI_16K: "/model/bun_zipper_res2.ply",
	TRI_4K: "/model/bun_zipper_res3.ply",
	TRI_1K: "/model/bun_zipper_res4.ply"
};

class Main {
	private _startTime: number;

	constructor() {
		this._startTime = Date.now();

		this._run().catch(e => {
			console.error(e);
		});
	}

	private async _run(): Promise<void> {
		// ?phong=0 zapne pruhledny material, ?threads=N pocet workeru, ?aa=N antialiasing N x N vzorku na pixel
		let params = new URLSearchParams(location.search);
		let threads = parseInt(params.get("threads") || "");
		let aa = parseInt(params.get("aa") || "");
		let render = new Render({
			model: SIZE.TRI_69K,
			camera: {
				width: 320 * 0.5,
				height: 240 * 0.5,
				eye: [-0.067, 0.237, 0.184],
				transformation: [
					[-0.982, 0.064, 0.177],
					[-0.189, -0.334, -0.924],
					[0, 0.940, -0.340]
				]
			},
			raytracer: {
				phong: params.get("phong") != "0",
				...(aa > 0 ? { aa } : {})
			}
		}, {
			...(threads > 0 ? { threadsCount: threads } : {}),
			startTime: this._startTime
		});
		await render.render();
	}
};

if (document.readyState == "loading") {
	document.addEventListener("DOMContentLoaded", () => {
		new Main();
	});
}
else {
	new Main();
}
