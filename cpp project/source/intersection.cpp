#include "stdafx.h"

void Sort(Triangle * items, int n, char axis)
{
	#define MAX_LEVELS  300 

	int beg[MAX_LEVELS];
	int end[MAX_LEVELS];

	int i=0, L, R, swap ;
	Triangle piv;

	beg[0]=0; end[0]=n;
			
	while (i>=0) {
	L=beg[i]; R=end[i]-1;
	if (L<R) {
		piv=items[L];
		while (L<R) {
			while (items[R].Bounds().Centroid().data[axis] >=piv.Bounds().Centroid().data[axis] && L<R) R--; if (L<R) items[L++]=items[R];
			while (items[L].Bounds().Centroid().data[axis] <= piv.Bounds().Centroid().data[axis] && L < R) L++; if (L < R) items[R--] = items[L];
		}
		items[L]=piv; beg[i+1]=L+1; end[i+1]=end[i]; end[i++]=L;
		if (end[i]-beg[i]>end[i-1]-beg[i-1]) {
			swap=beg[i]; beg[i]=beg[i-1]; beg[i-1]=swap;
			swap=end[i]; end[i]=end[i-1]; end[i-1]=swap; }}
	else {
	i--; }}
}

bool RayBoxIntersection(Ray & ray, AABB & box, float & t0, float & t1)
{
	float
	l1	= (box.bounds[0].x - ray.origin.x) * ray.inv.x,
	l2	= (box.bounds[1].x - ray.origin.x) * ray.inv.x,
	lmin	= MIN(l1,l2),
	lmax	= MAX(l1,l2);

	l1	= (box.bounds[0].y - ray.origin.y) * ray.inv.y;
	l2	= (box.bounds[1].y - ray.origin.y) * ray.inv.y;
	lmin	= MAX(MIN(l1,l2), lmin);
	lmax	= MIN(MAX(l1,l2), lmax);
		
	l1	= (box.bounds[0].z - ray.origin.z) * ray.inv.z;
	l2	= (box.bounds[1].z - ray.origin.z) * ray.inv.z;
	lmin	= MAX(MIN(l1,l2), lmin);
	lmax	= MIN(MAX(l1,l2), lmax);

	if ( ( lmax >= 0 ) && ( lmax >= lmin ) &&
        ( t0 <= lmax ) && ( t1 >= lmin ) )
    {
        // ray protíná box
        t0 = MAX( lmin, t0 );
        t1 = MIN( lmax, t1 );

        return true;
    }

    return false; 
}

void RayTriangleIntersection97(Triangle * item, Ray & ray)
{
	#define SMALL_NUM  0.00000001 // anything that avoids division overflow

	Vector3 u, v, n; // triangle vectors
	Vector3 dir, w0, w; // ray vectors
	REAL r, a, b; // params to calc ray-plane intersect

	// get triangle edge vectors and plane normal
	u = item->vertices[1] - item->vertices[0];
	v = item->vertices[2] - item->vertices[0];
	n = u.CrossProduct(v); // cross product
	if (n.IsEmpty()) return; // triangle is degenerate, do not deal with this case

	// ray direction vector
	dir = ray.direction; // - ray.origin;
	w0 = ray.origin - item->vertices[0];
	a = (-1) * n.DotProduct(w0); // -dot(n, w0);
	b = n.DotProduct(dir);

	// ray is parallel to triangle plane
	if (fabs(b) < SMALL_NUM) return;

	// get intersect point of ray with triangle plane
	r = a / b;
	// ray goes away from triangle
	if (r < 0.0) return; // no intersect
	// for a segment, also test if (r > 1.0) => no intersect
	Vector3 output = Vector3(0, 0, 0); // vysledny vektor - I
	output = ray.origin + r * dir;           // intersect point of ray and plane
		
	// is I inside T? je bod output uvnitr trojuhelniku item
	REAL uu, uv, vv, wu, wv, D;
	uu = u.DotProduct(u);
	uv = u.DotProduct(v);
	vv = v.DotProduct(v);
	w = output - item->vertices[0];
	wu = w.DotProduct(u);
	wv = w.DotProduct(v);
	D = uv * uv - uu * vv;

	// get and test parametric coords
	REAL s, t;
	s = (uv * wv - vv * wu) / D;
	// I is outside T
	if (s < 0.0 || s > 1.0) return;
	t = (uv * wu - uu * wv) / D;
	// I is outside T
	if (t < 0.0 || (s + t) > 1.0) return;

	// nastavime nove t
	ray.SetT(r, item);
}

