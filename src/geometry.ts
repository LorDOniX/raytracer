import Vector3 from "./vector3";
import Triangle from "./triangle";
import type Ply from "./ply";

export interface GeometryOptions {
	flipNormals: boolean;
	scale: number;
}

interface TriangleItem {
	// indexy vrcholu trojuhelniku
	ids: [number, number, number];
	triangle: Triangle;
}

export default class Geometry {
	private _ply: Ply;
	private _opts: GeometryOptions;
	private _positions: Vector3[];
	private _triangles: Triangle[];
	private _triangleItems: TriangleItem[];

	constructor(ply: Ply, opts?: Partial<GeometryOptions>) {
		this._ply = ply;
		this._opts = Object.assign({
			flipNormals: false,
			scale: 1
		}, opts);
		this._positions = [];
		this._triangles = [];
		this._triangleItems = [];

		this._create();
	}

	get triangles(): Triangle[] {
		return this._triangles;
	}

	private _create(): void {
		let elements = this._ply.elements;

		if ("vertex" in elements) {
			elements.vertex.items.forEach(vertex => {
				let { x, y, z } = vertex.values;
				let position = new Vector3(x, y, z);

				position.mulApply(this._opts.scale);
				this._positions.push(position);
			});
		}

		if ("face" in elements) {
			elements.face.items.forEach(face => {
				// polygon rozdelime na trojuhelniky (fan), trojuhelnik zustane jak je
				for (let i = 1; i < face.ids.length - 1; i++) {
					let ids: [number, number, number] = [face.ids[0], face.ids[i], face.ids[i + 1]];
					let triangle = new Triangle(
						this._positions[ids[0]],
						this._positions[ids[1]],
						this._positions[ids[2]],
						undefined,
						undefined,
						undefined,
						this._opts.flipNormals
					);

					this._triangleItems.push({
						ids,
						triangle
					});
					this._triangles.push(triangle);
				}
			});
		}

		this._updatePerVertexNormals();
	}

	// normala vrcholu je prumer normal okolnich trojuhelniku vazeny jejich plochou
	private _updatePerVertexNormals(): void {
		console.log("Geometry");
		console.log(`Triangles : ${ this._triangles.length }`);
		console.log(`Calculating normals [${this._opts.flipNormals ? "flip" : "noflip"}]...`);

		let time = Date.now();
		let normals = this._positions.map(() => new Vector3());

		this._triangleItems.forEach(({ ids, triangle }) => {
			let faceNormal = triangle.perFaceNormal.mul(triangle.area());

			ids.forEach(id => {
				normals[id].plusApply(faceNormal);
			});
		});

		normals.forEach(normal => {
			if (!normal.isEmpty()) {
				normal.normalize();
			}
		});

		this._triangleItems.forEach(({ ids, triangle }) => {
			ids.forEach((id, vertex) => {
				triangle.setPerVertexNormal(vertex, normals[id]);
			});
		});

		console.log(`Normals time ${((Date.now() - time) / 1000).toFixed(2)}s`);
	}
}
