import Color from "./color";
import type Camera from "./camera";

export default class Graphics {
	private _el: HTMLCanvasElement;
	private _ctx: CanvasRenderingContext2D;
	private _width: number;
	private _height: number;

	constructor(canvas: HTMLCanvasElement, camera: Camera) {
		let ctx = canvas.getContext("2d");

		if (!ctx) {
			throw new Error("Canvas 2D context is not available");
		}

		this._el = canvas;
		this._ctx = ctx;
		this._width = camera.width;
		this._height = camera.height;
		this._el.width = this._width;
		this._el.height = this._height

		this.clear();
	}

	clear(): void {
		this._ctx.fillStyle = Color.white().rgba;
		this._ctx.fillRect(0, 0, this._width, this._height);
	}

	// buffer pro obdelnik obrazku - pixely se zapisuji do nej a vykresli se najednou
	createImageData(width: number, height: number): ImageData {
		return this._ctx.createImageData(width, height);
	}

	putImageData(imageData: ImageData, x: number, y: number): void {
		this._ctx.putImageData(imageData, x, y);
	}
}
