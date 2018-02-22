import Vector3 from "./vector3";

export default class Light {
	constructor(position) {
		this._position = position || new Vector3();
		// - okolo ni
		this._ambiente = new Vector3();
		this._diffuse = new Vector3(1, 1, 1);
		this._specular = new Vector3(1, 1, 1);
	}

	get position() {
		return this._position;
	}

	get ambiente() {
		return this._ambiente;
	}

	get diffuse() {
		return this._diffuse;
	}

	get specular() {
		return this._specular;
	}
}
