raytracer.factory("Face", function() {
	
	var Face = function() {
		// 3 vrcholy
		this._vertexIndices = new Array(3);
		// 3 normaly
		this._perVertexNormalIndicies = new Array(3);

		this._vertexIndices[0] = -1;
		this._vertexIndices[1] = -1;
		this._vertexIndices[2] = -1;

		this._perVertexNormalIndicies[0] = -1;
		this._perVertexNormalIndicies[1] = -1;
		this._perVertexNormalIndicies[2] = -1;
	};

	Face.prototype.setVertexIndicies = function(ind, value) {
		this._vertexIndices[ind] = value;
	};

	Face.prototype.setperVertexNormalIndicies = function() {
	};

	Face.prototype.rwData = function() {
		return {
			perVertexNormalIndicies: this._perVertexNormalIndicies,
			vertexIndices: this._vertexIndices
		}
	};

	return Face;
});
