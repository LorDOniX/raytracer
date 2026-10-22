import Vector3 from "./vector3";
import Ray from "./ray";
import * as math from "./math";

type MatrixRow = [number, number, number];
export type Matrix3 = [MatrixRow, MatrixRow, MatrixRow];

export default class Camera {
	private _width: number;
	private _height: number;
	private _aspect: number;
	private _fovY: number;
	private _tanX: number;
	private _tanY: number;
	private _eye: Vector3;
	private _tm: Matrix3;

	constructor(width = 640, height = 480, fovY = 45) {
		// sirka vyska obrazku
		this._width = width;
		this._height = height;
		// pomer
		this._aspect = this._width / this._height;
		// uhel otoceni oka, vodorovny uhel se dopocita z pomeru stran (tan, ne uhel samotny)
		this._fovY = fovY;
		this._tanY = Math.tan(math.deg2Rad(this._fovY * 0.5));
		this._tanX = this._tanY * this._aspect;
		// oko
		this._eye = new Vector3();
		// transformacni matice
		this._tm = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

		this._showInfo();
	}

	get width(): number {
		return this._width;
	}

	get height(): number {
		return this._height;
	}

	setEye(eye: Vector3): void {
		this._eye = eye;
	}

	setTransformationMatrix(tm: Matrix3): void {
		this._tm = tm;
	}

	// sx, sy - souradnice v obrazku, stred pixelu je x + 0.5
	generateRay(sx: number, sy: number): Ray {
		let x = ((2 * sx - this._width) / this._width) * this._tanX;
		let y = ((2 * sy - this._height) / this._height) * this._tanY;
		// smer noveho paprsku
		let direction = new Vector3(x, -y, 1);
		direction.normalize();

		let directionTransformed = new Vector3(
			this._tm[0][0] * direction.x + this._tm[0][1] * direction.y + this._tm[0][2] * direction.z,
			this._tm[1][0] * direction.x + this._tm[1][1] * direction.y + this._tm[1][2] * direction.z,
			this._tm[2][0] * direction.x + this._tm[2][1] * direction.y + this._tm[2][2] * direction.z
		);

		// paprsek
		return (new Ray(this._eye, directionTransformed, this.backgroundDirection(directionTransformed)));
	}

	/**
	 * Smer do cubemapy pozadi. Pozadi je svazane s kamerou, svetovy smer se prevede zpet
	 * do souradnic kamery (transponovana = inverzni matice) a pak zrcadli a roztahne.
	 *
	 * @param  direction Smer paprsku ve svetovych souradnicich
	 */
	backgroundDirection(direction: Vector3): Vector3 {
		let tm = this._tm;
		let x = tm[0][0] * direction.x + tm[1][0] * direction.y + tm[2][0] * direction.z;
		let y = tm[0][1] * direction.x + tm[1][1] * direction.y + tm[2][1] * direction.z;
		let z = tm[0][2] * direction.x + tm[1][2] * direction.y + tm[2][2] * direction.z;

		return new Vector3(-x, y, -0.5 * z);
	}

	private _showInfo(): void {
		console.log(`Camera`);
		console.log(`Width      : ${ this._width }px`);
		console.log(`Height     : ${ this._height }px`);
	}
}
