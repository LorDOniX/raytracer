import Color from "./color";
import Vector3 from "./vector3";

export interface CubemapImage {
	width: number;
	height: number;
	// RGBA pixely obrazku, pri cross-origin isolation ve SharedArrayBuffer sdilenem mezi workery
	pixels: Uint8ClampedArray;
}

export type CubemapFace = "posX" | "negX" | "posY" | "negY" | "posZ" | "negZ";

// obrazky sten, null pokud se nepodarilo nacist
export type CubemapData = Record<CubemapFace, CubemapImage | null>;

const SOURCES: Record<CubemapFace, string> = {
	posX: "/img/posx.jpg",
	negX: "/img/negx.jpg",
	posY: "/img/posy.jpg",
	negY: "/img/negy.jpg",
	posZ: "/img/posz.jpg",
	negZ: "/img/negz.jpg"
};

export default class Cubemap {
	private _images: CubemapData;

	constructor(data: CubemapData) {
		this._images = data;
	}

	// nacte a dekoduje vsechny steny
	static async load(): Promise<CubemapData> {
		let faces = Object.keys(SOURCES) as CubemapFace[];
		let images = await Promise.all(faces.map(face => Cubemap._loadImage(SOURCES[face])));
		let data = {} as CubemapData;

		faces.forEach((face, ind) => {
			data[face] = images[ind];
		});

		return data;
	}

	getColor(direction: Vector3): Color {
		let imgItem: CubemapImage | null;
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

	private static async _loadImage(src: string): Promise<CubemapImage | null> {
		try {
			let response = await fetch(src);

			if (!response.ok) {
				throw new Error(`Loading ${src} failed with status ${response.status}`);
			}

			let bitmap = await createImageBitmap(await response.blob());
			let canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
			let ctx = canvas.getContext("2d");

			if (!ctx) {
				return null;
			}

			// pixely precteme jednou cele, dal se cte jen z pole
			ctx.drawImage(bitmap, 0, 0);
			let data = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
			let pixels: Uint8ClampedArray = data;

			// sdilena pamet - workery si pole nekopiruji
			if (crossOriginIsolated) {
				pixels = new Uint8ClampedArray(new SharedArrayBuffer(data.length));
				pixels.set(data);
			}

			let image = {
				width: bitmap.width,
				height: bitmap.height,
				pixels
			};
			bitmap.close();

			return image;
		}
		catch (e) {
			// pozadi z teto steny bude cerne
			console.error(e);

			return null;
		}
	}

	// http://www.devmaster.net/articles/raytracing_series/part6.php
	// S = (1-p)(1-q) a + (1-p) q c + p (1-q) b + p q d
	private _bilinearInterpolation(x: number, y: number, imgItem: CubemapImage | null): Color {
		// obrazek se nepodarilo nacist
		if (!imgItem) {
			return Color.black();
		}

		let { width, height, pixels } = imgItem;

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
