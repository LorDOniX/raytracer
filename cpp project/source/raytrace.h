#ifndef RAYTRACE_H_
#define RAYTRACE_H_

Vector3 RayTrace(Ray & ray, BVH * bvh, CubeMap * cubemap, bool drawBack, bool phong);

bool BackgroundHit(Ray & ray, BVH * bvh);

#endif
