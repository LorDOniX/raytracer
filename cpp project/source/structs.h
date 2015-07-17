#ifndef STRUCTS_H_
#define STRUCTS_H_

struct Node
{
	AABB bounding; // omezujici kvadr vsech itemu v uzlu
	int span[2]; // uzavreny interval vsech indexu
	Node * children[2]; // dva potomci max. leva a prava cast

	bool IsLeaf()
	{
		return ((children[0] == NULL) && (children[1] == NULL));
	}

	Node(const int from, const int to)
	{
		span[0] = from; 
		span[1] = to;
		children[0] = children[1] = NULL;
	}

	// destruktor
	~Node()
	{
		// smazani obou potomku, pokud je to mozne
		if (children[0] != NULL)
		{
			delete children[0];
			children[0] = NULL;
		}
		if (children[1] != NULL)
		{
			delete children[1];
			children[1] = NULL;
		}
	}
};

// struktura materialu
struct Material
{
	Vector3 ambiente; // - okolo ni
	Vector3 diffuse;
	Vector3 specular;
	Vector3 emission;

	REAL ior; // index of refraction
	REAL shininess;
	REAL reflectivity;

	Material()
	{
		ambiente = Vector3( 0.1f, 0.1f, 0.1f );
		diffuse = Vector3( 0.5f, 0.5f, 0.5f );
		specular = Vector3( 1.0f, 1.0f, 1.0f );
		emission = Vector3( 0.0f, 0.0f, 0.0f );
		shininess = 60;	
		reflectivity = 0.8f;
		ior = 1.5f;
	}
};

// struktura svetla
struct Light
{
	Vector3 ambiente; // - okolo ni
	Vector3 diffuse;
	Vector3 specular;

	Vector3 position;

	Light() {}

	Light( const Vector3 & position )
	{
		ambiente = Vector3( 0.0f, 0.0f, 0.0f );
		diffuse = Vector3( 1.0f, 1.0f, 1.0f );
		specular = Vector3( 1.0f, 1.0f, 1.0f );
		this->position = position;
	}
};

#endif