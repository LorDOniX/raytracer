raytracer.factory("Material", [
	"Vector3",
function(
	Vector3
) {
	
	var Material = function() {
		// - okolo ni
		this._ambiente = new Vector3(0.1, 0.1, 0.1);
		this._diffuse = new  Vector3(0.5, 0.5, 0.5);
		this._specular = new  Vector3(1.0, 1.0, 1.0);
		this._emission = new  Vector3(0.0, 0.0, 0.0);

		this._shininess = 60;
		this._reflectivity = 0.8;
		// index of refraction
		this._ior = 1.5;
	};

	Material.prototype.rwData = function() {
		return {
			ambiente: this._ambiente,
			diffuse: this._diffuse,
			specular: this._specular,
			emission: this._emission,
			shininess: this._shininess,
			reflectivity: this._reflectivity
		};
	};

	return Material;
}]);
