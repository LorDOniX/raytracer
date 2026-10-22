import type Vector3 from "./vector3";
import type Ray from "./ray";

// anything that avoids division overflow
const SMALL_NUM = 0.00000001;

/**
 * Prusecik paprsku s trojuhelnikem (Moller-Trumbore), zasah ulozi do paprsku i s barycentrickymi
 * souradnicemi. Trojuhelnik se testuje z obou stran (paprsek muze byt uvnitr objektu).
 *
 * @param  ray      Paprsek, jeho pocatek (ox, oy, oz) a smer (dx, dy, dz) se predavaji po slozkach
 * @param  vertices Vrcholy trojuhelniku po 9 cislech
 * @param  index    Index trojuhelniku
 */
export function rayTriangleIntersection(ray: Ray, vertices: Float64Array, index: number,
	ox: number, oy: number, oz: number, dx: number, dy: number, dz: number): void {
	let i = index * 9;
	let v0x = vertices[i];
	let v0y = vertices[i + 1];
	let v0z = vertices[i + 2];
	// hrany v0 -> v1 a v0 -> v2
	let e1x = vertices[i + 3] - v0x;
	let e1y = vertices[i + 4] - v0y;
	let e1z = vertices[i + 5] - v0z;
	let e2x = vertices[i + 6] - v0x;
	let e2y = vertices[i + 7] - v0y;
	let e2z = vertices[i + 8] - v0z;
	// p = dir x e2
	let px = dy * e2z - dz * e2y;
	let py = dz * e2x - dx * e2z;
	let pz = dx * e2y - dy * e2x;
	let det = e1x * px + e1y * py + e1z * pz;

	// paprsek je rovnobezny s rovinou trojuhelniku nebo je trojuhelnik degenerovany
	if (Math.abs(det) < SMALL_NUM) return;

	let invDet = 1 / det;
	let sx = ox - v0x;
	let sy = oy - v0y;
	let sz = oz - v0z;
	let u = (sx * px + sy * py + sz * pz) * invDet;

	if (u < 0 || u > 1) return;

	// q = s x e1
	let qx = sy * e1z - sz * e1y;
	let qy = sz * e1x - sx * e1z;
	let qz = sx * e1y - sy * e1x;
	let v = (dx * qx + dy * qy + dz * qz) * invDet;

	if (v < 0 || u + v > 1) return;

	let t = (e2x * qx + e2y * qy + e2z * qz) * invDet;

	// trojuhelnik je za pocatkem paprsku
	if (t < 0) return;

	ray.setTarget(t, index, u, v);
}

export function deg2Rad(deg: number): number {
	return (deg / 180 * Math.PI);
}

/**
 * Vzdalenost vstupu paprsku do boxu (zaporna, pokud pocatek lezi uvnitr), Infinity pokud box mine
 * nebo box zacina dal nez maxDistance (dosavadni nejblizsi zasah). Paprsek se predava po slozkach,
 * aby se pri pruchodu BVH nacital jen jednou.
 *
 * @param  bounds      Boxy po 6 cislech (min x, y, z, max x, y, z)
 * @param  index       Index boxu
 * @param  ox          Pocatek paprsku
 * @param  ix          Invertovany smer paprsku (1 / smer)
 * @param  maxDistance Vzdalenost, za kterou uz box nezajima
 */
export function rayBoxIntersection(bounds: Float64Array, index: number, ox: number, oy: number, oz: number,
	ix: number, iy: number, iz: number, maxDistance: number): number {
	let i = index * 6;
	let l1 = (bounds[i] - ox) * ix;
	let l2 = (bounds[i + 3] - ox) * ix;
	let lmin = Math.min(l1,l2);
	let lmax = Math.max(l1,l2);

	l1 = (bounds[i + 1] - oy) * iy;
	l2 = (bounds[i + 4] - oy) * iy;
	lmin = Math.max(Math.min(l1,l2), lmin);
	lmax = Math.min(Math.max(l1,l2), lmax);
	
	l1 = (bounds[i + 2] - oz) * iz;
	l2 = (bounds[i + 5] - oz) * iz;
	lmin = Math.max(Math.min(l1,l2), lmin);
	lmax = Math.min(Math.max(l1,l2), lmax);

	if ((lmax >= 0 ) && (lmax >= lmin) && (lmin <= maxDistance)) {
		return lmin;
	}
	else {
		return Infinity;
	}
}

// odraz smeru podle normaly
export function reflect(direction: Vector3, normal: Vector3): Vector3 {
	return direction.minus(normal.mul(2 * normal.dotProduct(direction)));
}

export interface Refraction {
	// podil odrazeneho svetla (fresnel), propusti se 1 - reflectance
	reflectance: number;
	// smer lomeneho paprsku, null pri totalnim odrazu
	refracted: Vector3 | null;
}

/**
 * Lom paprsku na rozhrani (snelluv zakon) a podil odrazeneho svetla (fresnelovy rovnice).
 *
 * @param  direction Smer paprsku
 * @param  normal    Normala otocena proti paprsku
 * @param  n1        Index lomu prostredi, ze ktereho paprsek prichazi
 * @param  n2        Index lomu prostredi, do ktereho vstupuje
 */
export function refract(direction: Vector3, normal: Vector3, n1: number, n2: number): Refraction {
	let cosI = -normal.dotProduct(direction);
	let eta = n1 / n2;
	// sin^2 uhlu lomu
	let sin2T = eta * eta * (1 - cosI * cosI);

	// totalni odraz
	if (sin2T >= 1) {
		return {
			reflectance: 1,
			refracted: null
		};
	}

	let cosT = Math.sqrt(1 - sin2T);
	let Rs = Math.pow((n1 * cosI - n2 * cosT) / (n1 * cosI + n2 * cosT), 2);
	let Rp = Math.pow((n1 * cosT - n2 * cosI) / (n1 * cosT + n2 * cosI), 2);
	let refracted = direction.mul(eta).plus(normal.mul(eta * cosI - cosT));
	refracted.normalize();

	return {
		reflectance: (Rs + Rp) / 2,
		refracted
	};
}
