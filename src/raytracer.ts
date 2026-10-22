import Color from "./color";
import type Cubemap from "./cubemap";
import Material from "./material";
import Light from "./light";
import Vector3 from "./vector3";
import Ray from "./ray";
import * as math from "./math";
import type Camera from "./camera";
import type BVH from "./bvh";

// index lomu vzduchu, material ma vlastni (Material.ior)
const IOR_AIR = 1.000293;
// posun pocatku noveho paprsku od povrchu, aby nezasahl plochu, ze ktere vychazi
const RAY_EPSILON = 1e-5;

export interface RaytracerOptions {
	// true - phong s odrazivosti, false - pruhledny material (lom a odraz podle fresnela)
	phong: boolean;
	background: boolean;
	maxDepth: number;
	minCoefficient: number;
}

export default class Raytracer {
	private _opts: RaytracerOptions;
	private _camera: Camera;
	private _bvh: BVH;
	private _cubemap: Cubemap | null;
	private _materials: Material[];
	private _lights: Light[];

	constructor(camera: Camera, bvh: BVH, opts?: Partial<RaytracerOptions>) {
		this._opts = Object.assign({
			phong: true,
			background: true,
			maxDepth: 6,
			minCoefficient: 1e-2
		}, opts);
		this._camera = camera;
		this._bvh = bvh;
		this._cubemap = null;

		// material
		this._materials = [new Material()];

		// svetlo
		this._lights = [new Light(new Vector3(0.2, 0.3, 0.5)), new Light(new Vector3(0, 0.2, 0.1))];
		this._lights[0].diffuse.setXYZ(0.5, 0.5, 0.5);
		this._lights[1].diffuse.setXYZ(0.3, 0.3, 0.7);
	}

	// pozadi, bez nej (nebo pri vypnutem background) je cerne
	setCubemap(cubemap: Cubemap | null): void {
		this._cubemap = this._opts.background ? cubemap : null;
	}

	// vyrenderuje obdelnik obrazku, vraci jeho RGBA pixely
	renderTile(fromX: number, fromY: number, width: number, height: number): Uint8ClampedArray<ArrayBuffer> {
		let pixels = new Uint8ClampedArray(width * height * 4);
		let ind = 0;

		for (let y = fromY; y < fromY + height; y++) {
			for (let x = fromX; x < fromX + width; x++) {
				// paprsek stredem pixelu
				let ray = this._camera.generateRay(x + 0.5, y + 0.5);
				let color = this._raytrace(ray);

				// nastavime barvu
				pixels[ind++] = color.r;
				pixels[ind++] = color.g;
				pixels[ind++] = color.b;
				pixels[ind++] = color.a;
			}
		}

		return pixels;
	}

	// barva pixelu pro primarni paprsek
	private _raytrace(ray: Ray): Color {
		this._bvh.traverse(ray);

		// nic jsme nezasahli -> pozadi
		if (!ray.changed) {
			return this._cubemap ? this._cubemap.getColor(ray.bgDirection) : Color.black();
		}

		return Color.fromVector3(this._shade(ray, 0, 1), true);
	}

	// prispevek sekundarniho paprsku - barva 0-1 uz vynasobena koeficientem
	private _trace(ray: Ray, depth: number, coefficient: number): Vector3 {
		this._bvh.traverse(ray);

		// paprsek odchazi do okoli, vidi pozadi
		if (!ray.changed) {
			return this._environment(ray.direction).mul(coefficient);
		}

		return this._shade(ray, depth, coefficient);
	}

	// novy paprsek z bodu zasahu, pokud jeste ma smysl ho sledovat
	private _secondary(origin: Vector3, direction: Vector3, depth: number, coefficient: number): Vector3 {
		if (depth >= this._opts.maxDepth || coefficient <= this._opts.minCoefficient) {
			return new Vector3();
		}

		let ray = new Ray(origin, direction);

		return this._trace(ray, depth + 1, coefficient);
	}

	// barva pozadi ve smeru paprsku, 0-1
	private _environment(direction: Vector3): Vector3 {
		if (!this._cubemap) {
			return new Vector3();
		}

		let color = this._cubemap.getColor(this._camera.backgroundDirection(direction));

		return new Vector3(color.r, color.g, color.b).div(255);
	}

	// osvetleni bodu zasahu a pokracovani odrazenym a pripadne propustenym paprskem
	private _shade(ray: Ray, depth: number, coefficient: number): Vector3 {
		// souradnice zasahu
		let target = ray.getTarget();
		let triangle = ray.triangle;

		if (!target || !triangle) {
			return new Vector3();
		}

		// neco jsme trefili, ziskame material zasazeneho objektu
		let material = this._materials[0];
		// geometricka normala trojuhelniku urcuje strany povrchu, interpolovana slouzi ke stinovani
		let geometricNormal = triangle.perFaceNormal.clone();
		let normal = triangle.normal(target);
		// paprsek prichazi zevnitr objektu, obe normaly otocime proti paprsku
		let inside = geometricNormal.dotProduct(ray.direction) > 0;

		if (inside) {
			geometricNormal.mulApply(-1);
			normal.mulApply(-1);
		}

		// body tesne pred a za povrchem - pocatky novych paprsku
		let front = target.plus(geometricNormal.mul(RAY_EPSILON));
		let back = target.minus(geometricNormal.mul(RAY_EPSILON));

		// odrazivost materialu
		coefficient *= material.reflectivity;

		let color = this._lighting(ray, target, front, normal, material, coefficient);
		let reflected = math.reflect(ray.direction, normal);

		// interpolovana normala muze odrazit paprsek pod povrch, pak odrazime podle geometricke
		if (reflected.dotProduct(geometricNormal) <= 0) {
			reflected = math.reflect(ray.direction, geometricNormal);
		}

		if (this._opts.phong) {
			color.plusApply(this._secondary(front, reflected, depth, coefficient));

			return color;
		}

		// index lomu prostredi, ze ktereho paprsek prichazi (n1) a do ktereho vstupuje (n2)
		let n1 = inside ? material.ior : IOR_AIR;
		let n2 = inside ? IOR_AIR : material.ior;
		// interpolovana normala muze byt od paprsku odvracena
		let refraction = math.refract(ray.direction, normal.dotProduct(ray.direction) < 0 ? normal : geometricNormal, n1, n2);

		// lomeny paprsek musi jit pod povrch, jinak lamame podle geometricke normaly
		if (refraction.refracted && refraction.refracted.dotProduct(geometricNormal) >= 0) {
			refraction = math.refract(ray.direction, geometricNormal, n1, n2);
		}

		// odrazena cast (pri totalnim odrazu vse)
		color.plusApply(this._secondary(front, reflected, depth, coefficient * refraction.reflectance));

		// propustena cast
		if (refraction.refracted) {
			color.plusApply(this._secondary(back, refraction.refracted, depth, coefficient * (1 - refraction.reflectance)));
		}

		return color;
	}

	// phongovo osvetleni bodu target ze vsech svetel, vynasobene koeficientem
	// origin - pocatek stinovych paprsku tesne pred povrchem
	private _lighting(ray: Ray, target: Vector3, origin: Vector3, normal: Vector3, material: Material, coefficient: number): Vector3 {
		let color = new Vector3();

		for (let li = 0; li < this._lights.length; ++li) {
			let light = this._lights[li];

			// ambientni osvetleni je pritomno vzdy
			color.plusApply(material.ambiente.mul(light.ambiente, coefficient));

			// smerovy vektor od bodu zasahu k svetelnemu zdroji
			let l = light.position.minus(target);
			let lightDistance = l.norm();
			l.normalize();
			
			// paprsek z bodu target do svetla, zasahy za svetlem nestini
			let shadowRay = new Ray(origin, l, undefined, lightDistance);
			// je target ve stinu
			this._bvh.traverse(shadowRay);

			if (!shadowRay.changed) {
				// target neni ve stinu, vypocteme tedy i ostatni slozky osvetleni
				// odrazeny paprsek
				let lr = l.minus(normal.mul(2 * normal.dotProduct(l)));

				// difuzni
				color.plusApply(material.diffuse.mul(light.diffuse, coefficient, Math.max(normal.dotProduct(l), 0)));

				// spekularni
				let ldd = Math.max(lr.dotProduct(ray.direction), 0);
				color.plusApply(material.specular.mul(light.specular, coefficient, Math.pow(ldd, material.shininess)));
			}
		}

		return color;
	}
}
