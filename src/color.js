export default class Color {
	constructor(r, g, b, a) {
		this._r = r || 0;
		this._g = g || 0;
		this._b = b || 0;
		this._a = a || 255;
	}

	get r() { return this._r; }
	get g() { return this._g; }
	get b() { return this._b; }
	get a() { return this._a; }

	get rgba() {
		return (`rgba(${this._r}, ${this._g}, ${this._b}, ${Math.round(this._a / 255)})`);
	}

	static white() {
		return new Color(255, 255, 255);
	}

	static black() {
		return new Color(0, 0, 0);
	}

	/**
	 * vec - bud ma sam hodnoty 0-255, jinak se musi normalizovat.
	 * 
	 * @param  {[type]} vec       [description]
	 * @param  {[type]} normalize [description]
	 * @return {[type]}           [description]
	 */
	static fromVector3(vec, normalize) {
		let r = vec.x;
		let g = vec.y;
		let b = vec.z;

		if (normalize) {
			r *= 255;
			g *= 255;
			b *= 255;
		}

		r = r >>> 0;
		g = g >>> 0;
		b = b >>> 0;

		return new Color(r, g, b);
	}
}
