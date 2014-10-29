var Triangle = function () {
	this.init.apply(this, arguments);
};

Triangle.prototype = {
	vertex: [], // 3 vertex of triangle
	normal: [], // xyz normal
	init: function (vectorA, vectorB, vectorC, normalX, normalY, normalZ) {
		this.vertex = [];
		this.vertex[0] = vectorA;
		this.vertex[1] = vectorB;
		this.vertex[2] = vectorC;
	}
};