const Geometry = require("./geometry");
const Camera = require("./camera");
const Vector3 = require("./vector3");
const BVH = require("./bvh");
const Render = require("./render");

async function run(elements, width, height, yInt, debug) {
	let camera = new Camera(width, height);
	camera.setEye(new Vector3(-0.067, 0.237, 0.184));
	camera.setTransformationMatrix([
		[-0.982, 0.064, 0.177],
		[-0.189, -0.334, -0.924],
		[0, 0.940, -0.340]
	]);

	if (debug) {
		camera.showInfo();
	}

	let geometry = new Geometry(elements, {
		debug
	});
	let bvh = new BVH(geometry, {
		debug
	});

	if (debug) {
		bvh.showInfo();
	}

	let render = new Render(camera, bvh, {
		y: yInt,
		debug
	});
	await render.render();

	let data = render.data;
	process.send(JSON.stringify(data));
	process.exit(0);
}

process.on('message', msg => {
	let data = JSON.parse(msg);

	run(data.elements, data.width, data.height, [data.startY, data.endY], data.debug);
});
