#ifndef INTERSCETION_H_
#define INTERSCETION_H_

void Sort(Triangle * items, int n, char axis);

bool RayBoxIntersection(Ray & ray, AABB & box, float & t0, float & t1);

void RayTriangleIntersection97(Triangle * item, Ray & ray);

#endif

