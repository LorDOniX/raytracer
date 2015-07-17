raytracer = onix.module("raytracer");

raytracer.run([
	"$route",
	"HomePage",
function(
	$route,
	HomePage
) {
	// application routes
	$route
		.when("/", {
			controller: function() {
				HomePage.run();
			}
		})
		.otherwise({
			controller: function() {
				HomePage.run();
			}
		});
}]);
