import Vector3 from "./vector3";

// anything that avoids division overflow
const SMALL_NUM = 0.00000001;
const SORT_MAX_LVLS = 300;

export function rayTriangleIntersection97(ray, triangle) {
	// get triangle edge vectors and plane normal
	let u = triangle.vertices[1].minus(triangle.vertices[0]);
	let v = triangle.vertices[2].minus(triangle.vertices[0]);
	let n = u.crossProduct(v); // cross product

	// triangle is degenerate, do not deal with this case
	if (n.isEmpty()) return;

	let dir = ray.direction;
	let w0 = ray.origin.minus(triangle.vertices[0]);
	let a = (-1) * n.dotProduct(w0);
	let b = n.dotProduct(dir);

	// ray is parallel to triangle plane
	if (Math.abs(b) < SMALL_NUM) return;

	// get intersect point of ray with triangle plane
	let r = a / b;
	// ray goes away from triangle
	if (r < 0.0) return; // no intersect
	// for a segment, also test if (r > 1.0) => no intersect
	let output = ray.origin.plus(dir.mul(r));           // intersect point of ray and plane
		
	// is I inside T? je bod output uvnitr trojuhelniku item
	let uu = u.dotProduct(u);
	let uv = u.dotProduct(v);
	let vv = v.dotProduct(v);
	let w = output.minus(triangle.vertices[0]);
	let wu = w.dotProduct(u);
	let wv = w.dotProduct(v);
	let D = uv * uv - uu * vv;

	// get and test parametric coords
	let s = (uv * wv - vv * wu) / D;
	// I is outside T
	if (s < 0.0 || s > 1.0) return;
	let t = (uv * wu - uu * wv) / D;
	// I is outside T
	if (t < 0.0 || (s + t) > 1.0) return;

	// nastavime nove t
	ray.setTarget(r, triangle);
}

export function deg2Rad(deg) {
	return (deg / 180 * Math.PI);
}

export function sortTriangles(items, from, n, axis) {
	let beg = new Array(SORT_MAX_LVLS);
	let end = new Array(SORT_MAX_LVLS);
	beg[0] = 0;
	end[0] = n;
	
	let i = 0;

	while (i >= 0) {
		let L = beg[i];
		let R = end[i] - 1;
		
		if (L < R) {
			let piv = items[from + L];
			
			while (L < R) {
				while (items[from + R].bounds().centroid().axis(axis) >= piv.bounds().centroid().axis(axis) && L < R) {
					R--;
				}

				if (L < R) {
					items[from + L++] = items[from + R];
				}

				while (items[from + L].bounds().centroid().axis(axis) <= piv.bounds().centroid().axis(axis) && L < R) {
					L++;
				}

				if (L < R) {
					items[from + R--] = items[from + L];
				}
			}
			
			items[from + L] = piv;
			beg[i + 1] = L+1;
			end[i + 1] = end[i];
			end[i++] = L;
			
			if (end[i] - beg[i] > end[i - 1] - beg[i - 1]) {
				let swap = beg[i];
				beg[i] = beg[i - 1];
				beg[i - 1] = swap;
				swap = end[i];
				end[i] = end[i-1];
				end[i - 1] = swap;
			}
		}
		else {
			i--;
		}
	}
}

export function rayBoxIntersection(ray, aabb, t0, t1) {
	let l1 = (aabb.minVec.x - ray.origin.x) * ray.inverted.x;
	let l2 = (aabb.maxVec.x - ray.origin.x) * ray.inverted.x;
	let lmin = Math.min(l1,l2);
	let lmax = Math.max(l1,l2);

	l1 = (aabb.minVec.y - ray.origin.y) * ray.inverted.y;
	l2 = (aabb.maxVec.y - ray.origin.y) * ray.inverted.y;
	lmin = Math.max(Math.min(l1,l2), lmin);
	lmax = Math.min(Math.max(l1,l2), lmax);
	
	l1 = (aabb.minVec.z - ray.origin.z) * ray.inverted.z;
	l2 = (aabb.maxVec.z - ray.origin.z) * ray.inverted.z;
	lmin = Math.max(Math.min(l1,l2), lmin);
	lmax = Math.min(Math.max(l1,l2), lmax);

	if ((lmax >= 0 ) && (lmax >= lmin) && (t0 <= lmax) && (t1 >= lmin)) {
		t0 = Math.max(lmin, t0);
		t1 = Math.min(lmax, t1);

		return true;
	}
	else {
		return false;
	}
}
