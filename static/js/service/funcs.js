raytracer.service("Funcs", function() {

	this.MAX_REAL = Number.MAX_VALUE;

	this.rnd = function() {
		return Math.floor((Math.random() * (1.0 / Number.MAX_VALUE)));
	};

	this.deg2rad = function(deg) {
		return deg * Math.PI / 180;
	};

	this.sqr = function(a) {
		return a * a;
	};
});
