import Vector3 from "./vector3";
import AABB from "./aabb";

export default class Triangle {
	constructor(p0, p1, p2, pvn0, pvn1, pvn2, flipNormal) {
		this._vertices = [
			p0 || new Vector3(),
			p1 || new Vector3(),
			p2 || new Vector3()
		];
		this._perVertexNormals = [
			pvn0 || new Vector3(),
			pvn1 || new Vector3(),
			pvn2 || new Vector3()
		];
		this._perFaceNormal = new Vector3();
		this._bounds = this._getBounds();
		this._area = this._getArea();

		this._updatePerFaceNormal(flipNormal);
	}

	get perFaceNormal() {
		return this._perFaceNormal;
	}

	get vertices() {
		return this._vertices;
	}

	get perVertexNormals() {
		return this._perVertexNormals;
	}

	setPerVertexNormal(ind, normal) {
		this._perVertexNormals[ind] = normal;
	}

	bounds() {
		return this._bounds;
	}

	area() {
		return this._area;
	}

	normal(p) {
		let v0 = this._vertices[2].minus(this._vertices[0]);
		let v1 = this._vertices[1].minus(this._vertices[0]);
		let v2 = p.minus(this._vertices[0]);

		let dot00 = v0.dotProduct(v0);
		let dot01 = v0.dotProduct(v1);
		let dot02 = v0.dotProduct(v2);
		let dot11 = v1.dotProduct(v1);
		let dot12 = v1.dotProduct(v2);

		let invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
		let u = (dot11 * dot02 - dot01 * dot12) * invDenom;
		let v = (dot00 * dot12 - dot01 * dot02) * invDenom;
		let n = this._perVertexNormals[0].plus(
			this._perVertexNormals[2].minus(this._perVertexNormals[0]).mul(u),
			this._perVertexNormals[1].minus(this._perVertexNormals[0]).mul(v)
		);
		n.normalize();

		return n;
	}

	_getBounds() {
		// min vektor
		let minVec = new Vector3(
			Math.min(Math.min(this._vertices[0].x, this._vertices[1].x), this._vertices[2].x),
			Math.min(Math.min(this._vertices[0].y, this._vertices[1].y), this._vertices[2].y),
			Math.min(Math.min(this._vertices[0].z, this._vertices[1].z), this._vertices[2].z)
		);

		// max vektor
		let maxVec = new Vector3(
			Math.max(Math.max(this._vertices[0].x, this._vertices[1].x), this._vertices[2].x),
			Math.max(Math.max(this._vertices[0].y, this._vertices[1].y), this._vertices[2].y),
			Math.max(Math.max(this._vertices[0].z, this._vertices[1].z), this._vertices[2].z)
		);

		return new AABB(minVec, maxVec);
	}

	_getArea() {
		let a = this._vertices[0].minus(this._vertices[1]).norm();
		let b = this._vertices[1].minus(this._vertices[2]).norm();
		let c = this._vertices[2].minus(this._vertices[0]).norm();
		let s = (a + b + c) * 0.5;

		return Math.sqrt(s * (s - a) * (s - b) * (s - c));
	}

	_updatePerFaceNormal(flipNormal) {
		this._perFaceNormal = this._vertices[1].minus(this._vertices[0]).crossProduct(this._vertices[2].minus(this._vertices[0]));

		if (flipNormal) {
			this._perFaceNormal.mulApply(-1);
		}

		this._perFaceNormal.normalize();
	}
}
