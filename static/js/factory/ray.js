raytracer.factory("Ray", [
	"Vector3",
function(
	Vector3
) {
	
	// all optional
	var Ray = function(origin, direction) {
		this._origin = origin;
		this._direction = direction;
		// invertovaný paprsek
		this._inv = null;
		if (direction) {
			var d = direction.rwData();

			this._inv = new Vector3(1 / d.x, 1 / d.y, 1 / d.z);
		}
		// vektor pozadi
		this._bdirection;
		this._t = Infinity;
		this._changed = false;
		// zasazeny trojuhelnik
		this._triangle = null;
	};

	// nastavi t, ale nove t musi byt mensi jak posledni jinak se nic nestane
	Ray.prototype.setT = function(t, tri) {
		if (t < this._t) {
			this._changed = true;
			this._t = t;
			this._triangle = tri;
		}
	};

	Ray.prototype.getOrigin = function() {
		return this._origin;
	};

	Ray.prototype.getDirection = function() {
		return this._direction;
	};

	Ray.prototype.getInverted = function() {
		return this._inv;
	};

	Ray.prototype.getTriangle = function() {
		return this._triangle;
	};

	Ray.prototype.target = function() {
		return Vector3.plus(
			this._origin,
			Vector3.multiply(this._t, this._direction)
		);
	};

	return Ray;
}]);
