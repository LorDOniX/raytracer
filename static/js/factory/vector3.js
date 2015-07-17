raytracer.factory("Vector3", function() {
	
	var Vector3 = function(x, y, z) {
		this._x = x || 0;
		this._y = y || 0;
		this._z = z || 0;
	};

	// get read; also get and write
	Vector3.prototype.rwData = function() {
		return {
			x: this._x,
			y: this._y,
			z: this._z
		}
	};

	return Vector3;
});
