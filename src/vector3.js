export default class Vector3 {
	constructor(x = 0, y = 0, z = 0) {
		this._x = x;
		this._y = y;
		this._z = z;
	}

	get x() { return this._x; }
	get y() { return this._y; }
	get z() { return this._z; }

	setXYZ(x = 0, y = 0, z = 0) {
		this._x = x;
		this._y = y;
		this._z = z;
	}

	axis(value) {
		switch (value) {
			case 0:
				return this._x;

			case 1:
				return this._y;

			case 2:
				return this._z;

			default:
				return null;
		}
	}

	// vybrani master axis, 0 x, 1 y, 2 z
	masterAxis() {
		if (Math.abs(this._x) > Math.abs(this._y) && Math.abs(this._x) > Math.abs(this._z)) {
			return (0);
		}
		else if (Math.abs(this._y) > Math.abs(this._x) && Math.abs(this._y) > Math.abs(this._z)) {
			return (1);
		}
		else {
			return (2);
		}
	}

	clone() {
		return new Vector3(this._x, this._y, this._z);
	}

	norm() {
		return Math.sqrt(Math.pow(this._x, 2) + Math.pow(this._y, 2) + Math.pow(this._z, 2));
	}

	normalize() {
		let rn = 1 / this.norm();

		this._x *= rn;
		this._y *= rn;
		this._z *= rn;
	}

	/**
	 * Vektor kolmy na oba dva vektory, normala.
	 * 
	 * @param  {Vector3} v Druhy vektor
	 * @return {Vector3}
	 */
	crossProduct(v) {
		return new Vector3(this._y * v.z - this._z * v.y, this._z * v.x - this._x * v.z, this._x * v.y - this._y * v.x);
	}

	/**
	 * Skalarni soucet, uhel mezi 2 vektory.
	 * 
	 * @param  {Vector3} v Druhy vektor
	 * @return {Number}
	 */
	dotProduct(v) {
		return (this._x * v.x + this._y * v.y + this._z * v.z);
	}

	inverted() {
		return new Vector3(1 / this._x, 1 / this._y, 1 / this._z);
	}

	isEmpty() {
		return (this._x === 0 && this._y === 0 && this._z === 0);
	}

	// *
	plus() {
		return this._oper("plus", Array.prototype.slice.call(arguments), true);
	}

	minus() {
		return this._oper("minus", Array.prototype.slice.call(arguments), true);
	}

	mul() {
		return this._oper("mul", Array.prototype.slice.call(arguments), true);
	}

	div() {
		return this._oper("div", Array.prototype.slice.call(arguments), true);
	}

	// +=
	plusApply() {
		return this._oper("plus", Array.prototype.slice.call(arguments));
	}

	// -=
	minusApply() {
		return this._oper("minus", Array.prototype.slice.call(arguments));
	}

	// *=
	mulApply() {
		return this._oper("mul", Array.prototype.slice.call(arguments));
	}

	toString() {
		return (`(${this._x.toFixed(5)}, ${this._y.toFixed(5)}, ${this._z.toFixed(5)})`);
	}

	_oper(type, args, create) {
		let x = this._x;
		let y = this._y;
		let z = this._z;

		args.forEach(arg => {
			let isNumber = typeof arg === "number";

			if (!isNumber && !(arg instanceof Vector3)) return;

			switch (type) {
				case "plus":
					x += isNumber ? arg : arg.x;
					y += isNumber ? arg : arg.y;
					z += isNumber ? arg : arg.z;
					break;

				case "minus":
					x -= isNumber ? arg : arg.x;
					y -= isNumber ? arg : arg.y;
					z -= isNumber ? arg : arg.z;
					break;

				case "mul":
					x *= isNumber ? arg : arg.x;
					y *= isNumber ? arg : arg.y;
					z *= isNumber ? arg : arg.z;
					break;

				case "div":
					x /= isNumber ? arg : arg.x;
					y /= isNumber ? arg : arg.y;
					z /= isNumber ? arg : arg.z;
					break;
			}
		});

		if (create) {
			return new Vector3(x, y, z);
		}
		else {
			this.setXYZ(x, y, z);
		}
	}
}
