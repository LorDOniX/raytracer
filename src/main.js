const { fork } = require('child_process');
const shm = require('shm-typed-array');
const os = require('os');
const Jimp = require('jimp');
const Ply = require("./ply");

const SIZE = {
	TRI_69K: "../static/model/bun_zipper.ply",
	TRI_16K: "../static/model/bun_zipper_res2.ply",
	TRI_4K: "../static/model/bun_zipper_res3.ply",
	TRI_1K: "../static/model/bun_zipper_res4.ply"
};

class Main {
	constructor() {
		this._threadsCount = os.cpus().length;
		this._width = 1920;
		this._height = 1080;
		this._workersCount = 0;
		this._doneCount = 0;
		this._startTime = 0;
		this._image = null;
		this._ply = new Ply();

		this._run();
	}

	async _run() {
		await this._ply.load(SIZE.TRI_69K);
		// obrazek
		this._image = await this._getImage();

		// raytrace
		let rowStep = Math.max(this._threadsCount, 1);
		let rowHeight = this._height / rowStep;

		console.log("Start main...");
		this._startTime = Date.now();

		// pro jednotlive radky
		for (let j = 0; j < rowStep; j++) {
			this._workersCount++;

			let worker = fork("single.js");

			let sendData = {
				elements: this._ply.elements,
				width: this._width,
				height: this._height,
				startY: j * rowHeight,
				endY: (j + 1) * rowHeight,
				debug: j == 0
			};

			worker.on("message", msg => {
				let msgData = JSON.parse(msg);

				this._setData(sendData, msgData);

				worker.kill();
			});

			worker.send(JSON.stringify(sendData));
		}
	}

	_getImage() {
		return new Promise((resolve, reject) => {
			new Jimp(this._width, this._height, (err, image) => {
				if (err) {
					reject();
				}
				else {
					resolve(image);
				}
			});
		});
	}

	_setData(sendData, msgData) {
		this._doneCount++;
		this._workersCount--;

		// canvas
		let x = 0;
		let y = sendData.startY;
		let buf = shm.get(msgData.key);
		let blockSize = 3;
		let parts = msgData.len / blockSize;

		// [r,g,b,r,g,b]...
		for (let i = 0; i < parts; i++) {
			let hxColor = Jimp.rgbaToInt(buf[i * blockSize], buf[i * blockSize + 1], buf[i * blockSize + 2], 255);

			this._image.setPixelColor(hxColor, x, y);

			// posuneme
			x++;

			if (x == this._width) {
				x = 0;
				y++;
			}
		}

		// odstranime pamet
		shm.detach(msgData.key);

		console.log(`Progress ${(this._doneCount / this._threadsCount * 100).toFixed(2)}%`);

		if (!this._workersCount) {
			console.log(`Main time ${((Date.now() - this._startTime) / 1000).toFixed(2)}s`);

			this._image.write("../raytracing.png");

			console.log(`Main time end`);
		}
	}
}

new Main();
