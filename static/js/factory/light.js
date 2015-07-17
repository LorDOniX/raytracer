raytracer.factory("Light", [
	"Vector3",
function(
	Vector3
) {
	
	var Light = function(position) {
		// - okolo ni
		this._ambiente = new Vector3(0, 0, 0);
		this._diffuse = new  Vector3(1.0, 1.0, 1.0);
		this._specular = new  Vector3(1.0, 1.0, 1.0);
		this._position = position;
	};

	Light.prototype.getPosition = function() {
		return this._position;
	};

	Light.prototype.rwData = function() {
		return {
			ambiente: this._ambiente,
			diffuse: this._diffuse,
			specular: this._specular,
			position: this._position
		};
	};

	return Light;
}]);
