#pragma once

#define NOMINMAX
#define _CRT_SECURE_NO_WARNINGS

#include <assert.h>
#include <stdio.h>
#define _USE_MATH_DEFINES
#include <math.h>
#include <vector>
#include <time.h>

// open mp standart
#include <omp.h>
// grafika opencv
#include <opencv2/opencv.hpp>

#define REAL float

#define DEG2RAD( x ) ( ( x ) * static_cast<REAL>( M_PI / 180.0 ) )
#define SQR( x ) ( ( x ) * ( x ) )
#define MAX_REAL 1e+20

#define MIN( a, b ) ( ( a < b )? a : b )
#define MAX( a, b ) ( ( a > b )? a : b )

#include "funcs.h"

#include "vector.h"
#include "geometry.h"
#include "ply.h"
#include "camera.h"
#include "structs.h"
#include "cubemap.h"

#include "intersection.h"
#include "sstructs.h"
#include "BVH.h"

#include "raytrace.h"
#include "render.h"