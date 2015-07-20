raytracer.factory("Camera", [
	"Vector3",
	"Funcs",
	"Ray",
function(
	Vector3,
	Funcs,
	Ray
) {
	
	var Camera = function() {
		// sirka vyska obrazku
		this._width = 160; // 640
		this._height = 120; // 480
		// pomer
		this._aspect = 1.333;
		// uhel otoceni oka
		this._fovY = 45;
		// oko
		this._eye = new Vector3(-0.067, 0.237, 0.184);

		// transformacni matice 3x3
		this._tm = new Array(3);

		for (var i = 0; i < 3; i++) {
			this._tm[i] = new Array(3);
		}

		this._tm[0][0] = -0.982;
		this._tm[0][1] = 0.064;
		this._tm[0][2] = 0.177;
		this._tm[1][0] = -0.189;
		this._tm[1][1] = -0.334;
		this._tm[1][2] = -0.924;
		this._tm[2][0] = 0.0;
		this._tm[2][1] = 0.940;
		this._tm[2][2] = -0.340;
	};

	Camera.prototype.generateRay = function(sx, sy) {
		var fovX = this._fovY * this._aspect;

		var x = ((2 * sx - this._width) / this._width) * Math.tan(Funcs.deg2rad(fovX * 0.5));
		 
		var y = ((2 * sy - this._height) / this._height) * Math.tan(Funcs.deg2rad(this._fovY * 0.5));

		// smer noveho paprsku
		var direction = new Vector3(x, -y, 1);
		direction.normalize();

		var d = direction.rwData();

		var direction_transformed = new Vector3(
			this._tm[0][0] * d.x + this._tm[0][1] * d.y + this._tm[0][2] * d.z,
			this._tm[1][0] * d.x + this._tm[1][1] * d.y + this._tm[1][2] * d.z,
			this._tm[2][0] * d.x + this._tm[2][1] * d.y + this._tm[2][2] * d.z
		);

		// paprsek
		var ray = new Ray(this._eye, direction_transformed);

		// paprsek pozadi
		// smer noveho paprsku
		var bdirection = new Vector3(x, y, 1); 
		bdirection.normalize();

		var b = bdirection.rwData();

		var newBdirection = new Vector3(
			-1 * b.x + 0 * b.y + 0 * b.z,
			0 * b.x + -1 * b.y + 0 * b.z,
			0 * b.x + 0 * b.y + -0.5 * b.z
		);

		ray.bdirection = newBdirection;

		// vracime
		return (ray);
	};

	Camera.prototype.getWidth = function() {
		return this._width;
	};

	Camera.prototype.getHeight = function() {
		return this._height;
	};

	Camera.prototype.setWidth = function(width) {
		this._width = width;
	};

	Camera.prototype.setHeight = function(height) {
		this._height = height;
	};

	return Camera;
}]);
