raytracer.factory("Render", [
	"Camera",
	"CubeMap",
	"Raytrace",
	"Vector3",
function(
	Camera,
	CubeMap,
	Raytrace,
	Vector3
) {
	
	var Render = function() {
	};

	Render.prototype.renderImage = function(bvh, phong, aa) {
		var camera = new Camera();
		//camera->SetWidth(1300);
		//camera->SetHeight(700);

		var cubemap = new CubeMap(); // cubemap, odkaz na pozadi 

		 // antialising - supersampling - jittering

		 // pocet vzorku na pixel 7*7 = 49 x
		 var times = aa * aa;
		 console.log("Antialising : %d samples, times %d x per pixel\n", aa, times);

		 // krokovac pro antialiasing
		 var ds = 1 / aa;

		 // podil barvy
		 var coef = 1 / (aa * aa);

		 console.log("Start render\n");

		 // phong nebo posledni cviceni - pruhlednost
		 if (phong)
			 console.log("- phong shading\n");
		 else
			 console.log("- phong shading, material reflectivity a transmitivity\n");

		for ( var y = 0; y < camera.getHeight(); ++y )
		{
			for ( var x = 0; x < camera.getWidth(); ++x )
			{
				// vysledna barva
				var color;

				// podle aa
				if (aa == 1)
				{
					// paprsek
					var ray = camera.generateRay( x, y );

					color = Raytrace.rayTrace(ray, bvh, cubemap, true, phong);
				}
				else
				{
					// pokud je aa vice jak 1 -> zjistime pro cely pixel, jestli se zasahne pouze pozadi
					// v tomto pripade zbyly cyklus preskocime a vykreslime jenom pozadi
					var helpRay = camera.generateRay( x, y );
					var backHit = Raytrace.backgroundHit(helpRay, bvh);
					
					if (backHit)
					{
						// zasazeno pozadi, vykreslime jej, dalsi opakovani jiz neni nutne
						color = Raytrace.rayTrace(helpRay, bvh, cubemap, true, phong);
					}
					else
					{

						// supersampling - jittering
						for(var fragmentx = x; fragmentx < x + 1.0; fragmentx += ds)
						{
							for(var fragmenty = y; fragmenty < y + 1.0; fragmenty += ds)
							{
								// jednotlive barvy
								var aaColor = new Vector3(0, 0, 0);

								// paprsek
								var ray = camera.generateRay( fragmentx, fragmenty );

								// barva
								aaColor = Raytrace.rayTrace(ray, bvh, cubemap, true, phong);

								// pripocteme ji k vysledne
								color.plusAssign(aaColor);
							}
						}

						// nacetli jsme barvy, aritmeticky je podelime
						// prepocet barvy
						color.multiplyAssign(coef);
					}
				}

				// vysledna barva
				console.log("vysledna barva");
				console.log(x, y, color);
	      }
	    }
		console.log("It takes %d seconds\n");
		console.log("End render\n");
	};
	
	return Render;
}]);
