import Vector3 from "./vector3";

export default class Light {
	private _position: Vector3;
	private _ambiente: Vector3;
	private _diffuse: Vector3;
	private _specular: Vector3;

	constructor(position?: Vector3) {
		this._position = position || new Vector3();
		// - okolo ni
		this._ambiente = new Vector3();
		this._diffuse = new Vector3(1, 1, 1);
		this._specular = new Vector3(1, 1, 1);
	}

	get position(): Vector3 {
		return this._position;
	}

	get ambiente(): Vector3 {
		return this._ambiente;
	}

	get diffuse(): Vector3 {
		return this._diffuse;
	}

	get specular(): Vector3 {
		return this._specular;
	}
}
