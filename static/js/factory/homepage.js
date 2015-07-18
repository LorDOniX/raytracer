raytracer.factory("HomePage", [
	"PLY",
	"BVH",
	"Render",
function(
	PLY,
	BVH,
	Render
) {

	var HomePage = {};

	HomePage.run = function() {
		console.log("run");

		var ply = new PLY("/model/bunny.ply").then(function(geometry) {
			var bvh = new BVH(geometry, 8);
			//Render.renderImage(bvh, true, 1); // true -> phong, 1x AA
		});
	};

	return HomePage;
}]);
