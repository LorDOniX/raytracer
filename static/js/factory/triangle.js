raytracer.factory("Triangle", function() {
	
	var Triangle = function(vectorA, vectorB, vectorC, normalX, normalY, normalZ) {
		// 3 vertex of triangle
		this._vertex = [];
		// xyz normal
		this._normal = [];

		this._vertex[0] = vectorA;
		this._vertex[1] = vectorB;
		this._vertex[2] = vectorC;

		this._normal[0] = normalX;
		this._normal[1] = normalY;
		this._normal[2] = normalZ;
	};

	// get read; also get and write
	Triangle.prototype.rwData = function() {
		return {
			vertex: this._vertex,
			normal: this._normal
		};
	};

	Triangle.prototype.getVertex = function() {
		return this._vertex;
	};

	Triangle.prototype.getNormal = function() {
		return this._normal;
	}

	return Triangle;
});
