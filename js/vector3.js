var Vector3 = function () {
	this.init.apply(this, arguments);
};

Vector3.prototype = {
	x: 0, // coordinates
	y: 0,
	z: 0,
	init: function (x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
	}
};