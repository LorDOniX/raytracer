raytracer.factory("BVH", [
	"Node",
	"Intersection",
function(
	Node,
	Intersection
) {
	
	var BVH = function(geometry, maxLeafItems) {
		// koren stromu
		this._root = null;

		// vsechny trojuhelniky nactene v geometry
		this._items = null;

		// pocty itemu a leafu
		this._leafs = 0;
		this._nodes = 0;
		this._maxDepth = 0;

		// max. pocet
		this._maxLeafItems = maxLeafItems; // max_leaf_items_

		this._itemsCount = geometry.numberOfFaces();
		this._items = geometry.getTriangles();

		console.log("BVH - Build tree\n");
		console.log("Start...\n");

		// zaklad zasobnikova metoda
		this._root = this.buildTree(0, this._itemsCount - 1, 0, 2);

		// jeden si pripocist za root samotny
		this._nodes++;

		this._debugInfo();
	};

	BVH.prototype.buildTree = function(from, to, depth, axis) {
		var n = to - from + 1;

		var node = new Node(from, to);

		for (var i = from; i <= to; i++)
		{
			node.getBounding().merge(this._items[i].bounds());
		}

		if (n <= this._maxLeafItems)
		{
			this._leafs++;
			this._maxDepth = Math.max(depth, this._maxDepth);

			return node;
		}

		// pokud to neni leaf -> node
		this._nodes += 2;

		var pivot = n / 2 + from;

		Intersection.sort(this._items[from], n, axis); 

		// rozdeleni na dva podintervaly
		axis = (axis + 1) % 3;

		// leafy
		node.addChildren(this.buildTree(from, pivot - 1, depth + 1, axis));
		node.addChildren(this.buildTree(pivot, to, depth + 1, axis));

		return node; // vraci koren
	};

	BVH.prototype.traverse = function(ray) {
		this._traverse(ray, this._root, -Infinity, Infinity);
	};

	BVH.prototype._traverse = function(ray, node, t0, t1) {
		var rbi = Intersection.rayBoxIntersection(ray, node.rwData().bounding, t0, t1);
		if (rbi.test)
		{
			if (node.isLeaf())
			{
				var forFrom = node.rwData().span[0];
				var forTo = node.rwData().span[1];

				// projdeme trojuhelniky
				for (var i = forFrom; i <= forTo; i++) {
					Intersection.rayTriangleIntersection97(this._items[i], ray);
				}
			}
			else
			{
				// projdeme oba potomky
				this._traverse(ray, node.rwData().children[0], rbi.t0, rbi.t1);
				this._traverse(ray, node.rwData().children[1], rbi.t0, rbi.t1);
			}
		}
	};

	BVH.prototype._debugInfo = function() {
		console.log("Leafs : %d\n", this._leafs);
		console.log("Nodes : %d\n", this._nodes);
		console.log("Items : %d\n", this._itemsCount);
		console.log("Max d.: %d\n", this._maxDepth);
		console.log("Leaf items: %d\n", this._maxLeafItems);
		console.log("Bounds=(%.3f, %.3f, %.3f) x (%.3f, %.3f, %.3f)\n",
			this._root.bounding.bounds[0].x,
			this._root.bounding.bounds[0].y,
			this._root.bounding.bounds[0].z,
			this._root.bounding.bounds[1].x,
			this._root.bounding.bounds[1].y,
			this._root.bounding.bounds[1].z
		);
	};

	return BVH;
}]);
