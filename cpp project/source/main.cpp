#include "stdafx.h"

int main(int argc, char * argv[])
{
	/*
	if (argc == 1)
	{
		printf("Nebyl zadan vstupni soubor jako parametr !\n");
		int c = getchar();
		return -1;
	}

	// dale
	char * file = argv[1];
	*/

	// start
	printf("RayTracer - Roman Makudera, MAK044, PGI 2011\n");
	//char * file = "bun_zipper_res4.ply"; // 1
	char * file = "bun_zipper.ply"; // 8
	Geometry * geometry;
	geometry = LoadPLY(file);
	// Geometry * geometry = LoadPLY(file);
	BVH * bvh = new BVH(geometry, 8);
	RenderImage(bvh, true, 1); // true -> phong, 1x AA
	// res4, aa3 -> 62s, potom 50 = 20.6%
	// res4, aa2 -> 23s, potom 20 = 13%
}
