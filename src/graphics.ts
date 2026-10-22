import Color from "./color";

export default class Graphics {
	private _el: HTMLCanvasElement;
	private _ctx: CanvasRenderingContext2D;
	private _width: number;
	private _height: number;

	constructor(canvas: HTMLCanvasElement, width: number, height: number) {
		let ctx = canvas.getContext("2d");

		if (!ctx) {
			throw new Error("Canvas 2D context is not available");
		}

		this._el = canvas;
		this._ctx = ctx;
		this._width = width;
		this._height = height;
		this._el.width = this._width;
		this._el.height = this._height

		this.clear();
	}

	clear(): void {
		this._ctx.fillStyle = Color.white().rgba;
		this._ctx.fillRect(0, 0, this._width, this._height);
	}

	// vykresli RGBA pixely obdelniku obrazku
	putPixels(pixels: Uint8ClampedArray<ArrayBuffer>, x: number, y: number, width: number, height: number): void {
		this._ctx.putImageData(new ImageData(pixels, width, height), x, y);
	}
}
