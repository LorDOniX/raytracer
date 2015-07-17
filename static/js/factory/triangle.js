raytracer.factory("Triangle", function() {
	
	var Triangle = function(vectorA, vectorB, vectorC, normalX, normalY, normalZ) {
		this._vertex = []; // 3 vertex of triangle
		this._normal = []; // xyz normal
		this._vertex = [];

		this._vertex[0] = vectorA;
		this._vertex[1] = vectorB;
		this._vertex[2] = vectorC;
	};

	return Triangle;
});
