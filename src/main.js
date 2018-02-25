const { fork } = require('child_process');
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
		// require('os').cpus().length;
		this._threadsCount = 4;
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
				let data = JSON.parse(msg);

				this._setData(sendData, data);
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

	_setData(sendData, data) {
		this._doneCount++;
		this._workersCount--;

		// canvas
		let x = 0;
		let y = sendData.startY;
		
		for (let i = 0, max = data.length; i < max; i++) {
			this._image.setPixelColor(data[i], x, y);

			// posuneme
			x++;

			if (x == this._width) {
				x = 0;
				y++;
			}
		}

		console.log(`Progress ${(this._doneCount / this._threadsCount * 100).toFixed(2)}%`);

		if (!this._workersCount) {
			console.log(`Main time ${((Date.now() - this._startTime) / 1000).toFixed(2)}s`);

			this._image.write("../raytracing.png");

			console.log(`Main time end`);
		}
	}
}

new Main();
