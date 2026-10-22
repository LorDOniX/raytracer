import Color from "./color";
import Vector3 from "./vector3";

interface CubemapImage {
	src: string;
	width: number;
	height: number;
	// RGBA pixely obrazku, null dokud neni nacten (nebo se nacist nepodarilo)
	pixels: Uint8ClampedArray | null;
}

type CubemapFace = "posX" | "negX" | "posY" | "negY" | "posZ" | "negZ";

export default class Cubemap {
	private _images: Record<CubemapFace, CubemapImage>;

	constructor() {
		this._images = {
			posX: {
				src: "/img/posx.jpg",
				width: 0,
				height: 0,
				pixels: null
			},
			negX: {
				src: "/img/negx.jpg",
				width: 0,
				height: 0,
				pixels: null
			},
			posY: {
				src: "/img/posy.jpg",
				width: 0,
				height: 0,
				pixels: null
			},
			negY: {
				src: "/img/negy.jpg",
				width: 0,
				height: 0,
				pixels: null
			},
			posZ: {
				src: "/img/posz.jpg",
				width: 0,
				height: 0,
				pixels: null
			},
			negZ: {
				src: "/img/negz.jpg",
				width: 0,
				height: 0,
				pixels: null
			}
		};
	}

	load(): Promise<void[]> {
		let all: Promise<void>[] = [];

		Object.values(this._images).forEach(imgItem => {
			all.push(this._loadImage(imgItem));
		});

		return Promise.all(all);
	}

	getColor(direction: Vector3): Color {
		let imgItem: CubemapImage;
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

			default:
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

	private _loadImage(imgItem: CubemapImage): Promise<void> {
		return new Promise(resolve => {
			let image = new Image();
			image.src = imgItem.src;
			image.addEventListener("load", () => {
				let canvas = document.createElement("canvas");
				canvas.width = image.width;
				canvas.height = image.height;
				let ctx = canvas.getContext("2d");

				if (!ctx) {
					resolve();
					return;
				}

				// pixely precteme jednou cele, dal se cte jen z pole
				ctx.drawImage(image, 0, 0);
				imgItem.width = image.width;
				imgItem.height = image.height;
				imgItem.pixels = ctx.getImageData(0, 0, image.width, image.height).data;

				resolve();
			});
			image.addEventListener("error", () => {
				resolve();
			});
		});
	}

	// http://www.devmaster.net/articles/raytracing_series/part6.php
	// S = (1-p)(1-q) a + (1-p) q c + p (1-q) b + p q d
	private _bilinearInterpolation(x: number, y: number, imgItem: CubemapImage): Color {
		let { width, height, pixels } = imgItem;

		// obrazek se nepodarilo nacist
		if (!pixels) {
			return Color.black();
		}

		x = width * x;
		y = height * y;

		let p = x - Math.floor(x);
		let q = y - Math.floor(y);

		// 4 okolni pixely, na okraji obrazku se souradnice omezi
		let x0 = Math.min(Math.floor(x), width - 1);
		let y0 = Math.min(Math.floor(y), height - 1);
		let x1 = Math.min(x0 + 1, width - 1);
		let y1 = Math.min(y0 + 1, height - 1);

		// indexy RGBA pixelu a [x0, y0], b [x1, y0], c [x0, y1], d [x1, y1]
		let a = (y0 * width + x0) * 4;
		let b = (y0 * width + x1) * 4;
		let c = (y1 * width + x0) * 4;
		let d = (y1 * width + x1) * 4;
		let wa = (1 - p) * (1 - q);
		let wb = p * (1 - q);
		let wc = (1 - p) * q;
		let wd = p * q;

		return Color.fromVector3(new Vector3(
			pixels[a] * wa + pixels[c] * wc + pixels[b] * wb + pixels[d] * wd,
			pixels[a + 1] * wa + pixels[c + 1] * wc + pixels[b + 1] * wb + pixels[d + 1] * wd,
			pixels[a + 2] * wa + pixels[c + 2] * wc + pixels[b + 2] * wb + pixels[d + 2] * wd
		));
	}
}
