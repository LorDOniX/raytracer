import * as math from "./math";
import Mesh from "./mesh";
import { createFloat64Array, createInt32Array } from "./shared";
import type { MeshData } from "./mesh";
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

// pocet kosu pro SAH
const SAH_BINS = 16;

// stavba stromu, uzly se deli podle SAH
class BVHBuilder {
	private _opts: BVHOptions;
	private _leafs: number;
	private _nodes: number;
	private _maxDepth: number;
	private _bounds: Float64Array;
	private _items: Int32Array;
	// boxy trojuhelniku po 6 cislech (min x, y, z, max x, y, z) a jejich teziste po 3 cislech
	private _triangleBounds: Float64Array;
	private _centroids: Float64Array;
	// pracovni pole SAH: pocty a boxy trojuhelniku v kosich, plochy pravych casti, prubezny box
	private _binCounts: Int32Array;
	private _binBounds: Float64Array;
	private _rightAreas: Float64Array;
	private _sweepBox: Float64Array;
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
		this._triangleBounds = new Float64Array(count * 6);
		this._centroids = new Float64Array(count * 3);
		this._binCounts = new Int32Array(SAH_BINS);
		this._binBounds = new Float64Array(SAH_BINS * 6);
		this._rightAreas = new Float64Array(SAH_BINS - 1);
		this._sweepBox = new Float64Array(6);
		this._prepareTriangles(mesh.vertices, count);

		// zaklad zasobnikova metoda
		this._nodes++;
		this._buildTree(0, order, 0, count - 1, 0);

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
	private _buildTree(node: number, order: Int32Array, from: number, to: number, depth: number): void {
		let n = to - from + 1;

		this._setBounds(node, order, from, to);

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

		let pivot = this._sahSplit(order, from, to);

		// vsechna teziste v jednom bode, na poradi nezalezi, rozdelime v polovine
		if (pivot < 0) {
			pivot = (n / 2 + from) >>> 0;
		}

		// leafy
		this._buildTree(left, order, from, pivot - 1, depth + 1);
		this._buildTree(left + 1, order, pivot, to, depth + 1);
	}

	/**
	 * Rozdeleni podle SAH (surface area heuristic) s kosi: teziste se v ose s nejvetsim rozsahem rozradi
	 * do SAH_BINS kosu a vybere se rez s nejmensim souctem plocha boxu * pocet trojuhelniku na obou stranach.
	 * Zkouset vsechny tri osy dava skoro stejny strom a stavba je o tretinu pomalejsi.
	 * Trojuhelniky v order[from..to] preradi, vraci index prvniho v prave casti, -1 pokud nejde rozdelit.
	 */
	private _sahSplit(order: Int32Array, from: number, to: number): number {
		let centroids = this._centroids;
		let binCounts = this._binCounts;
		let binBounds = this._binBounds;
		let rightAreas = this._rightAreas;
		// rozsah tezist
		let minX = Infinity;
		let minY = Infinity;
		let minZ = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		let maxZ = -Infinity;

		for (let i = from; i <= to; i++) {
			let c = order[i] * 3;

			minX = Math.min(minX, centroids[c]);
			minY = Math.min(minY, centroids[c + 1]);
			minZ = Math.min(minZ, centroids[c + 2]);
			maxX = Math.max(maxX, centroids[c]);
			maxY = Math.max(maxY, centroids[c + 1]);
			maxZ = Math.max(maxZ, centroids[c + 2]);
		}

		// osa s nejvetsim rozsahem
		let axis = 0;
		let min = minX;
		let extent = maxX - minX;

		if (maxY - minY > extent) {
			axis = 1;
			min = minY;
			extent = maxY - minY;
		}

		if (maxZ - minZ > extent) {
			axis = 2;
			min = minZ;
			extent = maxZ - minZ;
		}

		if (!(extent > 0)) {
			return -1;
		}

		let scale = SAH_BINS / extent;
		let lastBin = SAH_BINS - 1;

		binCounts.fill(0);

		for (let bin = 0; bin < SAH_BINS; bin++) {
			binBounds.fill(Infinity, bin * 6, bin * 6 + 3);
			binBounds.fill(-Infinity, bin * 6 + 3, bin * 6 + 6);
		}

		for (let i = from; i <= to; i++) {
			let t = order[i];

			this._addToBin(Math.min((centroids[t * 3 + axis] - min) * scale | 0, lastBin), t);
		}

		// plochy pravych casti (kose bin + 1 az konec)
		this._resetSweepBox();

		for (let bin = lastBin; bin > 0; bin--) {
			rightAreas[bin - 1] = this._sweepBin(bin);
		}

		// leve casti postupne zvetsujeme a porovnavame cenu rezu za kosem bin
		this._resetSweepBox();

		let total = to - from + 1;
		let leftCount = 0;
		let bestCost = Infinity;
		let bestBin = 0;

		for (let bin = 0; bin < lastBin; bin++) {
			let leftArea = this._sweepBin(bin);

			leftCount += binCounts[bin];

			if (leftCount === 0 || leftCount === total) {
				continue;
			}

			let cost = leftArea * leftCount + rightAreas[bin] * (total - leftCount);

			if (cost < bestCost) {
				bestCost = cost;
				bestBin = bin;
			}
		}

		// vlevo trojuhelniky z kosu 0..bestBin
		let i = from;
		let j = to;

		while (i <= j) {
			let t = order[i];

			if (Math.min((centroids[t * 3 + axis] - min) * scale | 0, lastBin) <= bestBin) {
				i++;
			}
			else {
				order[i] = order[j];
				order[j--] = t;
			}
		}

		return i;
	}

	// prida box trojuhelniku t do kosu bin
	private _addToBin(bin: number, t: number): void {
		let binBounds = this._binBounds;
		let triangleBounds = this._triangleBounds;
		let b = bin * 6;

		t *= 6;
		this._binCounts[bin]++;
		binBounds[b] = Math.min(binBounds[b], triangleBounds[t]);
		binBounds[b + 1] = Math.min(binBounds[b + 1], triangleBounds[t + 1]);
		binBounds[b + 2] = Math.min(binBounds[b + 2], triangleBounds[t + 2]);
		binBounds[b + 3] = Math.max(binBounds[b + 3], triangleBounds[t + 3]);
		binBounds[b + 4] = Math.max(binBounds[b + 4], triangleBounds[t + 4]);
		binBounds[b + 5] = Math.max(binBounds[b + 5], triangleBounds[t + 5]);
	}

	private _resetSweepBox(): void {
		this._sweepBox.fill(Infinity, 0, 3);
		this._sweepBox.fill(-Infinity, 3, 6);
	}

	// prida kos k _sweepBox, vraci plochu (polovinu povrchu) vysledneho boxu
	private _sweepBin(bin: number): number {
		let box = this._sweepBox;
		let binBounds = this._binBounds;

		if (this._binCounts[bin] > 0) {
			for (let k = 0; k < 3; k++) {
				box[k] = Math.min(box[k], binBounds[bin * 6 + k]);
				box[k + 3] = Math.max(box[k + 3], binBounds[bin * 6 + 3 + k]);
			}
		}

		let dx = box[3] - box[0];
		let dy = box[4] - box[1];
		let dz = box[5] - box[2];

		return dx * dy + dy * dz + dz * dx;
	}

	// boxy a teziste trojuhelniku se spocitaji jednou predem
	private _prepareTriangles(vertices: Float64Array, count: number): void {
		for (let i = 0; i < count; i++) {
			for (let axis = 0; axis < 3; axis++) {
				let a = vertices[i * 9 + axis];
				let b = vertices[i * 9 + 3 + axis];
				let c = vertices[i * 9 + 6 + axis];
				let min = Math.min(Math.min(a, b), c);
				let max = Math.max(Math.max(a, b), c);

				this._triangleBounds[i * 6 + axis] = min;
				this._triangleBounds[i * 6 + 3 + axis] = max;
				this._centroids[i * 3 + axis] = (min + max) / 2;
			}
		}
	}

	// box uzlu obalujici boxy jeho trojuhelniku
	private _setBounds(node: number, order: Int32Array, from: number, to: number): void {
		let bounds = this._bounds;
		let triangleBounds = this._triangleBounds;
		let b = node * 6;
		let minX = Infinity;
		let minY = Infinity;
		let minZ = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		let maxZ = -Infinity;

		for (let i = from; i <= to; i++) {
			let t = order[i] * 6;

			minX = Math.min(minX, triangleBounds[t]);
			minY = Math.min(minY, triangleBounds[t + 1]);
			minZ = Math.min(minZ, triangleBounds[t + 2]);
			maxX = Math.max(maxX, triangleBounds[t + 3]);
			maxY = Math.max(maxY, triangleBounds[t + 4]);
			maxZ = Math.max(maxZ, triangleBounds[t + 5]);
		}

		bounds[b] = minX;
		bounds[b + 1] = minY;
		bounds[b + 2] = minZ;
		bounds[b + 3] = maxX;
		bounds[b + 4] = maxY;
		bounds[b + 5] = maxZ;
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
