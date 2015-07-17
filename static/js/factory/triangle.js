raytracer.factory("Triangle", [
	"Vector3",
	"AABB",
function(
	Vector3,
	AABB
) {
	
	// [p0-2]
	var Triangle = function(p0, p1, p2, n0, n1, n2, flipNormal) {
		// normaly v kazdem bode, musim je nacist v geometrii
		this._vertices = new Array(3);
		this._perFaceNormal = new Vector3(0, 0, 0);
		this._perVertexNormals = new Array(3);

		this._vertices[0] = p0 || new Vector3(0, 0, 0);
		this._vertices[1] = p1 || new Vector3(0, 0, 0);
		this._vertices[2] = p2 || new Vector3(0, 0, 0);

		if (n0) {
			this._perVertexNormals[0] = n0 || new Vector3(0, 0, 0);
			this._perVertexNormals[1] = n1 || new Vector3(0, 0, 0);
			this._perVertexNormals[2] = n2 || new Vector3(0, 0, 0);

			this._updatePerFaceNormal(flipNormal);
		}
	};

	// get read; also get and write
	Triangle.prototype.rwData = function() {
		return {
			vertices: this._vertices,
			perFaceNormal: this._perFaceNormal,
			perVertexNormals: this._perVertexNormals
		};
	};

	Triangle.prototype.setPerVertexNormals = function(normalID, normal) {
		this._perVertexNormals[normalID] = normal;
	};

	Triangle.prototype.bounds = function() {
		var output = new AABB();
		var d = output.rwData().bounds;
		var vd0 = this._vertices[0].rwData();
		var vd1 = this._vertices[1].rwData();
		var vd2 = this._vertices[2].rwData();

		// min vektor
		d[0].x = Math.min(Math.min(vd0.x, vd1.x), vd2.x);
		d[0].y = Math.min(Math.min(vd0.y, vd1.y), vd2.y);
		d[0].z = Math.min(Math.min(vd0.z, vd1.z), vd2.z);

		// max vektor
		d[1].x = Math.max(Math.max(vd0.x, vd1.x), vd2.x);
		d[1].y = Math.max(Math.max(vd0.y, vd1.y), vd2.y);
		d[1].z = Math.max(Math.max(vd0.z, vd1.z), vd2.z);

		return output;
	};

	Triangle.prototype._updatePerFaceNormal = function(flipNormal) {
		this._perFaceNormal = Vector3.minus(this._vertices[1], this._vertices[0]).crossProduct(Vector3.minus(this._vertices[2], this._vertices[0]));

		if (flipNormal) {
			this._perFaceNormal.multiplyAssign(-1);
		}

		this._perFaceNormal.normalize();
	};

	Triangle.prototype.area = function() {
		var a = Vector3.minus(this._vertices[0], this._vertices[1]).norm();
		var b = Vector3.minus(this._vertices[1], this._vertices[2]).norm();
		var c = Vector3.minus(this._vertices[2], this._vertices[0]).norm();

		var s = ( a + b + c ) * 0.5;

		return Math.sqrt( s * ( s - a ) * ( s - b ) * ( s - c ) );
	};

	Triangle.prototype.normal = function(vec3) {
		var v0 = Vector3.minus(this._vertices[2], this._vertices[0]);
		var v1 = Vector3.minus(this._vertices[1], this._vertices[0]);
		var v2 = Vector3.minus(vec3, this._vertices[0]);

		var dot00 = v0.dotProduct( v0 );
		var dot01 = v0.dotProduct( v1 );
		var dot02 = v0.dotProduct( v2 );
		var dot11 = v1.dotProduct( v1 );
		var dot12 = v1.dotProduct( v2 );

		var inv_denom = 1 / ( dot00 * dot11 - dot01 * dot01 );
		var u = ( dot11 * dot02 - dot01 * dot12 ) * inv_denom;
		var v = ( dot00 * dot12 - dot01 * dot02 ) * inv_denom;

		var n = Vector3.plus(
			this._perVertexNormals[0],
			Vector3.multiply(u, Vector3.minus(this._perVertexNormals[2], this._perVertexNormals[0])),
			Vector3.multiply(v, Vector3.minus(this._perVertexNormals[1], this._perVertexNormals[0]))
		);

		n.normalize();

		return n;
	};

	return Triangle;
}]);
