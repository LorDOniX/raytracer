import Vector3 from "./vector3";

export default class AABB {
	constructor(minVec, maxVec) {
		this._minVec = minVec || new Vector3(Infinity, Infinity, Infinity);
		this._maxVec = maxVec || new Vector3(-Infinity, -Infinity, -Infinity);
	}

	get minVec() {
		return this._minVec;
	}

	get maxVec() {
		return this._maxVec;
	}

	merge(aabb) {
		// minima z nimin
		let minX = Math.min(this._minVec.x, aabb.minVec.x);
		let minY = Math.min(this._minVec.y, aabb.minVec.y);
		let minZ = Math.min(this._minVec.z, aabb.minVec.z);

		// maxima z maxim
		let maxX = Math.max(this._maxVec.x, aabb.maxVec.x);
		let maxY = Math.max(this._maxVec.y, aabb.maxVec.y);
		let maxZ = Math.max(this._maxVec.z, aabb.maxVec.z);

		this._minVec.setXYZ(minX, minY, minZ);
		this._maxVec.setXYZ(maxX, maxY, maxZ);
	}

	centroid() {
		// secteme a podelime 2, vratime
		return new Vector3((this._minVec.x + this._maxVec.x) / 2, (this._minVec.y + this._maxVec.y) / 2, (this._minVec.z + this._maxVec.z) / 2);
	}
}
