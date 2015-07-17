raytracer.factory("Node", function() {
	
	var Node = function(from, to) {
		// omezujici kvadr vsech itemu v uzlu
		this._bounding = null;
		// uzavreny interval vsech indexu
		this._span = new Array(2);
		// dva potomci max. leva a prava cast
		this._children = new Array(2);

		this._span[0] = from; 
		this._span[1] = to;
	};

	Node.prototype.isLeaf = function() {
		return (!this._children[0] && !this._children[1]);
	};

	Node.prototype.setBounding = function(bounding) {
		this._bounding = bounding;
	};

	Node.prototype.addChildren = function(children) {
		if (!this._children[0]) {
			this._children[0] = children;
		}
		else if (!this._children[1]) {
			this._children[1] = children;
		}
	};

	Node.prototype.rwData = function() {
		return {
			bounding: this._bounding,
			span: this._span,
			children: this._children
		};
	};

	return Node;
});
