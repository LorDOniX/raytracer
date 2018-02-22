import Vector3 from "./vector3";

export default class Material {
	constructor() {
		// - okolo ni
		this._ambiente = new Vector3(0.1, 0.1, 0.1);
		this._diffuse = new Vector3(0.5, 0.5, 0.5);
		this._specular = new Vector3(1, 1, 1);
		this._emission = new Vector3();
		this._shininess = 60;
		// index of refraction
		this._reflectivity = 0.8;
		this._ior = 1.5;
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

	get emission() {
		return this._emission;
	}

	get shininess() {
		return this._shininess;
	}

	get reflectivity() {
		return this._reflectivity;
	}

	get ior() {
		return this._ior;
	}
}
