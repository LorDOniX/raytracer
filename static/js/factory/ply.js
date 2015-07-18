raytracer.factory("PLY", [
	"Vector3",
	"Triangle",
	"Face",
	"$q",
	"$http",
	"Geometry",
function(
	Vector3,
	Triangle,
	Face,
	$q,
	$http,
	Geometry
) {

	var PLY = function (filePath, scale, flipNormals) {
		this._filePath = filePath;
		this._scale = scale;
		this._flipNormals = flipNormals;

		var promise = $q.defer();

		this._readData(filePath).then(function(data) {
			var pd = this._parseData(data.data);
			var geometry = this._makeGeometry(pd);

			promise.resolve(geometry);
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

	PLY.prototype._makeGeometry = function(parsedData) {
		var vertices = [];
		var faces = [];
		var perVertexNormals = [];
		var textureCoordinates = [];
		var scale = this._scale || 1;

		// vertices
		for (var i = 0; i < parsedData.vertexsLen; i++) {
			var vertexObj = parsedData.vertexs[i];
			var vec3position = new Vector3(0, 0, 0);
			var vec3normal = new Vector3(0, 0, 0);
			var vec3textureCoordinate = new Vector3(0, 0, 0);

			Object.keys(vertexObj).forEach(function(key) {
				var value = parseFloat(vertexObj[key]);
				key = key.toLowerCase();

				switch (key) {
					case "x":
						vec3position.setX(value);
						break;

					case "y":
						vec3position.setY(value);
						break;

					case "z":
						vec3position.setZ(value);
						break;

					case "nx":
						vec3normal.setX(value);
						break;

					case "ny":
						vec3normal.setY(value);
						break;

					case "nz":
						vec3normal.setZ(value);
						break;
				}
			}, this);

			vec3position.multiplyAssign(scale);
			vertices.push(vec3position);

			if (this._flipNormals ) {
				vec3normal.multiplyAssign(-1);
			}
			vec3normal.normalize();
			perVertexNormals.push(vec3normal);

			textureCoordinates.push(vec3textureCoordinate);
		}

		var geometry = Geometry.createGeometry(vertices, perVertexNormals, parsedData.facesLen);

		// faces
		for (var i = 0; i < parsedData.facesLen; i++) {
			var faceObj = parsedData.faces[i];
			var face = new Face();

			face.setVertexIndicies(0, parseInt(faceObj.v0));
			face.setVertexIndicies(1, parseInt(faceObj.v1));
			face.setVertexIndicies(2, parseInt(faceObj.v2));

			geometry.addFace(face);
		};

		geometry.buildTriangles(this._flipNormals);

		return geometry;
	};

	PLY.prototype._parseData = function(data) {
		data = data || "";

		var lines = data.split("\n");

		var STATES = {
			HEAD: 0,
			HEAD_VERTEX: 1,
			HEAD_FACE: 2,
			VERTEX: 3,
			FACE: 4,
			END: 100
		};

		var state = STATES.HEAD;

		var output = {
			faces: [],
			facesLen: 0,
			facesP: 0,
			facesProperties: ["count", "v0", "v1", "v2"],
			vertexs: [],
			vertexsP: 0,
			vertexsLen: 0,
			vertexProperies: []
		};
		
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];

			switch (state) {
				case STATES.HEAD:
					if (line.indexOf("element vertex") != -1) {
						state = STATES.HEAD_VERTEX;
						output.vertexsLen = parseInt(line.split(" ")[2], 10);
					}
					break;

				case STATES.HEAD_VERTEX:
					if (line.indexOf("element face") != -1) {
						state = STATES.HEAD_FACE;
						output.facesLen = parseInt(line.split(" ")[2], 10);
					}
					else if (line.indexOf("property") != -1) {
						output.vertexProperies.push(line.split(" ")[2].trim());
					}
					break;

				case STATES.HEAD_FACE:
					if (line.indexOf("end_header") != -1) {
						state = STATES.VERTEX;
					}
					break;

				case STATES.VERTEX:
					var values = line.trim().split(" ");
					var vertex = {};

					for (var j = 0; j < values.length; j++) {
						vertex[output.vertexProperies[j]] = values[j];
					}

					if (values.length == output.vertexProperies.length) {
						output.vertexs.push(vertex);
						output.vertexsP++;
					}

					if (output.vertexsP == output.vertexsLen) {
						state = STATES.FACE;
					}
					break;

				case STATES.FACE:
					var values = line.trim().split(" ");
					var face = {};

					for (var j = 0; j < values.length; j++) {
						face[output.facesProperties[j]] = values[j];
					}

					if (values.length == output.facesProperties.length) {
						output.faces.push(face);
						output.facesP++;
					}
					
					if (output.facesP == output.facesLen) {
						state = STATES.FACE;
					}
					break;
			};

			if (state == STATES.END) break;
		}

		return output;
	};

	return PLY;
}]);
