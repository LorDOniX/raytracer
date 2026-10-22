import type Vector3 from "./vector3";

export default class Color {
	private _r: number;
	private _g: number;
	private _b: number;
	private _a: number;

	constructor(r?: number, g?: number, b?: number, a?: number) {
		this._r = r || 0;
		this._g = g || 0;
		this._b = b || 0;
		this._a = a || 255;
	}

	get r(): number { return this._r; }
	get g(): number { return this._g; }
	get b(): number { return this._b; }
	get a(): number { return this._a; }

	get rgba(): string {
		return (`rgba(${this._r}, ${this._g}, ${this._b}, ${Math.round(this._a / 255)})`);
	}

	static white(): Color {
		return new Color(255, 255, 255);
	}

	static black(): Color {
		return new Color(0, 0, 0);
	}

	/**
	 * vec - bud ma sam hodnoty 0-255, jinak se musi normalizovat.
	 *
	 * @param  vec       Barva jako vektor (r, g, b)
	 * @param  normalize Hodnoty jsou v rozsahu 0-1 a prevedou se na 0-255
	 */
	static fromVector3(vec: Vector3, normalize?: boolean): Color {
		let r = vec.x;
		let g = vec.y;
		let b = vec.z;

		if (normalize) {
			r *= 255;
			g *= 255;
			b *= 255;
		}

		r = Color._clamp(r);
		g = Color._clamp(g);
		b = Color._clamp(b);

		return new Color(r, g, b);
	}

	// omezeni na 0-255, NaN -> 0
	private static _clamp(value: number): number {
		return Math.min(Math.max(value, 0), 255) >>> 0;
	}
}
