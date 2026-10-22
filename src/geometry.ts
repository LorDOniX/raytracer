import Vector3 from "./vector3";
import Triangle from "./triangle";
import type Ply from "./ply";

export interface GeometryOptions {
	flipNormals: boolean;
	scale: number;
}

interface GeometryItem {
	position: Vector3;
	normal: Vector3;
	textureCoord: Vector3;
}

interface TriangleItem {
	ids: number[];
	triangle: Triangle;
}

export default class Geometry {
	private _ply: Ply;
	private _opts: GeometryOptions;
	private _items: GeometryItem[];
	private _triangles: Triangle[];
	private _triangleItems: TriangleItem[];
	private _facesIds: Record<number, TriangleItem[]>;

	constructor(ply: Ply, opts?: Partial<GeometryOptions>) {
		this._ply = ply;
		this._opts = Object.assign({
			flipNormals: false,
			scale: 1
		}, opts);
		this._items = [];
		this._triangles = [];
		this._triangleItems = [];
		this._facesIds = {};

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
				let normal = new Vector3(x, y, z);
				let textureCoord = new Vector3();

				position.mulApply(this._opts.scale);

				if (this._opts.flipNormals) {
					normal.mulApply(-1);
				}
				normal.normalize();

				this._items.push({
					position,
					normal,
					textureCoord
				});
			});
		}

		if ("face" in elements) {
			elements.face.items.forEach(face => {
				let items = face.ids.map(id => this._items[id]);
				let triangle = new Triangle(
					items[0].position,
					items[1].position,
					items[2].position,
					items[0].normal,
					items[1].normal,
					items[2].normal,
					this._opts.flipNormals
				);
				let triangleItem: TriangleItem = {
					ids: face.ids,
					triangle
				};

				face.ids.forEach(id => {
					if (!(id in this._facesIds)) {
						this._facesIds[id] = [];
					}

					this._facesIds[id].push(triangleItem);
				});

				this._triangleItems.push(triangleItem);
				this._triangles.push(triangle);
			});
		}

		this._updatePerVertexNormals(!this._opts.flipNormals);
	}

	private _updatePerVertexNormals(flipNormals: boolean): void {
		console.log("Geometry");
		console.log(`Triangles : ${ this._triangles.length }`);
		console.log(`Calculating normals [${flipNormals ? "flip" : "noflip"}]...`);

		let time = Date.now();

		this._triangleItems.forEach(triangleItem => {
			let triangle = triangleItem.triangle;

			for (let vertex = 0; vertex < 3; vertex++) {
				let perVertexNormal = triangle.perFaceNormal.clone();
				perVertexNormal.mulApply(triangle.area());

				let incidentTriangles = vertex < triangleItem.ids.length ? this._facesIds[triangleItem.ids[vertex]] : [];
				incidentTriangles.forEach(incTriang => {
					let area = incTriang.triangle.area();
					let incNormal = incTriang.triangle.perFaceNormal.clone();
					incNormal.mulApply(area);

					perVertexNormal.plusApply(incNormal);
				});

				if (flipNormals) {
					perVertexNormal.mulApply(-1);
				}
				perVertexNormal.normalize();
				triangle.setPerVertexNormal(vertex, perVertexNormal);
			}
		});

		console.log(`Normals time ${((Date.now() - time) / 1000).toFixed(2)}s`);
	}
}
