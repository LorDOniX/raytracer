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

	Material.prototype.getAmbiente = function() {
		return this._ambiente;
	};

	Material.prototype.getDiffuse = function() {
		return this._diffuse;
	};

	Material.prototype.getSpecular = function() {
		return this._specular;
	};

	Material.prototype.getEmission = function() {
		return this._emission;
	};

	Material.prototype.getShininess = function() {
		return this._shininess;
	};

	Material.prototype.getReflectivity = function() {
		return this._reflectivity;
	};

	Material.prototype.setAmbiente = function(ambiente) {
		this._ambiente = ambiente;
	};

	Material.prototype.seDiffuse = function(diffuse) {
		this._diffuse = diffuse;
	};

	Material.prototype.setSpecular = function(specular) {
		this._specular = specular;
	};

	Material.prototype.setEmission = function(emission) {
		this._emission = emission;
	};

	Material.prototype.setShininess = function(shininess) {
		this._shininess = shininess;
	};

	Material.prototype.setReflectivity = function(reflectivity) {
		this._reflectivity = reflectivity;
	};

	Material.prototype.setIor = function(ior) {
		this._ior = ior;
	};

	return Material;
}]);
