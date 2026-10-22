import * as math from "./math";
import Mesh from "./mesh";
import { createFloat64Array, createInt32Array } from "./shared";
import type { MeshData } from "./mesh";
import type { Axis } from "./vector3";
import type Ray from "./ray";

export interface BVHOptions {
	maxLeafItems: number;
}

// BVH a jeho trojuhelniky jako obycejna data (typovana pole), da se poslat workerum
export interface BVHData {
	// trojuhelniky prerazene tak, ze kazdy uzel ma souvisly interval
	mesh: MeshData;
	// boxy uzlu po 6 cislech (min x, y, z, max x, y, z), koren je uzel 0
	bounds: Float64Array;
	// uzly po 2 cislech: list (first, count) - trojuhelniky first..first + count - 1,
	// vnitrni uzel (left, -1) - potomci jsou left a left + 1
	items: Int32Array;
	// hloubka nejhlubsiho listu (koren 0)
	maxDepth: number;
}

export default class BVH {
	private _mesh: Mesh;
	private _bounds: Float64Array;
	private _items: Int32Array;
	// zasobnik odlozenych (vzdalenejsich) uzlu pri pruchodu a vzdalenosti vstupu do jejich boxu
	private _stack: Int32Array;
	private _stackDistances: Float64Array;

	constructor(data: BVHData) {
		this._mesh = new Mesh(data.mesh);
		this._bounds = data.bounds;
		this._items = data.items;

		// na kazde urovni se odlozi nejvys jeden uzel
		this._stack = new Int32Array(data.maxDepth + 1);
		this._stackDistances = new Float64Array(data.maxDepth + 1);
	}

	// postavi strom nad trojuhelniky meshe
	static build(mesh: Mesh, opts?: Partial<BVHOptions>): BVH {
		return new BVH(new BVHBuilder(mesh, opts).data);
	}

	get mesh(): Mesh {
		return this._mesh;
	}

	get data(): BVHData {
		return {
			mesh: this._mesh.data,
			bounds: this._bounds,
			items: this._items,
			maxDepth: this._stack.length - 1
		};
	}

	traverse(ray: Ray): void {
		let bounds = this._bounds;
		let items = this._items;
		let vertices = this._mesh.vertices;
		let origin = ray.origin;
		let direction = ray.direction;
		let inverted = ray.inverted;
		let ox = origin.x;
		let oy = origin.y;
		let oz = origin.z;
		let dx = direction.x;
		let dy = direction.y;
		let dz = direction.z;
		let ix = inverted.x;
		let iy = inverted.y;
		let iz = inverted.z;

		if (math.rayBoxIntersection(bounds, 0, ox, oy, oz, ix, iy, iz, ray.distance) === Infinity) {
			return;
		}

		let stack = this._stack;
		let distances = this._stackDistances;
		let size = 0;
		// aktualni uzel, jeho box uz prosel testem, -1 konec
		let node = 0;

		while (node >= 0) {
			let first = items[node * 2];
			let count = items[node * 2 + 1];

			if (count >= 0) {
				// list, projdeme trojuhelniky
				for (let i = first; i < first + count && !ray.finished; i++) {
					math.rayTriangleIntersection(ray, vertices, i, ox, oy, oz, dx, dy, dz);
				}

				if (ray.finished) {
					return;
				}
			}
			else {
				let near = first;
				let far = first + 1;
				let maxDistance = ray.distance;
				let nearDistance = math.rayBoxIntersection(bounds, near, ox, oy, oz, ix, iy, iz, maxDistance);
				let farDistance = math.rayBoxIntersection(bounds, far, ox, oy, oz, ix, iy, iz, maxDistance);

				// blizsi potomek napred, vzdalenejsi se pak muze oriznout podle nalezeneho zasahu
				if (farDistance < nearDistance) {
					near = far;
					far = first;

					let tmpDistance = nearDistance;
					nearDistance = farDistance;
					farDistance = tmpDistance;
				}

				if (nearDistance !== Infinity) {
					if (farDistance !== Infinity) {
						stack[size] = far;
						distances[size++] = farDistance;
					}

					node = near;
					continue;
				}
			}

			// dalsi odlozeny uzel, ktery nezacina az za nejblizsim zasahem
			node = -1;

			while (size > 0) {
				size--;

				if (distances[size] <= ray.distance) {
					node = stack[size];
					break;
				}
			}
		}
	}
}

// stavba stromu, deleni v polovine podle teziste v ose, ktera se strida
class BVHBuilder {
	private _opts: BVHOptions;
	private _leafs: number;
	private _nodes: number;
	private _maxDepth: number;
	private _bounds: Float64Array;
	private _items: Int32Array;
	private _data: BVHData;

	constructor(mesh: Mesh, opts?: Partial<BVHOptions>) {
		this._opts = Object.assign({
			maxLeafItems: 8
		}, opts);
		this._leafs = 0;
		this._nodes = 0;
		this._maxDepth = 0;

		let count = mesh.count;
		// poradi trojuhelniku, stavba ho radi po intervalech uzlu
		let order = new Int32Array(count);

		for (let i = 0; i < count; i++) {
			order[i] = i;
		}

		// uzlu je nejvys 2 * count - 1, nevyuzity konec se pak oreze
		let maxNodes = Math.max(2 * count - 1, 1);

		this._bounds = new Float64Array(maxNodes * 6);
		this._items = new Int32Array(maxNodes * 2);

		// zaklad zasobnikova metoda
		this._nodes++;
		this._buildTree(0, order, mesh.vertices, 0, count - 1, 0, 2);

		// vysledna pole jsou pri cross-origin isolation sdilena
		let bounds = createFloat64Array(this._nodes * 6);
		let items = createInt32Array(this._nodes * 2);

		bounds.set(this._bounds.subarray(0, bounds.length));
		items.set(this._items.subarray(0, items.length));
		this._data = {
			mesh: mesh.reorder(order).data,
			bounds,
			items,
			maxDepth: this._maxDepth
		};

		this._showInfo();
	}

	get data(): BVHData {
		return this._data;
	}

	// uzel node pro trojuhelniky order[from..to]
	private _buildTree(node: number, order: Int32Array, vertices: Float64Array, from: number, to: number, depth: number, axis: Axis): void {
		let n = to - from + 1;

		this._setBounds(node, order, vertices, from, to);

		if (n <= this._opts.maxLeafItems) {
			this._items[node * 2] = from;
			this._items[node * 2 + 1] = n;
			this._leafs++;
			this._maxDepth = Math.max(depth, this._maxDepth);

			return;
		}

		// pokud to neni leaf -> node, potomci jsou vedle sebe
		let left = this._nodes;

		this._nodes += 2;
		this._items[node * 2] = left;
		this._items[node * 2 + 1] = -1;

		let pivot = (n / 2 + from) >>> 0;

		math.sortTriangles(order, vertices, from, n, axis);

		// rozdeleni na dva pod-intervaly
		axis = ((axis + 1) % 3) as Axis;

		// leafy
		this._buildTree(left, order, vertices, from, pivot - 1, depth + 1, axis);
		this._buildTree(left + 1, order, vertices, pivot, to, depth + 1, axis);
	}

	// box uzlu obalujici vrcholy jeho trojuhelniku
	private _setBounds(node: number, order: Int32Array, vertices: Float64Array, from: number, to: number): void {
		let b = node * 6;

		this._bounds.fill(Infinity, b, b + 3);
		this._bounds.fill(-Infinity, b + 3, b + 6);

		for (let i = from; i <= to; i++) {
			let t = order[i] * 9;

			for (let k = 0; k < 9; k++) {
				let axis = k % 3;

				this._bounds[b + axis] = Math.min(this._bounds[b + axis], vertices[t + k]);
				this._bounds[b + 3 + axis] = Math.max(this._bounds[b + 3 + axis], vertices[t + k]);
			}
		}
	}

	private _showInfo(): void {
		let b = Array.from(this._bounds.subarray(0, 6), value => value.toFixed(5));

		console.log(`BVH`);
		console.log(`Leafs      : ${ this._leafs }`);
		console.log(`Nodes      : ${ this._nodes }`);
		console.log(`Items      : ${ this._data.mesh.faceNormals.length / 3 }`);
		console.log(`Max depth  : ${ this._maxDepth }`);
		console.log(`Leaf items : ${ this._opts.maxLeafItems }`);
		console.log(`Bounds     : (${ b.slice(0, 3).join(", ") }) x (${ b.slice(3).join(", ") })`);
	}
}
