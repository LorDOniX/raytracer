const Jimp = require("jimp");
const shm = require('shm-typed-array');
const Color = require("./color");
const Vector3 = require("./vector3");

const RGB_LEN = 3;
const RGBA_LEN = 4;

class Cubemap {
	constructor() {
		this._images = {
			posX: {
				src: "../static/img/posx.jpg"
			},
			negX: {
				src: "../static/img/negx.jpg"
			},
			posY: {
				src: "../static/img/posy.jpg"
			},
			negY: {
				src: "../static/img/negy.jpg"
			},
			posZ: {
				src: "../static/img/posz.jpg"
			},
			negZ: {
				src: "../static/img/negz.jpg"
			}
		};
	}

	load() {
		let all = [];

		Object.keys(this._images).forEach(key => {
			all.push(this._loadImage(this._images[key]));
		});

		return Promise.all(all);
	}

	getColor(direction) {
		let imgItem = null;
		let ma = direction.masterAxis();
		let x = 0;
		let y = 0;

		// s = (sc / |ma| + 1) / 2    t = (tc / |ma| + 1) / 2
		switch (ma) {
			case 0:
				if (direction.x >= 0) {
					x = 1 - (direction.z / Math.abs(direction.x) + 1) * 0.5;
					y = 1 - (direction.y / Math.abs(direction.x) + 1) * 0.5;
					imgItem = this._images.posX;
				}
				else {
					x = (direction.z / Math.abs(direction.x) + 1) * 0.5;
					y = 1 - (direction.y / Math.abs(direction.x) + 1) * 0.5;
					imgItem = this._images.negX;
				}
				break;

			case 1:
				if (direction.y >= 0) {
					x = (direction.x / Math.abs(direction.y) + 1) * 0.5;
					y = (direction.z / Math.abs(direction.y) + 1) * 0.5;
					imgItem = this._images.posY;
				}
				else {
					x = (direction.x / Math.abs(direction.y) + 1) * 0.5;
					y = 1 - (direction.z / Math.abs(direction.y) + 1) * 0.5;
					imgItem = this._images.negY;
				}
				break;

			case 2:
				if (direction.z >= 0) {
					x = (direction.x / Math.abs(direction.z) + 1) * 0.5;
					y = 1 - (direction.y / Math.abs(direction.z) + 1) * 0.5;
					imgItem = this._images.posZ;
				}
				else {
					x = 1 - (direction.x / Math.abs(direction.z) + 1) * 0.5;
					y = 1 - (direction.y / Math.abs(direction.z) + 1) * 0.5;
					imgItem = this._images.negZ;
				}
				break;
		}

		return this._bilinearInterpolation(x, y, imgItem);
	}

	_loadImage(imgItem) {
		return new Promise((resolve, reject) => {
			Jimp.read(imgItem.src, (err, imgData) => {
				if (err) {
					console.log(err);
					reject();
				}
				else {
					let width = imgData.bitmap.width;
					let height = imgData.bitmap.height;
					let parts = width * height;
					let len = width * height * RGB_LEN;
					let buf = shm.create(len, "Uint8ClampedArray");
					let data = imgData.bitmap.data;

					for (let i = 0; i < parts; i++) {
						buf[i * RGB_LEN] = data[i * RGBA_LEN];
						buf[i * RGB_LEN + 1] = data[i * RGBA_LEN + 1];
						buf[i * RGB_LEN + 2] = data[i * RGBA_LEN + 2];
					}

					imgItem.width = width;
					imgItem.height = height;
					imgItem.len = len;
					imgItem.buf = buf;
					imgItem.key = buf.key;

					resolve();
				}
			});
		});
	}

	// http://www.devmaster.net/articles/raytracing_series/part6.php
	// S = (1-p)(1-q) a + (1-p) q c + p (1-q) b + p q d
	_bilinearInterpolation(x, y, imgItem) {
		let width = imgItem.width;
		let height = imgItem.height;

		x = width * x;
		y = height * y;

		let p = x - Math.floor(x);
		let q = y - Math.floor(y);

		// potrebuje 4 souradnice okolnich pixelu
		let p1x, p2x, p3x, p4x;
		let p1y, p2y, p3y, p4y;

		// omezeni sirky
		if (x >= width - 1) {
			p1x = p2x = p3x = p4x = Math.floor(x);
		}
		else
		{
			p1x = Math.floor(x);
			p2x = Math.floor(x);
			p3x = Math.floor(x) + 1;
			p4x = Math.floor(x) + 1;
		}

		// omezeni vysky
		if (y >= height - 1) {
			p1y = p2y = p3y = p4y = Math.floor(y);
		}
		else
		{
			p1y = Math.floor(y);
			p2y = Math.floor(y) + 1;
			p3y = Math.floor(y);
			p4y = Math.floor(y) + 1;
		}

		// 4 barvy pixelu
		let a = this._getPixel(imgItem, p1x, p1y);
		let b = this._getPixel(imgItem, p2x, p2y);
		let c = this._getPixel(imgItem, p3x, p3y);
		let d = this._getPixel(imgItem, p4x, p4y);
		let S = a.mul((1 - p) * (1 - q)).plus(
			c.mul((1 - p) * q),
			b.mul(p * (1 - q)),
			d.mul(p * q)
		);

		return Color.fromVector3(S);
	}

	_getPixel(imgItem, x, y) {
		let pos = (x + y * imgItem.width) * RGB_LEN;
		let data = imgItem.buf;

		// rgb - bez alphy
		return new Vector3(data[pos], data[pos + 1], data[pos + 2]);
	}
}

module.exports = Cubemap;
