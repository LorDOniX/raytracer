var Raytracer = function () {
	this.init.apply(this, arguments);
};

Raytracer.prototype = {
	init: function () {
		window.raytracer = this; // register
		// ply
		this.ply = new PLY("http://localhost/raytracer/model/bunnyn.ply");
		console.log("Raytracer start...");
	}
};