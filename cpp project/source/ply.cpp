/*! \file ply.cpp
\brief Naèítání PLY souborù       
*/

#include "stdafx.h"

Geometry * CreateGeometry( std::vector<Vector3> & vertices,
						  std::vector<Vector3> & per_vertex_normals, 
						  int number_of_faces )
{
	Geometry * geometry = new Geometry( vertices.size(), per_vertex_normals.size(), number_of_faces);

	for ( unsigned int i = 0; i < vertices.size(); ++i )
	{
		geometry->vertices()[i] = vertices[i];
	}

	for ( unsigned int i = 0; i < per_vertex_normals.size(); ++i )
	{
		geometry->per_vertex_normals()[i] = per_vertex_normals[i];
	}

	per_vertex_normals.clear();
	vertices.clear();

	return geometry;
}

/*! \fn long long GetFileSize( const char * file_name )
\brief Vrátí velikost souboru v bytech.
\param file_name Úplná cesta k souboru
*/
long long GetFileSize64( const char * file_name )
{
	FILE * file = fopen( file_name, "rb" );

	if ( file != NULL )
	{		
		_fseeki64( file, 0, SEEK_END ); // pøesun na konec souboru
		long long file_size = _ftelli64( file ); // zjištìní aktuální pozice
		_fseeki64( file, 0, SEEK_SET ); // pøesun zpìt na zaèátek
		fclose( file );

		return file_size;
	}
	else
	{
		return 0;
	}
}

/*! \fn int LoadPLY( const char * file_name )
\brief Naète geometrii z PLY souboru \a file_name.
\param file_name Úplná cesta k PLY souboru vèetnì pøípony.
*/
/*! \fn int LoadPLY( const char * file_name )
\brief Naète geometrii z PLY souboru \a file_name.
\param file_name Úplná cesta k PLY souboru vèetnì pøípony.
*/
Geometry * LoadPLY( const char * file_name, REAL scale, bool flip_normals )
{
	// otevøení soouboru
	FILE * file = fopen( file_name, "rt" );
	if ( file == NULL )
	{
		printf( "File %s not found.\n", file_name );

		return NULL;
	}	

	// naètení celého souboru do pamìti
	/*const long long*/size_t file_size = static_cast<size_t>( GetFileSize64( file_name ) );
	char * buffer = new char[file_size + 1]; // +1 protože budeme za poslední naètený byte dávat NULL


	printf( "Loading ply model '%s' (%0.1f MB)...\n", file_name, file_size / 1024.0f / 1024.0f );

	size_t number_of_items_read = fread( buffer, sizeof( *buffer ), file_size, file );
	
	// otestujeme korektnost naètení dat
	if ( !feof( file ) && ( number_of_items_read != file_size ) )
	{
		printf( "The end of the file was unexpectedly encountered.\n" );

		return NULL;
	}

	buffer[number_of_items_read] = 0; // zajistíme korektní ukonèení øetìzce

	fclose( file );
	file = NULL;

	// parsování
	std::vector<Vector3> vertices; // celý jeden soubor
	std::vector<Vector3> per_vertex_normals;
	std::vector<Vector3> texture_coordinates;

	const char delim[] = " ,\t\n";
	char * token = strtok( buffer, delim );

	typedef enum
	{
		NONE,
		ELEMENT_MODE,
		PROPERTY_MODE,
		VERTEX_MODE,
		FACE_MODE,
		VERTICES_MODE,
		FACES_MODE
	} modes;

	modes mode = NONE;

	typedef enum
	{
		X = 0,
		Y,
		Z,
		NX,
		NY,
		NZ
	} properties;

	int vertex_properties_indices[32];
	memset( vertex_properties_indices, -1, sizeof( vertex_properties_indices ) );
	int vertex_property_index = 0;
	int number_of_vertex_properties = 0; // poèet properties každého vertexu

	Geometry * geometry = NULL;
	int number_of_vertices = 0;
	std::vector<int> number_of_faces; // poèet faces v jednotlivých groups
	bool no_more_properties = false;

	while( token != NULL )
	{
		if ( strcmp( token, "element" ) == 0 )
		{
			mode = ELEMENT_MODE;
		}
		else
		{
			if ( ( strcmp( token, "property" ) == 0 ) && ( !no_more_properties ) )
			{
				mode = PROPERTY_MODE;
				++number_of_vertex_properties;
			}
			else
			{
				if ( mode == ELEMENT_MODE )
				{
					if ( strcmp( token, "vertex" ) == 0)
					{
						mode = VERTEX_MODE;
					}
					else
					{
						if ( strcmp( token, "face" ) == 0 )
						{
							mode = FACE_MODE;
							no_more_properties = true;
						}
					}
				}
				else
				{
					if ( strcmp( token, "end_header" ) == 0 )
					{
						mode = VERTICES_MODE;
					}
				}
			}
		}

		switch ( mode )
		{
		case VERTEX_MODE:
			token = strtok( NULL, delim );
			number_of_vertices = atoi( token );
			mode = NONE;
			break;

		case PROPERTY_MODE:
			token = strtok( NULL, delim );
			// datový typ, pøedpokládáme vždy float
			token = strtok( NULL, delim );
			//
			if ( strcmp( token, "x" ) == 0 )
			{
				vertex_properties_indices[X] = vertex_property_index;			
			}
			else
			{
				if ( strcmp( token, "y" ) == 0 )
				{
					vertex_properties_indices[Z] = vertex_property_index;
				}			
				else
				{
					if ( strcmp( token, "z" ) == 0 )
					{
						vertex_properties_indices[Y] = vertex_property_index;
					}
					else
					{
						if ( strcmp( token, "nx" ) == 0 )
						{
							vertex_properties_indices[NX] = vertex_property_index;							
						}
						else
						{
							if ( strcmp( token, "ny" ) == 0 )
							{
								vertex_properties_indices[NY] = vertex_property_index;
							}
							else
							{
								if ( strcmp( token, "nz" ) == 0 )
								{
									vertex_properties_indices[NZ] = vertex_property_index;
								}
							}
						}
					}
				}	
			}

			++vertex_property_index;

			//token = strtok( NULL, delim );

			mode = NONE;
			break;

		case FACE_MODE:
			token = strtok( NULL, delim );
			number_of_faces.push_back( atoi( token ) );			
			mode = NONE;
			break;

		case VERTICES_MODE:
			{
				Vector3 position;
				Vector3 normal;
				Vector3 texture_coordinate;

				for ( int i = 0; i < number_of_vertex_properties; ++i )
				{
					token = strtok( NULL, delim );
					REAL value = static_cast<REAL>( atof( token ) );

					switch ( vertex_properties_indices[i] )
					{
					case X:
						position.x = value;
						break;

					case Y:
						position.y = value;
						break;

					case Z:
						position.z = value;
						break;

					case NX:
						normal.x = value;
						break;

					case NY:
						normal.y = value;
						break;

					case NZ:
						normal.z = value;
						break;
					}
				}
				/*REAL x = static_cast<REAL>( atof( token ) );
				token = strtok( NULL, delim );
				REAL y = static_cast<REAL>( atof( token ) );
				token = strtok( NULL, delim );
				REAL z = static_cast<REAL>( atof( token ) );*/
				//token = strtok( NULL, delim );

				position *= scale;
				vertices.push_back( position );
				
				if ( flip_normals )
				{
					normal *= -1;
				}
				normal.Normalize();
				per_vertex_normals.push_back( normal );

				texture_coordinates.push_back( texture_coordinate );

				if ( vertices.size() == number_of_vertices )
				{
					mode = FACES_MODE;
				}
			}			
			break;

		case FACES_MODE:
			{
				int remaining_faces = number_of_faces[0];

				geometry = CreateGeometry( vertices, per_vertex_normals, remaining_faces );

				do
				{
					token = strtok( NULL, delim );
					const int n = atoi( token );
					assert( n == 3 );

					Face face;
					token = strtok( NULL, delim );
					face.vertex_indices[0] = atoi( token );
					token = strtok( NULL, delim );
					face.vertex_indices[1] = atoi( token );
					token = strtok( NULL, delim );
					face.vertex_indices[2] = atoi( token );

					//remaining_faces = geometry->AddFace( face );
					//printf( "\r%0.1f %%", ( remaining_faces / static_cast<REAL>( geometry->number_of_faces() ) ) * 100  );					

					geometry->AddFace( face );
					--remaining_faces;
				} while( remaining_faces > 0 );
			}

			mode = NONE;			

			break;

		default:
			token = strtok( NULL, delim );
		}

		//printf( "\n" );

		//token = strtok( NULL, delim );
	}

	delete [] buffer;
	buffer = NULL;

	//printf( "%d vertices, %d faces\n", geometry->number_of_vertices(), geometry->number_of_faces() );

	geometry->BuildTriangles( flip_normals );	

	return geometry;
}
