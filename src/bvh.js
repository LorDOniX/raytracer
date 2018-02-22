import * as math from "./math";
import AABB from "./aabb";

class BVHNode {
	constructor(from, to, triangles) {
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

	set leftChild(child) {
		this._leftChild = child;
	}

	set rightChild(child) {
		this._rightChild = child;
	}

	get leftChild() {
		return this._leftChild;
	}

	get rightChild() {
		return this._rightChild;
	}

	get isLeaf() {
		return (this._leftChild === null && this._rightChild === null);
	}

	bounds() {
		return this._bounding;
	}

	rayTrianglesTest(ray) {
		// projdeme trojuhelniky
		for (let i = this._from; i <= this._to; i++) {
			math.rayTriangleIntersection97(ray, this._triangles[i]);
		}
	}
}

export default class BVH {
	constructor(geometry, opts) {
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

		this._showInfo();
	}

	traverse(ray) {
		this._traverse(ray, this._root, -Infinity, Infinity);
	}

	_buildTree(from, to, depth, axis) {
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
		axis = (axis + 1) % 3;

		// leafy
		node.leftChild = this._buildTree(from, pivot - 1, depth + 1, axis);
		node.rightChild = this._buildTree(pivot, to, depth + 1, axis);

		// vraci koren
		return node;
	}

	_traverse(ray, node, t0, t1) {
		if (math.rayBoxIntersection(ray, node.bounds(), t0, t1)) {
			if (node.isLeaf) {
				node.rayTrianglesTest(ray);
			}
			else {
				// projdeme oba potomky
				this._traverse(ray, node.leftChild, t0, t1);
				this._traverse(ray, node.rightChild, t0, t1);
			}
		}
	}

	_showInfo() {
		console.log(`BVH`);
		console.log(`Leafs      : ${ this._leafs }`);
		console.log(`Nodes      : ${ this._nodes }`);
		console.log(`Items      : ${ this._triangles.length }`);
		console.log(`Max depth  : ${ this._maxDepth }`);
		console.log(`Leaf items : ${ this._opts.maxLeafItems }`);
		console.log(`Bounds     : ${ this._root.bounds().minVec } x ${ this._root.bounds().maxVec }`);
	}
}
