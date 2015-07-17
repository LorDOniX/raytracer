#ifndef PLY_H_
#define PLY_H_

long long GetFileSize64( const char * file_name );
Geometry * LoadPLY( const char * file_name, REAL scale = 1, bool flip_normals = false );

#endif