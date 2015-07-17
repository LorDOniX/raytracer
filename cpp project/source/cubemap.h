#ifndef CUBEMAP_H_
#define CUBEMAP_H_

// http://zach.in.tu-clausthal.de/teaching/cg_literatur/Cube_map_tutorial/cube_map.html 
class CubeMap
{
public:
	enum CubeMaps
	{
		// pojmenovane jednotlive bitmapy
		POS_X, NEG_X, POS_Y, NEG_Y, POS_Z, NEG_Z
	};

	// konstruktor
	CubeMap()
	{
		// cesty k mapam
		cube_maps[0] = "./posx.jpg";
		cube_maps[1] = "./negx.jpg";
		cube_maps[2] = "./posy.jpg";
		cube_maps[3] = "./negy.jpg";
		cube_maps[4] = "./posz.jpg";
		cube_maps[5] = "./negz.jpg";

		// nacteme vsechny obrazky
		LoadImages();
	}

	~CubeMap()
	{
		for (int i = 0; i < mapsCount; i++)
		{
			cvReleaseImage(&maps_[i]);
		}
	}

	// nacteme vsechny obrazky
	void LoadImages()
	{
		// pro vsechny prvky
		for (int i = 0; i < mapsCount; i++)
		{
			maps_[i] = cvLoadImage(cube_maps[i]);
		}
	}

	// vybrani master axis, 0 x, 1 y, 2 z
	int GetMasterAxis(Vector3 & vec)
	{
		if (abs(vec.x) > abs(vec.y) && abs(vec.x) > abs(vec.z)) return (0);
		else if (abs(vec.y) > abs(vec.x) && abs(vec.y) > abs(vec.z)) return (1);
		else if (abs(vec.z) > abs(vec.x) && abs(vec.z) > abs(vec.y)) return (2);
	}

	// http://cboard.cprogramming.com/game-programming/87890-bilinear-interpolation.html
	// x a y je vstup ve float formatu, vystup je pak taky x a y, ale prepocitany
	Vector3 BilinearInterpolation(int width, int height, float & x, float & y, IplImage * image)
	{
		// S = (1-p)(1-q) a + (1-p) q c + p (1-q) b + p q d
		// where (p,q) are the coordinates you find by taking the R-inverse transformation of your destination image pixel and a, b, c and d are the color information of the respective pixels (you have to apply red, green and blue seperately).
		// 

		float p = x - floor(x);
		float q = y - floor(y);

		// potrebuje 4 souradnice okolnich pixelu
		int p1x, p2x, p3x, p4x;
		int p1y, p2y, p3y, p4y;

		// omezeni sirky
		if (x >= width - 1.0f)
		{
			p1x = p2x = p3x = p4x = floor(x);
		}
		else
		{
			p1x = floor(x);
			p2x = floor(x);
			p3x = floor(x) + 1;
			p4x = floor(x) + 1;
		}

		// omezeni vysky
		if (y >= height - 1.0f)
		{
			p1y = p2y = p3y = p4y = floor(y);
		}
		else
		{
			p1y = floor(y);
			p2y = floor(y) + 1;
			p3y = floor(y);
			p4y = floor(y) + 1;
		}

		// 4 barvy pixelù
		Vector3 a = GetPixelFromImage(image, p1x, p1y);
		Vector3 b = GetPixelFromImage(image, p2x, p2y);
		Vector3 c = GetPixelFromImage(image, p3x, p3y);
		Vector3 d = GetPixelFromImage(image, p4x, p4y);

		Vector3 S = (1 - p)*(1 - q) * a + (1-p) * q * c + p * (1-q) * b + p * q * d;

		// vracime
		return (S);
	}

	Vector3 GetPixelFromImage(IplImage * image, int x, int y)
	{
		unsigned char *pz = &CV_IMAGE_ELEM(image, unsigned char, y, x * image->nChannels);
		unsigned char *py = &CV_IMAGE_ELEM(image, unsigned char, y, x * image->nChannels + 1);
		unsigned char *px = &CV_IMAGE_ELEM(image, unsigned char, y, x * image->nChannels + 2);

		float colorX = float(px[0]) / (float) 255;
		float colorY = float(py[0]) / (float) 255;
		float colorZ = float(pz[0]) / (float) 255;

		Vector3 output = Vector3(0, 0, 0);

		output.z = colorZ; // blue; pro float je interval <0.0, 1.0>, pro unsigned char <0, 255>
		output.y = colorY; // green
		output.x = colorX; // red

		return (output);
	}

	Vector3 GetColor(Vector3 & direction)
	{
		CubeMaps map = GetCubeMap(direction);

		float x, y;
		IplImage * image = maps_[map];

		switch (map)
		{// s = (sc / |ma| + 1) / 2    t = (tc / |ma| + 1) / 2
			case POS_X: // -y,z 
				x = 1.0f - (direction.z / abs(direction.x) + 1.0f) * 0.5f;
				y = 1.0f - (direction.y / abs(direction.x) + 1.0f) * 0.5f; 
				break;

			case NEG_X: // z, y
				x = (direction.z / abs(direction.x) + 1.0f) * 0.5f;
				y = 1.0f - (direction.y / abs(direction.x) + 1.0f) * 0.5f; 
				break; 

			case POS_Y:
				x = (direction.x / abs(direction.y) + 1.0f) * 0.5f;
				y = (direction.z / abs(direction.y) + 1.0f) * 0.5f; 
				break;

			case NEG_Y:
				x = (direction.x / abs(direction.y) + 1.0f) * 0.5f;
				y = 1.0f - (direction.z / abs(direction.y) + 1.0f) * 0.5f; 
				break;

			case POS_Z:
				x = (direction.x / abs(direction.z) + 1.0f) * 0.5f;
				y = 1.0f - (direction.y / abs(direction.z) + 1.0f) * 0.5f; 
				break;

			case NEG_Z:
				x = 1.0f - (direction.x / abs(direction.z) + 1.0f) * 0.5f;
				y = 1.0f - (direction.y / abs(direction.z) + 1.0f) * 0.5f; 
				break;
		}

		// parametry obrazu - bilinearni interpolace TODO
		// http://www.devmaster.net/articles/raytracing_series/part6.php
		int width = image->width;
		int height = image->height;

		// nova pozice x
		float newX = (float) width * x;
		float newY = (float) height * y;

		//return GetPixelFromImage(image, (int) newX, (int) newY);
		return BilinearInterpolation(width, height, newX, newY, image);
	}

	CubeMaps GetCubeMap(Vector3 & direction)
	{
		int ma = GetMasterAxis(direction);

		switch (ma)
		{
			case 0:
				if (direction.x >= 0) return (POS_X);
				else return (NEG_X);
				break;

			case 1:
				if (direction.y >= 0) return (POS_Y);
				else return (NEG_Y);
				break;

			case 2:
				if (direction.z >= 0) return (POS_Z);
				else return (NEG_Z);
				break;
		}
	}

private:
	const static int mapsCount = 6; // pocet map
	const char * cube_maps[mapsCount]; // cesty k mapam
	IplImage * maps_[mapsCount]; // jednotlive obrazky
};

#endif