raytracer.factory("Raytrace", [
	"Vector3",
	"Material",
	"Light",
	"Funcs",
function(
	Vector3,
	Material,
	Light,
	Funcs
) {
	
	var Raytrace = function() {
	};

	// static methods
	Raytrace.rayTrace = function(ray, bvh, cubemap, drawBack, phong) {
		var color = new Vector3(0.0, 0.0, 0.0);
		var depth = 0;
		// koeficient útlumu (odrazivosti) 1
		var coefficient = 1;
		var max_depth = 6;
		var min_coefficient = 1e-2;
		var hits = 0; // byl aspon 1 zasah ?

		// material
		var materials = new Array(1);
		var material = new Material();
		
		material.setAmbiente(new Vector3(0.1, 0.1, 0.1));
		material.setDiffuse(new Vector3( 0.5, 0.5, 0.5 ));
		material.setSpecular(new Vector3( 1.0, 1.0, 1.0 ));
		material.setEmission(new Vector3( 0.0, 0.0, 0.0 ));
		material.setShininess(60.0);
		material.setReflectivity(0.8);
		material.setIor(1.5);

		materials[0] = material;

		// svetlo
		var lights = new Array(2);
		var light0 = new Light();
		var light1 = new Light();

		// obe dve ambiente lights[0].ambiente = Vector3( 0.0f, 0.0f, 0.0f );

		light0.setPosition(new Vector3( 0.2, 0.3, 0.5 ));
		light0.setAmbiente(new Vector3( 0.0, 0.0, 0.0 ));
		light0.setDiffuse(new Vector3( 0.5, 0.5, 0.5 ));
		light0.setSpecular(new Vector3( 1.0, 1.0, 1.0 ));

		light1.setPosition(new Vector3( 0.0, 0.2, 0.1));
		light1.setAmbiente(new Vector3( 0.0, 0.0, 0.0));
		light1.setDiffuse(new Vector3( 0.3, 0.3, 0.7));
		light1.setSpecular(new Vector3( 1.0, 1.0, 1.0 ));

		lights[0] = light0;
		lights[1] = light1;

		var number_of_lights = 2;
		
		// vzduch a material
		var IOR_AIR = 1.000293;
		var IOR_MATERIAL = 1.5;
		var current_material = IOR_MATERIAL;

		do
		{
			bvh.traverse( ray );

			if ( ray.changed )
			{
				// zasah ++
				hits++;

				// něco jsme trefili
				var material = materials[0]; // získáme materiál zasaženého objektu

				var h = ray.target(); // souřadnice zásahu
				var n = ray.getTriangle().normal( h ); // interpolovaná normála plochy v bodě h

				var r = Vector3.minus(
					ray.getDirection(),
					Vector3.multiply(
						n,
						Vector3.multiply(
							2,
							n.dotProduct(ray.getDirection())
						)
					)
				);

				var new_ray; // novy paprsek

				if (!phong)
				{
					// materialy
					var n1 = current_material;
					var n2 = (n1 == IOR_AIR) ? IOR_MATERIAL : IOR_AIR;

					// snell's law
					var cos_theta_1 = Math.abs(n.dotProduct( -ray.getDirection() ));
					var cos_theta_2 = Math.sqrt(1 - Funcs.sqr(n1/n2)*(1 - Funcs.sqr(cos_theta_1)));
					var sin_theta_1 = Math.sqrt(1 - Funcs.sqr(cos_theta_1)); // goniometricka 1 dopocteni
					var sin_theta_2 = (n1 / n2) * sin_theta_1; // pokud je tato hodnota vetsi jak 1 -> totalni reflexe

					// nyni budeme pocitat fresnel equations
					// cost theta i = cos theta 1 apod. pro theta t
					var Rs = Funcs.sqr((n1 * cos_theta_1 - n2 * cos_theta_2) / (n1 * cos_theta_1 + n2 * cos_theta_2));
					var Rp = Funcs.sqr((n1 * cos_theta_2 - n2 * cos_theta_1) / (n1 * cos_theta_2 + n2 * cos_theta_1));

					var R = (Rs + Rp) / 2;
					var T = 1 - R;
					var mat_tran = 1.0; // material - transmisivity

					// ruska ruleta
					var rr = Math.random(); // nahodne cislo <0..1>

					if (rr <= R)
					{
						// odrazeny paprsek - reflect
						mat_tran = R;
						current_material = n1;

						// tento kod je podobny jak ten nahore z phonga
						r = ray.getDirection() + (2 * cos_theta_1) * n;

						r = Vector3.plus(
							ray.getDirection(),
							(2 * cos_theta_1) * n
						);
						r.normalize();
					}
					else if (rr <= R + T)
					{
						// propusteny paprsek - refract
						mat_tran = T;
						current_material = n2;

						// smerovy paprsek noveho paprsku ulozime do r
						r = (n1 / n2) * ray.getDirection() + (n1 / n2 * cos_theta_1 - cos_theta_2) * n;
						//r = (n1 / n2) * ray.direction + (n1 / n2 * n.DotProduct(ray.direction) - cos_theta_2) * n;
						r.normalize();
					}

					// ruska ruleta pro material transmitivity, jinak phong pouze reflectivity
					coefficient *= (mat_tran * material.getReflectivity());
				}
				else
				{
					// pouze odrazivoast materialu
					coefficient *= material.getReflectivity();
				
					// odražený nebo propuštěný paprsek
					new_ray = Ray( 
						Vector3.plus(
							h,
							Vector3.multiply(
								r,
								0.001
							)
						),
						r
					); 
				}

				// výpočet příspěvku osvětlení bodu h ze všech světel
				for ( var li = 0; li < number_of_lights; ++li )
				{
					var light = lights[li];				

					// ambientní osvětlení je přítomno vždy
					color.plusAssign(Vector3.multiply(coefficient, Vector3.multiply(material.getAmbiente(), light.getAmbiente())), new Vector3(0, 0, 0));

					var l = Vector3.minus(light.getPosition() - h); // směrový vektor od bodu zásahu k světelnému zdroji
					l.normalize();
					
					// paprsek z bodu h do světla
					var shadow_ray = Ray(
						Vector3.plus(h, Vector3.multiply(l, 0.001)),
						l
					);

					bvh.traverse( shadow_ray ); // je h ve stínu?

					if ( !shadow_ray.changed )
					{
						// h není ve stínu, vypočteme tedy i ostatní složky osvětlení
						var lr = l - ( 2 * ( n.dotProduct( l ) ) ) * n; // odražený paprsek

						var lr = Vector3.minus(l, Vector3.multiply( 2 * ( n.dotProduct( l ) ) , n));

						// difuzní
						color.plusAssign(Vector3.multiply(coefficient * ( Math.max( n.dotProduct( l ), 0 ) ), Vector3.multiply(material.getDiffuse(), light.getDiffuse())));
						
						var ldd = Math.max( lr.dotProduct( ray.getDirection() ), 0 );

						// spekulární
						color.plusAssign(Vector3.multiply(coefficient * Math.pow( ldd, material.getShininess() ), Vector3.multiply(material.getSpecular(), light.getSpecular())));
					}
				}

				ray = new_ray; // trasování pokračuje s novým paprskem
			}
			else
			{
				// nic jsme netrefili, končíme s tím, co je v color
				break;
			}
		} while ( ( depth++ < max_depth ) && ( coefficient > min_coefficient ) );
		
		// nic jsme nezasahli ?
		if (hits == 0)
		{
			if (drawBack) return cubemap.getColor(ray.bdirection);
			else return Vector3(1.0, 1.0, 1.0);
		}

		// vracime
		return color;
	};

	Raytrace.backgroundHit = function(ray, bvh) {
		// zavolame traverzaci
		bvh.traverse(ray);

		// zasahl se trojuhelnik ?
		if (ray.changed)
			return false;
		else
			return true;
	};

	return Raytrace;
}]);
