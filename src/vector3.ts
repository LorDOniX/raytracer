// osa: 0 x, 1 y, 2 z
export type Axis = 0 | 1 | 2;

type Operation = "plus" | "minus" | "mul" | "div";
type Operand = number | Vector3;

export default class Vector3 {
	private _x: number;
	private _y: number;
	private _z: number;

	constructor(x = 0, y = 0, z = 0) {
		this._x = x;
		this._y = y;
		this._z = z;
	}

	get x(): number { return this._x; }
	get y(): number { return this._y; }
	get z(): number { return this._z; }

	setXYZ(x = 0, y = 0, z = 0): void {
		this._x = x;
		this._y = y;
		this._z = z;
	}

	axis(value: Axis): number {
		switch (value) {
			case 0:
				return this._x;

			case 1:
				return this._y;

			case 2:
				return this._z;
		}
	}

	// vybrani master axis, 0 x, 1 y, 2 z
	masterAxis(): Axis {
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

	clone(): Vector3 {
		return new Vector3(this._x, this._y, this._z);
	}

	norm(): number {
		return Math.sqrt(Math.pow(this._x, 2) + Math.pow(this._y, 2) + Math.pow(this._z, 2));
	}

	normalize(): void {
		let rn = 1 / this.norm();

		this._x *= rn;
		this._y *= rn;
		this._z *= rn;
	}

	/**
	 * Vektor kolmy na oba dva vektory, normala.
	 *
	 * @param  v Druhy vektor
	 */
	crossProduct(v: Vector3): Vector3 {
		return new Vector3(this._y * v.z - this._z * v.y, this._z * v.x - this._x * v.z, this._x * v.y - this._y * v.x);
	}

	/**
	 * Skalarni soucet, uhel mezi 2 vektory.
	 *
	 * @param  v Druhy vektor
	 */
	dotProduct(v: Vector3): number {
		return (this._x * v.x + this._y * v.y + this._z * v.z);
	}

	inverted(): Vector3 {
		return new Vector3(1 / this._x, 1 / this._y, 1 / this._z);
	}

	isEmpty(): boolean {
		return (this._x === 0 && this._y === 0 && this._z === 0);
	}

	// *
	plus(...args: Operand[]): Vector3 {
		return this.clone()._oper("plus", args);
	}

	minus(...args: Operand[]): Vector3 {
		return this.clone()._oper("minus", args);
	}

	mul(...args: Operand[]): Vector3 {
		return this.clone()._oper("mul", args);
	}

	div(...args: Operand[]): Vector3 {
		return this.clone()._oper("div", args);
	}

	// +=
	plusApply(...args: Operand[]): void {
		this._oper("plus", args);
	}

	// -=
	minusApply(...args: Operand[]): void {
		this._oper("minus", args);
	}

	// *=
	mulApply(...args: Operand[]): void {
		this._oper("mul", args);
	}

	toString(): string {
		return (`(${this._x.toFixed(5)}, ${this._y.toFixed(5)}, ${this._z.toFixed(5)})`);
	}

	// postupne provede operaci se vsemi argumenty, vysledek ulozi do sebe
	private _oper(type: Operation, args: Operand[]): Vector3 {
		let x = this._x;
		let y = this._y;
		let z = this._z;

		for (let i = 0; i < args.length; i++) {
			let arg = args[i];
			let ax = typeof arg === "number" ? arg : arg.x;
			let ay = typeof arg === "number" ? arg : arg.y;
			let az = typeof arg === "number" ? arg : arg.z;

			switch (type) {
				case "plus":
					x += ax;
					y += ay;
					z += az;
					break;

				case "minus":
					x -= ax;
					y -= ay;
					z -= az;
					break;

				case "mul":
					x *= ax;
					y *= ay;
					z *= az;
					break;

				case "div":
					x /= ax;
					y /= ay;
					z /= az;
					break;
			}
		}

		this._x = x;
		this._y = y;
		this._z = z;

		return this;
	}
}
