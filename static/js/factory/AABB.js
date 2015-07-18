raytracer.factory("AABB", [
	"Vector3",
function(
	Vector3
) {
	
	var AABB = function() {
		this._bounds = new Array(2);
		// minimum nastaveno na maximum
		this._bounds[0] = new Vector3(Infinity, Infinity, Infinity);
		// maximum nastaveno na minimum
		this._bounds[1] = new Vector3(-Infinity, -Infinity, -Infinity);
	};

	AABB.prototype.rwData = function() {
		return {
			bounds: this._bounds
		};
	};

	AABB.prototype.merge = function(aabb) {
		var b = aabb.rwData();
		var bb0 = b.bounds[0].rwData();
		var bb1 = b.bounds[1].rwData();

		var tb0 = this._bounds[0].rwData();
		var tb1 = this._bounds[1].rwData();

		// minima z nimin
		this._bounds[0].setXYZ(
			Math.min(tb0.x, bb0.x),
			Math.min(tb0.y, bb0.y),
			Math.min(tb0.z, bb0.z)
		);

		// maxima z maxim
		this._bounds[1].setXYZ(
			Math.max(tb1.x, bb1.x),
			Math.max(tb1.y, bb1.y),
			Math.max(tb1.z, bb1.z)
		);
	};

	AABB.prototype.setBounds = function(ind, x, y, z) {
		var b = this._bounds[ind];
		
		b.setX(x);
		b.setY(y);
		b.setZ(z);
	}

	AABB.prototype.centroid = function() {
		var tb0 = this._bounds[0].rwData();
		var tb1 = this._bounds[1].rwData();

		// secteme a podelime 2, vratime
		return new Vector3(
			(tb0.x + tb1.x) / 2,
			(tb0.y + tb1.y) / 2,
			(tb0.z + tb1.z) / 2
		);
	};

	return AABB;
}]);
