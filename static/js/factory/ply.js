raytracer.factory("PLY", [
	"Vector3",
	"Triangle",
	"$q",
	"$http",
function(
	Vector3,
	Triangle,
	$q,
	$http
) {

	var PLY = function (filePath) {
		// { x: 5, y: 4, z: 3}, ....
		this._vertexs = new Array();
		// { vertex: [{ x: 5, y: 4, z: 3},{ x: 5, y: 4, z: 3},{ x: 5, y: 4, z: 3}] }, ...
		this._triangles = new Array();
		this._filePath = filePath;

		var promise = $q.defer();

		this._readData(filePath).then(function(data) {
			this._parseData(data.data);
			promise.resolve();
		}.bind(this), function() {
			promise.reject();
		}.bind(this));

		return promise;
	};

	PLY.prototype._readData = function() {
		return $http.createRequest({
			url: this._filePath
		});
	};

	PLY.prototype._parseData = function(data) {
		data = data || "";

		// end_header
		var lines = data.split("\n");

		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];

			if (line.indexOf("end_header") >= 0) {
				lines.splice(0, i + 1);
				break;
			}
		}

		// make array of indexes -0.0312216 0.126304 0.00514924 0.850855 0.5 
		// 3 32609 32608 32499
		for (var i = 0; i < lines.length; i++) {
			var splits = lines[i].split(" ");

			if (splits[0] == "3") {
				// reading _triangles
				var x = this._vertexs[parseInt(splits[1], 10)];
				var triangle = new Triangle(
					this._vertexs[parseInt(splits[1], 10)],
					this._vertexs[parseInt(splits[3], 10)],
					this._vertexs[parseInt(splits[2], 10)]
				);

				this._triangles.push(triangle); // y is switch for z
			}
			else {
				if (splits[0].length == 0) {
					break;
				}

				// reading _vertexs
				var vector3 = new Vector3(
					parseFloat(splits[0]),
					parseFloat(splits[1]),
					parseFloat(splits[2])
				);

				this._vertexs.push(vector3);
			}
		}
		// output
		console.log(this._vertexs);
		console.log(this._triangles);
	};

	Ply.prototype.getVertexs = function() {
		return this._vertexs;
	};

	Ply.prototype.getTriangles = function() {
		return this._triangles;
	};

	return PLY;
}]);
