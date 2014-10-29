window.onload = function () {
	try {
		//var raytracer = new Raytracer();



		//var TestInherit = { events: new Array() };

		/*


		var extend2 = function (destination, source) {

		for (var property in source) {
		if (destination[property] && (typeof (destination[property]) == 'object')
		&& (destination[property].toString() == '[object Object]') && source[property])
		extend(destination[property], source[property]);
		else if (source.hasOwnProperty(property))
		destination[property] = source[property];
		}
		return destination;
		}*/

		/*

		var Test = function () {
		this.mojePole = new Array();
		this.init = function(a) {
		this.mojePole.push(a);
		};
		this.init.apply(this, arguments);
		};

		*/


		Object.prototype.extend = function () {
			var arg, prop;
			var output = this;
			var args = Array.prototype.slice.call(arguments, 0);
			for (arg = 0; arg < args.length; arg++) {
				for (prop in args[arg]) {
					if (args[arg].hasOwnProperty(prop)) output[prop] = args[arg][prop];
				}
			}
			//return output;
		};

		Object.prototype.pto = function () {
			var output = {};
			for (var prop in this) {
				if (this.hasOwnProperty(prop)) output[prop] = this[prop];
			}
			return output;
		};

		var TestInherit = function () {
			this.events = new Array();
		};

		var Test = function () {
			var a = this;
			var b = new TestInherit();
			var c = adaads.pto();
			this.extend(b, c);
			this.init.apply(this, arguments);
		};

		adaads = (function (global) {
			var adaads = {
				mojePole: new Array(),
				init: function (a) {
					this.mojePole.push(a);
					this.events.push("tady" + a);
					console.log("init Test");
				}
			};
			return adaads;
		}
		)(this);

		//console.log(Test.prototype.pto());
		//console.log(Test.prototype.pto());

		/*
		console.log(Object.create(Test.prototype));

		for (var a in Test.prototype) {
		if (Test.prototype.hasOwnProperty(a)) {
		console.log(a);
		}
		}*/


		var x = new Test(10);
		console.log(x);
		var y = new Test(23);
		console.log(y);

	}
	catch (err) {
		if (err.stack)
			console.log(err.stack);
		else
			console.log("Error = " + err);
	}
};