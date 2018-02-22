var includePaths = require("rollup-plugin-includepaths");
var multiEntry = require('rollup-plugin-multi-entry');
var filesize = require('./filesize');

const CONF = {
	watcher: [{
		path: "src",
		type: "js"
	}, {
		path: "less",
		type: "less"
	}],
	babel: {
		input: "./static/js/main.js",
		dest: "./static/js/main-legacy.js",
		compress: "./static/js/main-legacy.min.js"
	},
	rollup: {
		entry: "./src/main.js",
		dest: "./static/js/main.js",
		compress: "./static/js/main.min.js",
		moduleName: "main",
		format: "iife"
	},
	less: {
		file: "./less/main.less",
		output: "./static/css/main.css",
		paths: ["less"],
		plugins: {
			"autoprefix": "Android 2.3,Android >= 4,Chrome >= 35,Firefox >= 30,Explorer >= 10,iOS >= 8,Opera >= 21,Safari >= 7",
			"clean-css": "--s1 --advanced --compatibility=ie8"
		}
	}
};

exports.CONF = CONF;

exports.getRollup = () => {
	let conf = {
		plugins: [ multiEntry(), includePaths({paths:["src"]}), filesize() ]
	};

	Object.keys(CONF.rollup).forEach(key => {
		if (key == "compress") return;

		conf[key] = CONF.rollup[key];
	});

	return conf;
};
