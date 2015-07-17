raytracer.factory("Vector3", function() {
	
	var Vector3 = function(x, y, z) {
		this.setXYZ(x, y, z);
	};

	// get read; also get and write
	Vector3.prototype.rwData = function() {
		return {
			x: this._x,
			y: this._y,
			z: this._z
		}
	};

	// get read; also get and write
	Vector3.prototype.setXYZ = function(x, y, z) {
		this._x = x || 0;
		this._y = y || 0;
		this._z = z || 0;
	};

	Vector3.prototype.setX = function(value) {
		this._x = value;
	};

	Vector3.prototype.setY = function(value) {
		this._y = value;
	};

	Vector3.prototype.setZ = function(value) {
		this._z = value;
	};

	Vector3.prototype.norm = function() {
		return Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z);
	};

	Vector3.prototype.getAxisValue = function(axis) {
		switch (axis) {
			case 1:
				return this._y;
				break;
			case 2:
				return this._z;
				break;
			default:
				return this._x;
		}
	};

	Vector3.prototype.normalize = function() {
		var rn = 1 / this.norm();

		this._x *= rn;
		this._y *= rn;
		this._z *= rn;
	};

	Vector3.prototype.crossProduct = function(vec3) {
		var v = vec3.rwData();

		return new Vector3(
			this._y * v.z - this._z * v.y,
			this._z * v.x - this._x * v.z,
			this._x * v.y - this._y * v.x
		);
	};

	Vector3.prototype.normal = function(vec3) {
		var v = vec3.rwData();

		return new Vector3(
			this._y * v.z - this._z * v.y,
			this._z * v.x - this._x * v.z,
			this._x * v.y - this._y * v.x
		);
	};

	Vector3.prototype.dotProduct = function(vec3) {
		var v = vec3.rwData();

		return this._x * v.x + this._y * v.y + this._z * v.z;
	};

	// je prazdny vektor
	Vector3.prototype.isEmpty = function() {
		if (x == 0 && y == 0 && z == 0) return (true);
		else return (false);
	};

	// operator*=
	Vector3.prototype.multiplyAssign = function(vec3, a) {
		if (arguments.length == 2) {
			var v = vec3.rwData();
			a = a || 1;

			this._x *= v.x * a;
			this._y *= v.y * a;
			this._z *= v.z * a;
		}
		else {
			// pouze 1 argument a to cislo
			this._x *= vec3;
			this._y *= vec3;
			this._z *= vec3;
		}
	};

	// operator+=
	Vector3.prototype.plusAssign = function(vec3a, vec3b) {
		if (!vec3a || !vec3b) {
			console.error("plusAssign")
			return;
		}
		var u = vec3a.rwData();
		var v = vec3b ? vec3b.rwData() : { x: 0, y: 0, z: 0 };

		this._x += u.x + v.x;
		this._y += u.y + u.y;
		this._z += u.z + u.z;
	};

	// operator-=
	Vector3.prototype.minusAssign = function(vec3a, vec3b) {
		var u = vec3a.rwData();
		var v = vec3b.rwData();

		this._x -= u.x - v.x;
		this._y -= u.y - u.y;
		this._z -= u.z - u.z;
	};

	// operator- [vec3b]
	Vector3.prototype.minus = function(vec3a, vec3b) {
		var u = vec3a.rwData();
		var v = vec3b ? vec3b.rwData() : { x: 0, y: 0, z: 0 };

		this._x -= u.x - v.x;
		this._y -= u.y - v.y;
		this._z -= u.z - v.z;
	};

	// operator+
	Vector3.prototype.plus = function(vec3a, vec3b) {
		var u = vec3a.rwData();
		var v = vec3b.rwData();

		this._x += u.x + v.x;
		this._y += u.y + v.y;
		this._z += u.z + v.z;
	};

	// static methods
	
	// operator*
	Vector3.multiply = function(a, b) {
		var aIsVec3 = a instanceof Vector3;
		var bIsVec3 = b instanceof Vector3;

		if (typeof a === "number" && bIsVec3) {
			var v = b.rwData();

			return new Vector3(a * v.x, a * v.y, a * v.z);
		}
		else if (aIsVec3 && typeof b === "number") {
			var v = a.rwData();

			return new Vector3(a * v.x, a * v.y, a * v.z);
		}
		else if (aIsVec3 && bIsVec3) {
			var u = a.rwData();
			var v = b.rwData();

			return new Vector3(u.x * v.x, u.y * v.y, u.z * v.z);
		}
		else return null;
	};

	Vector3.divide = function(vec3, a) {
		return Vector3.multiply(vec3, 1 / a);
	};

	// min 2 arguments, max 3 arg
	Vector3.minus = function(vec3a, vec3b, vec3c) {
		var u = vec3a.rwData();
		var v = vec3b.rwData();
		var w = vec3c ? vec3c.rwData() : { x: 0, y: 0, z: 0 };

		return new Vector3(
			u.x - v.x - w.x,
			u.y - v.y - w.y,
			u.z - v.z - w.z
		);
	};

	// min 2 arguments, max 3 arg
	Vector3.plus = function(vec3a, vec3b, vec3c) {
		var u = vec3a.rwData();
		var v = vec3b.rwData();
		var w = vec3c ? vec3c.rwData() : { x: 0, y: 0, z: 0 };

		return new Vector3(
			u.x + v.x + w.x,
			u.y + v.y + w.y,
			u.z + v.z + w.z
		);
	};

	return Vector3;
});
