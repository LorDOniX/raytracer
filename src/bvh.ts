import * as math from "./math";
import AABB from "./aabb";
import type { Axis } from "./vector3";
import type Ray from "./ray";
import type Triangle from "./triangle";
import type Geometry from "./geometry";

export interface BVHOptions {
	maxLeafItems: number;
}

class BVHNode {
	private _from: number;
	private _to: number;
	private _triangles: Triangle[];
	private _leftChild: BVHNode | null;
	private _rightChild: BVHNode | null;
	private _bounding: AABB;

	constructor(from: number, to: number, triangles: Triangle[]) {
		this._from = from;
		this._to = to;
		this._triangles = triangles;
		this._leftChild = null;
		this._rightChild = null;
		this._bounding = new AABB();

		// bounding
		for (let i = this._from; i <= this._to; i++) {
			this._bounding.merge(this._triangles[i].bounds());
		}
	}

	set leftChild(child: BVHNode | null) {
		this._leftChild = child;
	}

	set rightChild(child: BVHNode | null) {
		this._rightChild = child;
	}

	get leftChild(): BVHNode | null {
		return this._leftChild;
	}

	get rightChild(): BVHNode | null {
		return this._rightChild;
	}

	get isLeaf(): boolean {
		return (this._leftChild === null && this._rightChild === null);
	}

	bounds(): AABB {
		return this._bounding;
	}

	rayTrianglesTest(ray: Ray): void {
		// projdeme trojuhelniky
		for (let i = this._from; i <= this._to && !ray.finished; i++) {
			math.rayTriangleIntersection97(ray, this._triangles[i]);
		}
	}
}

export default class BVH {
	private _opts: BVHOptions;
	private _triangles: Triangle[];
	private _leafs: number;
	private _nodes: number;
	private _maxDepth: number;
	private _root: BVHNode;
	// zasobnik odlozenych (vzdalenejsich) uzlu pri pruchodu a vzdalenosti vstupu do jejich boxu
	private _stack: BVHNode[];
	private _stackDistances: Float64Array;

	constructor(geometry: Geometry, opts?: Partial<BVHOptions>) {
		this._opts = Object.assign({
			maxLeafItems: 8
		}, opts);
		this._triangles = geometry.triangles;
		this._leafs = 0;
		this._nodes = 0;
		this._maxDepth = 0;

		// zaklad zasobnikova metoda
		this._root = this._buildTree(0, this._triangles.length - 1, 0, 2);
		this._nodes++;

		// na kazde urovni se odlozi nejvys jeden uzel
		this._stack = new Array(this._maxDepth + 1);
		this._stackDistances = new Float64Array(this._maxDepth + 1);

		this._showInfo();
	}

	traverse(ray: Ray): void {
		if (math.rayBoxIntersection(ray, this._root.bounds()) === Infinity) {
			return;
		}

		let stack = this._stack;
		let distances = this._stackDistances;
		let size = 0;
		// aktualni uzel, jeho box uz prosel testem
		let node: BVHNode | null = this._root;

		while (node) {
			if (node.isLeaf) {
				node.rayTrianglesTest(ray);

				if (ray.finished) {
					return;
				}
			}
			else {
				let near: BVHNode = node.leftChild!;
				let far: BVHNode = node.rightChild!;
				let nearDistance = math.rayBoxIntersection(ray, near.bounds());
				let farDistance = math.rayBoxIntersection(ray, far.bounds());

				// blizsi potomek napred, vzdalenejsi se pak muze oriznout podle nalezeneho zasahu
				if (farDistance < nearDistance) {
					let tmp = near;
					near = far;
					far = tmp;

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
			node = null;

			while (size > 0) {
				size--;

				if (distances[size] <= ray.distance) {
					node = stack[size];
					break;
				}
			}
		}
	}

	private _buildTree(from: number, to: number, depth: number, axis: Axis): BVHNode {
		let n = to - from + 1;
		let node = new BVHNode(from, to, this._triangles);

		if (n <= this._opts.maxLeafItems) {
			this._leafs++;
			this._maxDepth = Math.max(depth, this._maxDepth);

			return node;
		}

		// pokud to neni leaf -> node
		this._nodes += 2;

		let pivot = (n / 2 + from) >>> 0;

		math.sortTriangles(this._triangles, from, n, axis);

		// rozdeleni na dva pod-intervaly
		axis = ((axis + 1) % 3) as Axis;

		// leafy
		node.leftChild = this._buildTree(from, pivot - 1, depth + 1, axis);
		node.rightChild = this._buildTree(pivot, to, depth + 1, axis);

		// vraci koren
		return node;
	}

	private _showInfo(): void {
		console.log(`BVH`);
		console.log(`Leafs      : ${ this._leafs }`);
		console.log(`Nodes      : ${ this._nodes }`);
		console.log(`Items      : ${ this._triangles.length }`);
		console.log(`Max depth  : ${ this._maxDepth }`);
		console.log(`Leaf items : ${ this._opts.maxLeafItems }`);
		console.log(`Bounds     : ${ this._root.bounds().minVec } x ${ this._root.bounds().maxVec }`);
	}
}
