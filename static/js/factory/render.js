raytracer.factory("Render", [
	"Camera",
	"Cubemap",
	"Raytrace",
	"Vector3",
function(
	Camera,
	Cubemap,
	Raytrace,
	Vector3
) {
	
	var Render = function() {
	};

	// static method
	Render.renderImage = function(bvh, phong, aa) {
		var camera = new Camera();
		//camera->SetWidth(1300);
		//camera->SetHeight(700);
		
		var canvasEl = document.createElement("canvas");
		canvasEl.width = camera.getWidth();
		canvasEl.height = camera.getHeight();

		document.body.appendChild(canvasEl);

		var ctx = canvasEl.getContext("2d");

		var cubemap = new Cubemap(); // cubemap, odkaz na pozadi 
		cubemap.load().then(function() {
			this._render(bvh, phong, aa, cubemap, ctx, camera);
		}.bind(this));
	};

	Render._putPixel = function(color, x, y, ctx) {
		var id = ctx.createImageData(1,1); // only do this once per page
		var d  = id.data; // only do this once per page
		var dd = color.rwData();

		d[0] = Math.floor(dd.x * 255);
		d[1] = Math.floor(dd.y * 255);
		d[2] = Math.floor(dd.z * 255);
		d[3] = 255; // alpha 0-255

		ctx.putImageData(id, x, y );
	};

	Render._render = function(bvh, phong, aa, cubemap, ctx, camera) {
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
				//console.log("vysledna barva");
				//console.log(x, y, color);
				this._putPixel(color, x, y, ctx);
			}
		}
		console.log("It takes %d seconds\n");
		console.log("End render\n");
	};
	
	return Render;
}]);
