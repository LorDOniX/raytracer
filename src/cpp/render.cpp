#include "stdafx.h"

void RenderImage(BVH * bvh, bool phong, int aa)
{
	Camera * camera = new Camera();
	//camera->SetWidth(1300);
	//camera->SetHeight(700);

	CubeMap * cubemap = 	cubemap = new CubeMap(); // cubemap, odkaz na pozadi 

    cvNamedWindow( "Render", CV_WINDOW_AUTOSIZE );
    cvMoveWindow( "Render", 0, 0 );
    IplImage * img = cvCreateImage( cvSize( camera->Width(), camera->Height() ), IPL_DEPTH_32F, 3 );
    cvZero( img );

	 // antialising - supersampling - jittering

	 // pocet vzorku na pixel 7*7 = 49 x
	 int times = aa * aa;
	 printf("Antialising : %d samples, times %d x per pixel\n", aa, times);

	 // krokovac pro antialiasing
	 const REAL ds = 1 / static_cast<REAL>(aa);

	 // podil barvy
	 const float coef = 1 / (static_cast<REAL>(aa) * static_cast<REAL>(aa));

    int y;

	 printf("Start render\n");

	 // phong nebo posledni cviceni - pruhlednost
	 if (phong)
		 printf("- phong shading\n");
	 else
		 printf("- phong shading, material reflectivity a transmitivity\n");

	 clock_t start, finish;
	 start = clock();
	#pragma omp parallel for schedule (dynamic, 50) default (none) private(y) shared (camera, img, bvh, cubemap, phong, aa)
	for ( y = 0; y < camera->Height(); ++y )
	{
		for ( int x = 0; x < camera->Width(); ++x )
		{
			// vysledna barva
			Vector3 color;

			// podle aa
			if (aa == 1)
			{
				// paprsek
				Ray ray = camera->GenerateRay( x, y );

				color = RayTrace(ray, bvh, cubemap, true, phong);
			}
			else
			{
				// pokud je aa vice jak 1 -> zjistime pro cely pixel, jestli se zasahne pouze pozadi
				// v tomto pripade zbyly cyklus preskocime a vykreslime jenom pozadi
				Ray helpRay = camera->GenerateRay( x, y );
				bool backHit = BackgroundHit(helpRay, bvh);
				
				if (backHit)
				{
					// zasazeno pozadi, vykreslime jej, dalsi opakovani jiz neni nutne
					color = RayTrace(helpRay, bvh, cubemap, true, phong);
				}
				else
				{

					// supersampling - jittering
					for(float fragmentx = x; fragmentx < x + 1.0f; fragmentx += ds)
					{
						for(float fragmenty = y; fragmenty < y + 1.0f; fragmenty += ds)
						{
							// jednotlive barvy
							Vector3 aaColor;

							// paprsek
							Ray ray = camera->GenerateRay( fragmentx, fragmenty );

							// barva
							aaColor = RayTrace(ray, bvh, cubemap, true, phong);

							// pripocteme ji k vysledne
							color += aaColor;
						}
					}

					// nacetli jsme barvy, aritmeticky je podelime
					// prepocet barvy
					color.x *= coef;
					color.y *= coef;
					color.z *= coef;
				}
			}

			// vysledna barva
			float * pixel = &CV_IMAGE_ELEM( img, float, y, x * img->nChannels );		

			pixel[0] += color.z;
			pixel[1] += color.y;
			pixel[2] += color.x; 
      }

		if ((omp_get_thread_num() == 0) && (y % 10 == 0))
		{
			cvShowImage( "Render", img );
			cvWaitKey(20);
		}
    }
	finish = clock();
	printf("It takes %d seconds\n", (finish - start) / CLOCKS_PER_SEC);
	printf("End render\n");

    cvShowImage( "Render", img );
    cvWaitKey( 0 );

    cvDestroyWindow( "Render" );
    cvReleaseImage( &img );
    img = NULL;
}
