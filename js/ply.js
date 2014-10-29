var PLY = function () {
	this.init.apply(this, arguments);
};

PLY.prototype = {
	vertexs: new Array(), // { x: 5, y: 4, z: 3}, ....
	triangles: new Array(), // { vertex: [{ x: 5, y: 4, z: 3},{ x: 5, y: 4, z: 3},{ x: 5, y: 4, z: 3}] }, ...
	init: function (file) {
		this.file = file;
		this.data = this.getData(file);
		this.parseData();
	},
	parseData: function () {
		// end_header
		var lines = this.data.split("\n");
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			if (line.indexOf("end_header") >= 0) { lines.splice(0, i + 1); break; }
		}

		// make array of indexes -0.0312216 0.126304 0.00514924 0.850855 0.5 
		// 3 32609 32608 32499
		for (var i = 0; i < lines.length; i++) {
			var splits = lines[i].split(" ");
			if (splits[0] == "3") {
				// reading triangles
				var x = this.vertexs[parseInt(splits[1], 10)];
				this.triangles.push(new Triangle(this.vertexs[parseInt(splits[1], 10)], this.vertexs[parseInt(splits[3], 10)], this.vertexs[parseInt(splits[2], 10)])); // y is switch for z
			}
			else {
				if (splits[0].length == 0) break;
				// reading vertexs
				this.vertexs.push(new Vector3(parseFloat(splits[0]), parseFloat(splits[1]), parseFloat(splits[2])));
			}
		}
		// output
		console.log(this.vertexs);
		console.log(this.triangles);
	},
	getData: function (file) {
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("GET", file, false);
		xmlhttp.onerror = function (err) { console.log("Err = " + err); };
		xmlhttp.send();
		return xmlhttp.responseText;
	}
};