import Mesh from "./mesh";
import type Ply from "./ply";

export interface GeometryOptions {
	flipNormals: boolean;
	scale: number;
}

export default class Geometry {
	private _ply: Ply;
	private _opts: GeometryOptions;
	// souradnice vrcholu modelu, 3 cisla na vrchol
	private _positions: Float64Array;
	// indexy vrcholu trojuhelniku, 3 na trojuhelnik
	private _ids: Int32Array;
	private _mesh: Mesh;

	constructor(ply: Ply, opts?: Partial<GeometryOptions>) {
		this._ply = ply;
		this._opts = Object.assign({
			flipNormals: false,
			scale: 1
		}, opts);
		this._positions = new Float64Array(0);
		this._ids = new Int32Array(0);

		this._create();
		this._mesh = this._createMesh();
	}

	get mesh(): Mesh {
		return this._mesh;
	}

	private _create(): void {
		let elements = this._ply.elements;
		let scale = this._opts.scale;

		if ("vertex" in elements) {
			let vertices = elements.vertex.items;

			this._positions = new Float64Array(vertices.length * 3);
			vertices.forEach((vertex, i) => {
				let { x, y, z } = vertex.values;

				this._positions[i * 3] = x * scale;
				this._positions[i * 3 + 1] = y * scale;
				this._positions[i * 3 + 2] = z * scale;
			});
		}

		if ("face" in elements) {
			let ids: number[] = [];

			elements.face.items.forEach(face => {
				// polygon rozdelime na trojuhelniky (fan), trojuhelnik zustane jak je
				for (let i = 1; i < face.ids.length - 1; i++) {
					ids.push(face.ids[0], face.ids[i], face.ids[i + 1]);
				}
			});

			this._ids = Int32Array.from(ids);
		}
	}

	// normala plochy je normalizovany vektorovy soucin hran, normala vrcholu je prumer
	// normal okolnich trojuhelniku vazeny jejich plochou
	private _createMesh(): Mesh {
		let count = this._ids.length / 3;
		let p = this._positions;
		let ids = this._ids;

		console.log("Geometry");
		console.log(`Triangles : ${ count }`);
		console.log(`Calculating normals [${this._opts.flipNormals ? "flip" : "noflip"}]...`);

		let time = Date.now();
		let vertices = new Float64Array(count * 9);
		let normals = new Float64Array(count * 9);
		let faceNormals = new Float64Array(count * 3);
		let vertexNormals = new Float64Array(p.length);

		for (let i = 0; i < count; i++) {
			let a = ids[i * 3] * 3;
			let b = ids[i * 3 + 1] * 3;
			let c = ids[i * 3 + 2] * 3;

			for (let k = 0; k < 3; k++) {
				vertices[i * 9 + k] = p[a + k];
				vertices[i * 9 + 3 + k] = p[b + k];
				vertices[i * 9 + 6 + k] = p[c + k];
			}

			// hrany v0 -> v1 a v0 -> v2
			let ux = p[b] - p[a];
			let uy = p[b + 1] - p[a + 1];
			let uz = p[b + 2] - p[a + 2];
			let vx = p[c] - p[a];
			let vy = p[c + 1] - p[a + 1];
			let vz = p[c + 2] - p[a + 2];
			let nx = uy * vz - uz * vy;
			let ny = uz * vx - ux * vz;
			let nz = ux * vy - uy * vx;

			if (this._opts.flipNormals) {
				nx = -nx;
				ny = -ny;
				nz = -nz;
			}

			let rn = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);

			nx *= rn;
			ny *= rn;
			nz *= rn;
			faceNormals[i * 3] = nx;
			faceNormals[i * 3 + 1] = ny;
			faceNormals[i * 3 + 2] = nz;

			// plocha podle heronova vzorce
			let ea = distance(p, a, b);
			let eb = distance(p, b, c);
			let ec = distance(p, c, a);
			let s = (ea + eb + ec) * 0.5;
			let area = Math.sqrt(s * (s - ea) * (s - eb) * (s - ec));

			nx *= area;
			ny *= area;
			nz *= area;

			for (let id of [a, b, c]) {
				vertexNormals[id] += nx;
				vertexNormals[id + 1] += ny;
				vertexNormals[id + 2] += nz;
			}
		}

		for (let id = 0; id < vertexNormals.length; id += 3) {
			let x = vertexNormals[id];
			let y = vertexNormals[id + 1];
			let z = vertexNormals[id + 2];

			if (x !== 0 || y !== 0 || z !== 0) {
				let rn = 1 / Math.sqrt(x * x + y * y + z * z);

				vertexNormals[id] = x * rn;
				vertexNormals[id + 1] = y * rn;
				vertexNormals[id + 2] = z * rn;
			}
		}

		for (let i = 0; i < count; i++) {
			for (let vertex = 0; vertex < 3; vertex++) {
				let id = ids[i * 3 + vertex] * 3;

				normals[i * 9 + vertex * 3] = vertexNormals[id];
				normals[i * 9 + vertex * 3 + 1] = vertexNormals[id + 1];
				normals[i * 9 + vertex * 3 + 2] = vertexNormals[id + 2];
			}
		}

		console.log(`Normals time ${((Date.now() - time) / 1000).toFixed(2)}s`);

		return new Mesh(vertices, normals, faceNormals);
	}
}

// vzdalenost dvou vrcholu v poli souradnic
function distance(p: Float64Array, a: number, b: number): number {
	let x = p[a] - p[b];
	let y = p[a + 1] - p[b + 1];
	let z = p[a + 2] - p[b + 2];

	return Math.sqrt(x * x + y * y + z * z);
}
