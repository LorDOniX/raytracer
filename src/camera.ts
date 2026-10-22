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
	private _fovX: number;
	private _eye: Vector3;
	private _tm: Matrix3;

	constructor(width = 640, height = 480, fovY = 45) {
		// sirka vyska obrazku
		this._width = width;
		this._height = height;
		// pomer
		this._aspect = this._width / this._height;
		// uhel otoceni oka
		this._fovY = fovY;
		this._fovX = this._fovY * this._aspect;
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

	generateRay(sx: number, sy: number): Ray {
		let x = ((2 * sx - this._width) / this._width) * Math.tan(math.deg2Rad(this._fovX * 0.5));
		let y = ((2 * sy - this._height) / this._height) * Math.tan(math.deg2Rad(this._fovY * 0.5));
		// smer noveho paprsku
		let direction = new Vector3(x, -y, 1);
		direction.normalize();

		let directionTransformed = new Vector3(
			this._tm[0][0] * direction.x + this._tm[0][1] * direction.y + this._tm[0][2] * direction.z,
			this._tm[1][0] * direction.x + this._tm[1][1] * direction.y + this._tm[1][2] * direction.z,
			this._tm[2][0] * direction.x + this._tm[2][1] * direction.y + this._tm[2][2] * direction.z
		);
		// paprsek pozadi
		let bgDirectionRaw = new Vector3(x, y, 1); // smer noveho paprsku
		bgDirectionRaw.normalize();

		let bgDirection = new Vector3(
			-1 * bgDirectionRaw.x + 0 * bgDirectionRaw.y + 0 * bgDirectionRaw.z,
			0 * bgDirectionRaw.x + -1 * bgDirectionRaw.y + 0 * bgDirectionRaw.z,
			0 * bgDirectionRaw.x + 0 * bgDirectionRaw.y + -0.5 * bgDirectionRaw.z
		);

		// paprsek
		return (new Ray(this._eye, directionTransformed, bgDirection));
	}

	private _showInfo(): void {
		console.log(`Camera`);
		console.log(`Width      : ${ this._width }px`);
		console.log(`Height     : ${ this._height }px`);
	}
}
