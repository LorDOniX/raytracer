#include "stdafx.h"

Vector3 RayTrace(Ray & ray, BVH * bvh, CubeMap * cubemap, bool drawBack, bool phong)
{
	Vector3 color = Vector3(0.0f, 0.0f, 0.0f);
	int depth = 0;
	REAL coefficient = 1; // koeficient útlumu (odrazivosti) 1
	const int max_depth = 6;
	REAL min_coefficient = 1e-2;
	int hits = 0; // byl aspon 1 zasah ?

	// material
	Material * materials = new Material[1];

	materials[0].ambiente = Vector3(0.1f, 0.1f, 0.1f);
	materials[0].diffuse = Vector3( 0.5f, 0.5f, 0.5f );
	materials[0].specular = Vector3( 1.0f, 1.0f, 1.0f );
	materials[0].emission = Vector3( 0.0f, 0.0f, 0.0f );
	materials[0].shininess = 60.0f;
	materials[0].reflectivity = 0.8f;
	materials[0].ior = 1.5f;

	// svetlo
	Light * lights = new Light[2];

	// obe dve ambiente lights[0].ambiente = Vector3( 0.0f, 0.0f, 0.0f );

	lights[0].position = Vector3( 0.2f, 0.3f, 0.5f );
	lights[0].ambiente = Vector3( 0.0f, 0.0f, 0.0f );
	lights[0].diffuse = Vector3( 0.5f, 0.5f, 0.5f );
	lights[0].specular = Vector3( 1.0f, 1.0f, 1.0f );

	lights[1].position = Vector3( 0.0f, 0.2f, 0.1f );
	lights[1].ambiente = Vector3( 0.0f, 0.0f, 0.0f );
	lights[1].diffuse = Vector3( 0.3f, 0.3f, 0.7f );
	lights[1].specular = Vector3( 1.0f, 1.0f, 1.0f );

	int number_of_lights = 2;
	
	// vzduch a material
	float IOR_AIR = 1.000293f;
	float IOR_MATERIAL = 1.5f;
	REAL current_material = IOR_MATERIAL;
	
	do
	{
		bvh->Traverse( ray );

		if ( ray.changed )
		{
			// zasah ++
			hits++;

			// něco jsme trefili
			const Material & material = materials[0]; // získáme materiál zasaženého objektu

			Vector3 h = ray.Target(); // souřadnice zásahu
			Vector3 n = ray.triangle->Normal( h ); // interpolovaná normála plochy v bodě h
			Vector3 r = ray.direction - ( 2 * ( n.DotProduct( ray.direction ) ) ) * n;
			Ray new_ray; // novy paprsek

			if (!phong)
			{
				// materialy
				float n1 = current_material;
				float n2 = (n1 == IOR_AIR) ? IOR_MATERIAL : IOR_AIR;

				// snell's law
				float cos_theta_1 = abs(n.DotProduct( -ray.direction ));
				float cos_theta_2 = sqrt(1 - SQR(n1/n2)*(1 - SQR(cos_theta_1)));
				float sin_theta_1 = sqrt(1 - SQR(cos_theta_1)); // goniometricka 1 dopocteni
				float sin_theta_2 = (n1 / n2) * sin_theta_1; // pokud je tato hodnota vetsi jak 1 -> totalni reflexe

				// nyni budeme pocitat fresnel equations
				// cost theta i = cos theta 1 apod. pro theta t
				float Rs = SQR((n1 * cos_theta_1 - n2 * cos_theta_2) / (n1 * cos_theta_1 + n2 * cos_theta_2));
				float Rp = SQR((n1 * cos_theta_2 - n2 * cos_theta_1) / (n1 * cos_theta_2 + n2 * cos_theta_1));

				float R = (Rs + Rp) / 2;
				float T = 1 - R;
				float mat_tran = 1.0f; // material - transmisivity

				// ruska ruleta
				float rr = rnd(); // nahodne cislo <0..1>

				if (rr <= R)
				{
					// odrazeny paprsek - reflect
					mat_tran = R;
					current_material = n1;

					// tento kod je podobny jak ten nahore z phonga
					r = ray.direction + (2 * cos_theta_1) * n;
					r.Normalize();
				}
				else if (rr <= R + T)
				{
					// propusteny paprsek - refract
					mat_tran = T;
					current_material = n2;

					// smerovy paprsek noveho paprsku ulozime do r
					r = (n1 / n2) * ray.direction + (n1 / n2 * cos_theta_1 - cos_theta_2) * n;
					//r = (n1 / n2) * ray.direction + (n1 / n2 * n.DotProduct(ray.direction) - cos_theta_2) * n;
					r.Normalize();
				}

				// ruska ruleta pro material transmitivity, jinak phong pouze reflectivity
				coefficient *= (mat_tran * material.reflectivity);
			}
			else
			{
				// pouze odrazivoast materialu
				coefficient *= material.reflectivity;
			
				// odražený nebo propuštěný paprsek
				new_ray = Ray( h + r * 0.001f, r ); 
			}

			// výpočet příspěvku osvětlení bodu h ze všech světel
			for ( int li = 0; li < number_of_lights; ++li )
			{
				Light & light = lights[li];				

				color += coefficient * material.ambiente * light.ambiente; // ambientní osvětlení je přítomno vždy

				Vector3 l = light.position - h; // směrový vektor od bodu zásahu k světelnému zdroji
				l.Normalize();
				
				Ray shadow_ray = Ray( h + l * 0.001f, l ); // paprsek z bodu h do světla

				bvh->Traverse( shadow_ray ); // je h ve stínu?

				if ( !shadow_ray.changed )
				{
					// h není ve stínu, vypočteme tedy i ostatní složky osvětlení
					Vector3 lr = l - ( 2 * ( n.DotProduct( l ) ) ) * n; // odražený paprsek

					color += coefficient * material.diffuse * light.diffuse *
						( MAX( n.DotProduct( l ), 0 ) ); // difuzní
					const REAL ldd = MAX( lr.DotProduct( ray.direction ), 0 );
					color += coefficient * material.specular * light.specular *
						pow( ldd, material.shininess ); // spekulární
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
		if (drawBack) return cubemap->GetColor(ray.bdirection);
		else return Vector3(1.0f, 1.0f, 1.0f);
	}

	// vracime
	return color;
}

bool BackgroundHit(Ray & ray, BVH * bvh)
{
	// zavolame traverzaci
	bvh->Traverse(ray);

	// zasahl se trojuhelnik ?
	if (ray.changed)
		return false;
	else
		return true;
}