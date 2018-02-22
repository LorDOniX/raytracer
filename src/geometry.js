import Vector3 from "./vector3";
import Triangle from "./triangle";

export default class Geometry {
	constructor(ply, opts) {
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

	get triangles() {
		return this._triangles;
	}

	_create() {
		let elements = this._ply.elements;

		if ("vertex" in elements) {
			elements.vertex.items.forEach(vertex => {
				let position = new Vector3(vertex.x, vertex.y, vertex.z);
				let normal = new Vector3(vertex.x, vertex.y, vertex.z);
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
				let triangleItem = {
					ids: face.ids,
					triangle: null
				};
				let items = [];

				face.ids.forEach(id => {
					items.push(this._items[id]);

					if (!(id in this._facesIds)) {
						this._facesIds[id] = [];
					}

					this._facesIds[id].push(triangleItem);
				});

				triangleItem.triangle = new Triangle(
					items[0].position,
					items[1].position,
					items[2].position,
					items[0].normal,
					items[1].normal,
					items[2].normal,
					this._opts.flipNormals
				);

				this._triangleItems.push(triangleItem);
				this._triangles.push(triangleItem.triangle);
			});
		}

		this._updatePerVertexNormals(!this._opts.flipNormals);
	}

	_updatePerVertexNormals(flipNormals) {
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
