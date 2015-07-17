#ifndef GEOMETRY_H_
#define GEOMETRY_H_

class Geometry;

struct AABB
{
	Vector3 bounds[2];

	AABB()
	{
		bounds[0] = Vector3(FLT_MAX, FLT_MAX, FLT_MAX); // minimum nastaveno na maximum
		bounds[1] = Vector3(FLT_MIN, FLT_MIN, FLT_MIN); // maximum nastaveno na minimum
	}

	void Merge(AABB & aaBB)
	{
		// minima z nimin
		bounds[0].x = MIN(bounds[0].x, aaBB.bounds[0].x);
		bounds[0].y = MIN(bounds[0].y, aaBB.bounds[0].y);
		bounds[0].z = MIN(bounds[0].z, aaBB.bounds[0].z);

		// maxima z maxim
		bounds[1].x = MAX(bounds[1].x, aaBB.bounds[1].x);
		bounds[1].y = MAX(bounds[1].y, aaBB.bounds[1].y);
		bounds[1].z = MAX(bounds[1].z, aaBB.bounds[1].z);
	}

	Vector3 Centroid()
	{
		// secteme a podelime 2, vratime
		return Vector3((bounds[0].x + bounds[1].x) / 2, (bounds[0].y + bounds[1].y) / 2, (bounds[0].z + bounds[1].z) / 2);
	}

	bool vectorSets;
};

struct Triangle
{
	// normaly v kazdem bode, musim je nacist v geometrii
	Vector3 vertices[3];
	Vector3 per_face_normal;
	Vector3 per_vertex_normals[3];

	Triangle()
	{
		vertices[0] = Vector3(0, 0, 0);
		vertices[1] = Vector3(0, 0, 0);
		vertices[2] = Vector3(0, 0, 0);
	}
	// x, y, z -> u modelu prohodit
	Triangle( Vector3 & p0, Vector3 & p1, Vector3 & p2 )
	{
		vertices[0] = p0;
		vertices[1] = p2;
		vertices[2] = p1;
	}

	AABB Bounds()
	{
		AABB output;

		// min vektor
		output.bounds[0].x = MIN(MIN(vertices[0].x, vertices[1].x), vertices[2].x);
		output.bounds[0].y = MIN(MIN(vertices[0].y, vertices[1].y), vertices[2].y);
		output.bounds[0].z = MIN(MIN(vertices[0].z, vertices[1].z), vertices[2].z);

		// max vektor
		output.bounds[1].x = MAX(MAX(vertices[0].x, vertices[1].x), vertices[2].x);
		output.bounds[1].y = MAX(MAX(vertices[0].y, vertices[1].y), vertices[2].y);
		output.bounds[1].z = MAX(MAX(vertices[0].z, vertices[1].z), vertices[2].z);

		return output;
	}

	Triangle( const Vector3 & p0, const Vector3 & p1, const Vector3 & p2,
		const Vector3 & n0, const Vector3 & n1, const Vector3 & n2,
		const bool flip_normal )
	{
		vertices[0] = p0;
		vertices[1] = p1;
		vertices[2] = p2;

		per_vertex_normals[0] = n0;
		per_vertex_normals[1] = n1;
		per_vertex_normals[2] = n2;
		
		UpdatePerFaceNormal( flip_normal );
	}

	void UpdatePerFaceNormal( const bool flip_normal )
	{
		per_face_normal = ( vertices[1] - vertices[0] ).CrossProduct( vertices[2] - vertices[0] );		

		if ( flip_normal )
		{
			per_face_normal *= -1;
		}

		per_face_normal.Normalize();
	}

	REAL Area()
	{
		const REAL a = ( vertices[0] - vertices[1] ).Norm();
		const REAL b = ( vertices[1] - vertices[2] ).Norm();
		const REAL c = ( vertices[2] - vertices[0] ).Norm();

		const REAL s = ( a + b + c ) * static_cast<REAL>( 0.5 );

		return sqrt( s * ( s - a ) * ( s - b ) * ( s - c ) );
	}
	
	Vector3 Normal( Vector3 & p )
	{		
			Vector3 v0 = vertices[2] - vertices[0];
			Vector3 v1 = vertices[1] - vertices[0];
			Vector3 v2 = p - vertices[0];

			REAL dot00 = v0.DotProduct( v0 );
			REAL dot01 = v0.DotProduct( v1 );
			REAL dot02 = v0.DotProduct( v2 );
			REAL dot11 = v1.DotProduct( v1 );
			REAL dot12 = v1.DotProduct( v2 );

			REAL inv_denom = 1 / ( dot00 * dot11 - dot01 * dot01 );
			REAL u = ( dot11 * dot02 - dot01 * dot12 ) * inv_denom;
			REAL v = ( dot00 * dot12 - dot01 * dot02 ) * inv_denom;

			Vector3 n = per_vertex_normals[0] + u * ( per_vertex_normals[2] - per_vertex_normals[0] ) + v * ( per_vertex_normals[1] - per_vertex_normals[0] );
			n.Normalize();

			return n;
	}
};

struct Ray
{
	Vector3 origin;
	Vector3 direction;
	Vector3 inv; // invertovaný paprsek
	Vector3 bdirection; // vektor pozadi
	REAL t;
	bool changed;
	Triangle * triangle; // zasazeny trojuhelnik

	Ray() {}

	Ray( Vector3 & origin, Vector3 & direction )
	{
		this->origin = origin;
		this->direction = direction;
		t = MAX_REAL;
		changed = false;
		triangle = NULL;
		bdirection = Vector3(0, 0, 0);

		// invertovany paprsek
		inv = Vector3(1 / direction.x, 1 / direction.y, 1 / direction.z);
	}

	// nastavi t, ale nove t musi byt mensi jak posledni jinak se nic nestane
	void SetT(float t, Triangle * tri)
	{
		if (t < this->t)
		{
			changed = true; // jednou se jiz zmenilo, zasah
			this->t = t;
			triangle = tri;
		}
	}

	// souradnice zasahu
	Vector3 Target()
	{
		return origin + t * direction;
	}	
};

struct Face
{
	int vertex_indices[3]; // 3 vrcholy
	int per_vertex_normals_indices[3]; // 3 normaly

	// default konstruktor
	Face()
	{
		vertex_indices[0] = vertex_indices[1] = vertex_indices[2] = -1;
		per_vertex_normals_indices[0] = per_vertex_normals_indices[1] = per_vertex_normals_indices[2] = -1;
	}
};

class Geometry
{
public:
	Geometry( const int number_of_vertices, const int number_of_per_vertex_normals, int number_of_faces )
	{		
		//assert( ( number_of_vertices > 0 ) && ( number_of_faces > 0 ) /*&& ( number_of_vertices % 3 == 0 )*/ );

		number_of_vertices_ = number_of_vertices;
		number_of_per_vertex_normals_ = number_of_per_vertex_normals;
		number_of_faces_ = number_of_faces;

		next_vertex_ = 0;
		next_face_ = 0;
		triangles_ = NULL;

		vertices_ = new Vector3[number_of_vertices_];				
		per_vertex_normals_ = new Vector3[number_of_per_vertex_normals_];
		faces_ = new Face[number_of_faces_];
	}

	~Geometry()
	{
		if ( per_vertex_normals_ != NULL )
		{
			delete [] per_vertex_normals_;
			per_vertex_normals_ = NULL;
		}

		if ( vertices_ != NULL )
		{
			delete [] vertices_;
			vertices_= NULL;
		}

		if ( faces_ != NULL )
		{
			delete [] faces_;
			faces_ = NULL;
		}

		if ( triangles_ != NULL )
		{
			delete [] triangles_;
			triangles_ = NULL;
		}

		number_of_vertices_ = 0;
		number_of_per_vertex_normals_ = 0;

		next_vertex_ = 0;
		next_face_ = 0;
	}

	int AddVertex( Vector3 & vector, Vector3 & normal)
	{
		assert( next_vertex_ < number_of_vertices_ );

		vertices_[next_vertex_] = vector;
		normal.Normalize();
		per_vertex_normals_[next_vertex_] = normal;
		++next_vertex_;

		return number_of_vertices_ - next_vertex_; // vrací poèet vertexù, které zbývá ještì naèíst
	}	

	void AddFace( const Face & face )
	{
		faces_[next_face_++] = face;
	}

	Vector3 GetVertex( const int vertex )
	{
		assert( ( vertex >= 0 ) && ( vertex < number_of_vertices_ ) );

		return vertices_[vertex];
	}

	Vector3 GetPerVertexNormal( const int group, const int face, const int vertex )
	{		
		return per_vertex_normals_[faces_[face].per_vertex_normals_indices[vertex]];
	}

	Vector3 GetPerVertexNormal( const int vertex )
	{
		assert( vertex < number_of_vertices_ );

		if ( vertex < 0 ) 
		{
			return Vector3( 1, 0, 0 );
		}
		else
		{
			return per_vertex_normals_[vertex];
		}
	}
	
	void UpdatePerVertexNormals( const bool flip_normals )
	{
		//assert( ( face >= 0 ) && ( face < number_of_faces_ ) && ( triangles_ != NULL ) );
		if (flip_normals)
			printf( "Calculating normals [flip]...\n" );
		else
			printf( "Calculating normals [noflip]...\n" );
			
		int face_id;
		clock_t start, finish;
		start = clock();

		#pragma omp parallel for schedule (dynamic, 250) default (none) private(face_id)
		for ( face_id = 0; face_id < number_of_faces_; ++face_id )
		{
			Face & face = faces_[face_id];
			Triangle & triangle = triangles_[face_id];

			for ( int vertex = 0; vertex < 3; ++vertex )
			{
				const int vertex_index = face.vertex_indices[vertex];

				std::vector<Triangle> incident_triangles;

				for ( int other_face = 0; other_face < number_of_faces_; ++other_face )
				{
					if ( face_id != other_face )
					{
						Face incident_face = faces_[other_face]; // jiná face

						// má spoleèný vrchol?
						if ( ( incident_face.vertex_indices[0] == vertex_index ) ||
							( incident_face.vertex_indices[1] == vertex_index ) ||
							( incident_face.vertex_indices[2] == vertex_index ) )
						{
							//incident_faces.insert( other_face );
							Triangle incident_triangle = triangles_[other_face];
							incident_triangles.push_back( incident_triangle );

						}
					}
				}			

				Vector3 per_vertex_normal = triangle.per_face_normal;					
				per_vertex_normal *= triangle.Area();

				// incident_triangles obsahuje všechny trojúhelníky incidentní s vertex-tým vrcholem vertex_index, který patøí face			
				for ( unsigned int i = 0u; i < incident_triangles.size(); ++i )
				{
					const REAL area = incident_triangles[i].Area();						
					per_vertex_normal += incident_triangles[i].per_face_normal * area;						
				}
					
				if ( flip_normals )
				{
					per_vertex_normal *= -1;
				}
				per_vertex_normal.Normalize();

				triangle.per_vertex_normals[vertex] = per_vertex_normal;			
			}
		}
		finish = clock();
		printf("It takes %d seconds\n", (finish - start) / CLOCKS_PER_SEC);
	}

	Triangle * GetTriangles()
	{
		return triangles_;
	}

	void BuildTriangles( const bool flip_normal )
	{
		if ( triangles_ == NULL )
		{
			triangles_ = new Triangle[number_of_faces_];

			for ( int i = 0; i < number_of_faces_; ++i )
			{
				Face & face = faces_[i];

				Triangle triangle = Triangle( 
					GetVertex( face.vertex_indices[0] ),
					GetVertex( face.vertex_indices[1] ),
					GetVertex( face.vertex_indices[2] ),
					GetPerVertexNormal( face.per_vertex_normals_indices[0] ),
					GetPerVertexNormal( face.per_vertex_normals_indices[1] ),
					GetPerVertexNormal( face.per_vertex_normals_indices[2] ),
					flip_normal );

				triangles_[i] = triangle;			
			}

			UpdatePerVertexNormals( !flip_normal );
		}
	}

	int number_of_vertices()
	{
		return number_of_vertices_;
	}	

	int number_of_faces()
	{
		return number_of_faces_;
	}

	Vector3 * vertices()
	{
		return vertices_;
	}

	Vector3 * per_vertex_normals()
	{
		return per_vertex_normals_;
	}

	Face * faces()
	{
		return faces_;
	}

protected:

private:
	int number_of_vertices_; /*!< Poèet vertexù v poli vertices. */
	int number_of_per_vertex_normals_; /*!< Poèet per-vertex normál v poli per_vertex_normals. */
	
	int next_vertex_;
	int next_face_;

	Vector3 * vertices_; /*!< Vertexy. */
	Vector3 * per_vertex_normals_; /*!< Normály ve vertexech. Jejich poèet se mùže lišit od poètu vertexù. */

	Face * faces_; /*!< Indexy vertexù, per-vertex normál a texturovacích souøadnic, které tvoøí trojúhelník. */
	int number_of_faces_;
	Triangle * triangles_; /*!< Pole všech trojúhelníku vygenerovaných z pole faces. */	
};

#endif
