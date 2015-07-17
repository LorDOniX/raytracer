raytracer.factory("Geometry", [
	"Vector3",
	"Face",
	"Triangle",
function(
	Vector3,
	Face,
	Triangle
) {
	
	var Geometry = function(numberOfVertices, numberOfPerVertexNormals, numberOfFaces) {
		this._numberOfVertices = numberOfVertices;
		this._numberOfPerVertexNormals = numberOfPerVertexNormals;
		this._numberOfFaces = numberOfFaces;

		this._nextVertex = 0;
		this._nextFace = 0;
		this._triangles = null;

		this._vertices = new Array(this._numberOfVertices);
		for (var i = 0; i < this._numberOfVertices; i++) {
			this._vertices[i] = new Vector3(0, 0, 0);
		}

		this._perVertexNormals = new Array(this._numberOfPerVertexNormals);
		for (var i = 0; i < this._numberOfPerVertexNormals; i++) {
			this._perVertexNormals[i] = new Vector3(0, 0, 0);
		}

		this._faces = new Array(this._numberOfFaces);
		for (var i = 0; i < this._numberOfFaces; i++) {
			this._faces[i] = new Face();
		}
	};

	Geometry.prototype.addVertex = function(vec3, normal) {
		this._vertices[this._nextVertex] = vec3;
		normal.normalize();
		this._perVertexNormals[this._nextVertex] = normal;
		++this._nextVertex;

		// pocet vertexu, ktere je potreba nacist
		return this._numberOfVertices - this._nextVertex;
	};

	Geometry.prototype.addFace = function(face) {
		this._faces[this._nextFace++] = face;
	};

	Geometry.prototype.getVertex = function(vertex) {
		return this._vertices[vertex];
	};

	Geometry.prototype.setVertice = function(ind, vertice) {
		this._vertices[ind] = vertice;
	};

	Geometry.prototype.getPerVertexNormal = function(group, face, vertex) {
		if (arguments.length == 1) {
			if ( group < 0 ) {
				return new Vector3(1, 0, 0);
			}
			else {
				return this._perVertexNormals[group];
			}
		}
		else {
			// 3
			var faceObj = this._faces[face];
			var d = faceObj.rwData();

			return this._perVertexNormals[d.perVertexNormalIndicies[vertex]];
		}
	};

	Geometry.prototype.updatePerVertexNormals = function(flipNormals) {
		if (flipNormals)
			console.log( "Calculating normals [flip]...\n" );
		else
			console.log( "Calculating normals [noflip]...\n" );

		console.time("TEST");

		for ( var face_id = 0; face_id < this._numberOfFaces; ++face_id ) {
			var face = this._faces[face_id];
			var triangle = this._triangles[face_id];

			for ( var vertex = 0; vertex < 3; ++vertex )
			{
				var vertex_index = face.rwData().vertexIndices[vertex];
				var incident_triangles = [];

				for ( var other_face = 0; other_face < this._numberOfFaces; ++other_face )
				{
					if ( face_id != other_face )
					{
						var incident_face = this._faces[other_face]; // jina face
						var d1 = incident_face.rwData().vertexIndices;

						// ma spolecny vrchol?
						if ( ( d1[0] == vertex_index ) ||
							( d1[1] == vertex_index ) ||
							( d1[2] == vertex_index ) )
						{
							//incident_faces.insert( other_face );
							var incident_triangle = this._triangles[other_face];
							incident_triangles.push(incident_triangle);
						}
					}
				}

				var per_vertex_normal = triangle.rwData().perFaceNormal;
				per_vertex_normal.multiplyAssign(triangle.area());

				// incident_triangles obsahuje všechny trojúhelníky incidentní s vertex-tým vrcholem vertex_index, který patrí face			
				for ( var i = 0; i < incident_triangles.length; ++i ) {
					var area = incident_triangles[i].area();
					per_vertex_normal.plusAssign(Vector3.multiply(incident_triangles[i].rwData().perFaceNormal, area), new Vector3(0, 0, 0));
				}
					
				if (flipNormals)
				{
					per_vertex_normal.multiplyAssign(-1);
				}
				per_vertex_normal.normalize();

				triangle.setPerVertexNormals(vertex, per_vertex_normal);
			}
		}

		console.timeEnd("TEST");
	};

	Geometry.prototype.getTriangles = function() {
		return this._triangles;
	};

	Geometry.prototype.buildTriangles = function(flipNormal) {
		if (!this._triangles) {
			this._triangles = new Array(this._numberOfFaces);

			for ( var i = 0; i < this._numberOfFaces; ++i )
			{
				var face = this._faces[i];
				var d = face.rwData();

				var triangle = new Triangle( 
					this.getVertex( d.vertexIndices[0] ),
					this.getVertex( d.vertexIndices[1] ),
					this.getVertex( d.vertexIndices[2] ),
					this.getPerVertexNormal( d.perVertexNormalIndicies[0] ),
					this.getPerVertexNormal( d.perVertexNormalIndicies[1] ),
					this.getPerVertexNormal( d.perVertexNormalIndicies[2] ),
					flipNormal
				);

				this._triangles[i] = triangle;
			}

			console.log(this)

			this.updatePerVertexNormals( !flipNormal );
		}
	};

	Geometry.prototype.numberOfVertices = function() {
		return this._numberOfVertices;
	};

	Geometry.prototype.numberOfFaces = function() {
		return this._numberOfFaces;
	};

	Geometry.prototype.vertices = function() {
		return this._vertices;
	};

	Geometry.prototype.perVertexNormals = function() {
		return this._perVertexNormals;
	};

	Geometry.prototype.setPerVertexNormals = function(ind, pvn) {
		this._perVertexNormals[ind] = pvn;
	};

	Geometry.prototype.faces = function() {
		return this._faces;
	};

	// static method
	Geometry.createGeometry = function(vertices, per_vertex_normals, number_of_faces ) {
		var geometry = new Geometry( vertices.length, per_vertex_normals.length, number_of_faces);

		for (var i = 0; i < vertices.length; ++i) {
			geometry.setVertice(i, vertices[i]);
		}

		for (var i = 0; i < per_vertex_normals.length; ++i) {
			geometry.setPerVertexNormals(i, per_vertex_normals[i]);
		}

		return geometry;
	};

	return Geometry;
}]);
