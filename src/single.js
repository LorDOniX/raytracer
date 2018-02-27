const shm = require('shm-typed-array');
const Geometry = require("./geometry");
const Camera = require("./camera");
const Vector3 = require("./vector3");
const BVH = require("./bvh");
const Render = require("./render");

function run(elements, width, height, y, cubemapData, debug) {
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
		y,
		debug,
		cubemapData
	});
	render.render();

	let colorsArray = render.data;
	let len = colorsArray.length;
	let buf = shm.create(len, "Uint8ClampedArray");

	for (let i = 0; i < len; i++) {
		buf[i] = colorsArray[i];
	}

	process.send(JSON.stringify({
		key: buf.key,
		len
	}));
}

process.on('message', msg => {
	let data = JSON.parse(msg);

	run(data.elements, data.width, data.height, [data.startY, data.endY], data.cubemapData, data.debug);
});
