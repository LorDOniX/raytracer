const Vector3 = require("./vector3");
const Ray = require("./ray");
const math = require("./math");

class Camera {
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
	}

	get width() {
		return this._width;
	}

	get height() {
		return this._height;
	}

	setEye(eye) {
		this._eye = eye;
	}

	setTransformationMatrix(tm) {
		this._tm = tm;
	}

	showInfo() {
		console.log(`Camera`);
		console.log(`Width      : ${ this._width }px`);
		console.log(`Height     : ${ this._height }px`);
	}

	generateRay(sx, sy) {
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
}

module.exports = Camera;
