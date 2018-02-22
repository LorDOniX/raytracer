import Color from "./color";
import Vector3 from "./vector3";

export default class Cubemap {
	constructor() {
		this._images = {
			posX: {
				src: "/img/posx.jpg"
			},
			negX: {
				src: "/img/negx.jpg"
			},
			posY: {
				src: "/img/posy.jpg"
			},
			negY: {
				src: "/img/negy.jpg"
			},
			posZ: {
				src: "/img/posz.jpg"
			},
			negZ: {
				src: "/img/negz.jpg"
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
		return new Promise(resolve => {
			let image = new Image();
			image.src = imgItem.src;
			image.addEventListener("load", e => {
				let canvas = document.createElement("canvas");
				canvas.width = image.width;
				canvas.height = image.height;
				let ctx = canvas.getContext("2d");
				ctx.drawImage(image, 0, 0);

				// pridame atributy
				imgItem.width = image.width;
				imgItem.height = image.height;
				imgItem.ctx = ctx;

				resolve();
			});
			image.addEventListener("error", e => {
				resolve();
			});
			imgItem.img = image;
		});
	}

	_getPixel(imgItem, x, y) {
		let imgData = imgItem.ctx.getImageData(x, y, 1, 1);
		let data = imgData.data;

		// rgb - bez alphy
		return new Vector3(data[0], data[1], data[2]);
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
}
