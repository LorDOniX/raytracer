import type Vector3 from "./vector3";
import { createFloat64Array } from "./shared";

// pole trojuhelniku jako obycejna data, daji se poslat workerum
export interface MeshData {
	vertices: Float64Array;
	normals: Float64Array;
	faceNormals: Float64Array;
}

/**
 * Trojuhelniky sceny v plochych polich (bez objektu na trojuhelnik, pole jde predat workerum).
 * Trojuhelnik i ma vrcholy a normaly vrcholu na i * 9 (v0, v1, v2) a normalu plochy na i * 3.
 */
export default class Mesh {
	private _vertices: Float64Array;
	private _normals: Float64Array;
	private _faceNormals: Float64Array;

	constructor(data: MeshData) {
		this._vertices = data.vertices;
		this._normals = data.normals;
		this._faceNormals = data.faceNormals;
	}

	get data(): MeshData {
		return {
			vertices: this._vertices,
			normals: this._normals,
			faceNormals: this._faceNormals
		};
	}

	get count(): number {
		return this._faceNormals.length / 3;
	}

	get vertices(): Float64Array {
		return this._vertices;
	}

	get normals(): Float64Array {
		return this._normals;
	}

	get faceNormals(): Float64Array {
		return this._faceNormals;
	}

	// novy mesh s trojuhelniky v poradi order (order[i] je puvodni index i-teho trojuhelniku),
	// pole jsou pri cross-origin isolation sdilena
	reorder(order: ArrayLike<number>): Mesh {
		let count = order.length;
		let vertices = createFloat64Array(count * 9);
		let normals = createFloat64Array(count * 9);
		let faceNormals = createFloat64Array(count * 3);

		for (let i = 0; i < count; i++) {
			let from = order[i];

			vertices.set(this._vertices.subarray(from * 9, from * 9 + 9), i * 9);
			normals.set(this._normals.subarray(from * 9, from * 9 + 9), i * 9);
			faceNormals.set(this._faceNormals.subarray(from * 3, from * 3 + 3), i * 3);
		}

		return new Mesh({ vertices, normals, faceNormals });
	}

	// geometricka normala trojuhelniku do out
	faceNormal(index: number, out: Vector3): Vector3 {
		let f = this._faceNormals;
		let i = index * 3;

		out.setXYZ(f[i], f[i + 1], f[i + 2]);

		return out;
	}

	/**
	 * Interpolovana normala v bode trojuhelniku do out.
	 *
	 * @param  index Index trojuhelniku
	 * @param  u     Barycentricka souradnice ve smeru v1 - v0
	 * @param  v     Barycentricka souradnice ve smeru v2 - v0
	 * @param  out   Vystupni vektor
	 */
	normal(index: number, u: number, v: number, out: Vector3): Vector3 {
		let n = this._normals;
		let i = index * 9;
		let x = n[i] + (n[i + 6] - n[i]) * v + (n[i + 3] - n[i]) * u;
		let y = n[i + 1] + (n[i + 7] - n[i + 1]) * v + (n[i + 4] - n[i + 1]) * u;
		let z = n[i + 2] + (n[i + 8] - n[i + 2]) * v + (n[i + 5] - n[i + 2]) * u;

		out.setXYZ(x, y, z);
		out.normalize();

		return out;
	}
}
