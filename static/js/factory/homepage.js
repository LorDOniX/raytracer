raytracer.factory("HomePage", [
	"PLY",
function(
	PLY
) {

	var HomePage = {};

	HomePage.run = function() {
		console.log("run");

		var ply = new PLY("/model/bunny.ply").then(function() {
			console.log("ply done");
		});
	};

	return HomePage;
}]);
