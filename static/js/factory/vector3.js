raytracer.factory("Vector3", function() {
	
	var Vector3 = function(x, y, z) {
		this._x = x || 0;
		this._y = y || 0;
		this._z = z || 0;
	};

	return Vector3;
});
