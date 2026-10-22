import Vector3 from "./vector3";

export default class Ray {
	private _origin: Vector3;
	private _direction: Vector3;
	private _bgDirection: Vector3;
	private _inverted: Vector3;
	private _distance: number;
	private _changed: boolean;
	// index zasazeneho trojuhelniku (-1 nic) a barycentricke souradnice zasahu (u ve smeru v1 - v0, v ve smeru v2 - v0)
	private _triangle: number;
	private _u: number;
	private _v: number;
	private _anyHit: boolean;

	// maxDistance - zasahy dal nez tato vzdalenost se ignoruji (napr. stinovy paprsek za svetlem)
	// anyHit - staci libovolny zasah, ne nejblizsi (stinovy paprsek), pruchod BVH skonci u prvniho
	constructor(origin?: Vector3, direction?: Vector3, bgDirection?: Vector3, maxDistance = Infinity, anyHit = false) {
		this._origin = origin || new Vector3();
		this._direction = direction || new Vector3();
		this._bgDirection = bgDirection || new Vector3(); // vektor pozadi
		this._inverted = this._direction.inverted(); // invertovany paprsek
		this._distance = maxDistance;
		this._changed = false;
		this._triangle = -1;
		this._u = 0;
		this._v = 0;
		this._anyHit = anyHit;
	}

	get origin(): Vector3 {
		return this._origin;
	}

	get direction(): Vector3 {
		return this._direction;
	}

	get bgDirection(): Vector3 {
		return this._bgDirection;
	}

	get inverted(): Vector3 {
		return this._inverted;
	}

	// vzdalenost nejblizsiho zasahu (pred zasahem maxDistance)
	get distance(): number {
		return this._distance;
	}

	// paprsek uz nema smysl dal sledovat (anyHit a neco zasahl)
	get finished(): boolean {
		return this._anyHit && this._changed;
	}

	get changed(): boolean {
		return this._changed;
	}

	get triangle(): number {
		return this._triangle;
	}

	get u(): number {
		return this._u;
	}

	get v(): number {
		return this._v;
	}

	// nastavi distance, ale nova vzdalenost musi byt mensi jak posledni, jinak se nic nestane
	setTarget(distance: number, triangle: number, u: number, v: number): void {
		if (distance < this._distance) {
			this._changed = true;
			this._distance = distance;
			this._triangle = triangle;
			this._u = u;
			this._v = v;
		}
	}

	// souradnice zasahu
	getTarget(): Vector3 | null {
		if (this._changed) {
			return (this._origin.plus(this._direction.mul(this._distance)));
		}
		else {
			return null;
		}
	}
}
