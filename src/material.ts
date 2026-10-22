import Vector3 from "./vector3";

export default class Material {
	private _ambiente: Vector3;
	private _diffuse: Vector3;
	private _specular: Vector3;
	private _emission: Vector3;
	private _shininess: number;
	private _reflectivity: number;
	private _ior: number;

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

	// ciste sklo: skoro bez difuzni slozky, ostre odlesky, odraz a pruchod rozdeli jen fresnel
	// (propustene svetlo se uz nenasobi odrazivosti)
	static glass(): Material {
		let material = new Material();

		material._ambiente.setXYZ(0, 0, 0);
		material._diffuse.setXYZ(0.05, 0.05, 0.05);
		material._shininess = 200;
		material._reflectivity = 1;

		return material;
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

	get emission(): Vector3 {
		return this._emission;
	}

	get shininess(): number {
		return this._shininess;
	}

	get reflectivity(): number {
		return this._reflectivity;
	}

	get ior(): number {
		return this._ior;
	}
}
