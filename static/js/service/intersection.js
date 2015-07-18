raytracer.service("Intersection", [
	"Vector3",
function(
	Vector3
) {

	this.sort = function(items, from, n, axis) {
		// seradit cast pole podle osy
		var arrayToSort = items.slice(from, from + n);

		arrayToSort.sort(function(a, b) {
			var aValue = a.bounds().centroid().getAxisValue(axis);
			var bValue = b.bounds().centroid().getAxisValue(axis);

			return aValue - bValue;
		});

		// pomoci noveho pole upravime to stare
		for (var i = 0; i < arrayToSort.length; i++) {
			items[from + i] = arrayToSort[i];
		}
	};

	// box = aabb
	this.rayBoxIntersection = function(ray, box, t0, t1) {
		var d = box.rwData().bounds;
		var rod = ray.getOrigin().rwData();
		var rid = ray.getInverted().rwData();
		var obj = {
			test: false
		};

		var l1 = (d[0].x - rod.x) * rid.x;
		var l2 = (d[1].x - rod.x) * rid.x;
		var lmin = Math.min(l1,l2);
		var lmax = Math.max(l1,l2);

		l1 = (d[0].y - rod.y) * rid.y;
		l2 = (d[1].y - rod.y) * rid.y;
		lmin = Math.max(Math.min(l1,l2), lmin);
		lmax = Math.min(Math.max(l1,l2), lmax);
			
		l1 = (d[0].z - rod.z) * rid.z;
		l2 = (d[1].z - rod.z) * rid.z;
		lmin = Math.max(Math.min(l1,l2), lmin);
		lmax = Math.min(Math.max(l1,l2), lmax);

		if ( ( lmax >= 0 ) && ( lmax >= lmin ) && ( t0 <= lmax ) && ( t1 >= lmin ) )
		{
			// ray protíná box
			t0 = Math.max( lmin, t0 );
			t1 = Math.min( lmax, t1 );

			obj.test = true;
			obj.t0 = t0;
			obj.t1 = t1;
		}

		return obj;
	};

	this.rayTriangleIntersection97 = function(item, ray) {
		var SMALL_NUM = 0.00000001; // anything that avoids division overflow

		var u, v, n; // triangle vectors
		var dir, w0, w; // ray vectors
		var r, a, b; // params to calc ray-plane intersect
		var d = item.rwData();

		// get triangle edge vectors and plane normal
		u = Vector3.minus(d.vertices[1], d.vertices[0]);
		v = Vector3.minus(d.vertices[2], d.vertices[0]);
		n = u.crossProduct(v); // cross product
		if (n.isEmpty()) return; // triangle is degenerate, do not deal with this case

		// ray direction vector
		dir = ray.getDirection(); // - ray.origin;
		w0 = Vector3.minus(ray.getOrigin(), d.vertices[0]);
		a = (-1) * n.dotProduct(w0); // -dot(n, w0);
		b = n.DotProduct(dir);

		// ray is parallel to triangle plane
		if (Math.abs(b) < SMALL_NUM) return;

		// get intersect point of ray with triangle plane
		r = a / b;
		// ray goes away from triangle
		if (r < 0.0) return; // no intersect
		// for a segment, also test if (r > 1.0) => no intersect
		var output = new Vector3(0, 0, 0); // vysledny vektor - I
		output = Vector3.plus(ray.getOrigin(), Vector3.multiply(r, dir));           // intersect point of ray and plane
			
		// is I inside T? je bod output uvnitr trojuhelniku item
		var uu, uv, vv, wu, wv, D;
		uu = u.dotProduct(u);
		uv = u.dotProduct(v);
		vv = v.dotProduct(v);
		w = Vector3.minus(output, d.vertices[0]);
		wu = w.dotProduct(u);
		wv = w.dotProduct(v);
		D = uv * uv - uu * vv;

		// get and test parametric coords
		var s, t;
		s = (uv * wv - vv * wu) / D;
		// I is outside T
		if (s < 0.0 || s > 1.0) return;
		t = (uv * wu - uu * wv) / D;
		// I is outside T
		if (t < 0.0 || (s + t) > 1.0) return;

		// nastavime nove t
		ray.setT(r, item);
	};
}]);
