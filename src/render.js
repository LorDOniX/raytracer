const Jimp = require('jimp');
const Color = require("./color");
const Cubemap = require("./cubemap");
const Material = require("./material");
const Light = require("./light");
const Vector3 = require("./vector3");
const Ray = require("./ray");

// vzduch a material
const IOR_AIR = 1.000293;
const IOR_MATERIAL = 1.5;

class Render {
	constructor(camera, bvh, opts) {
		this._opts = Object.assign({
			phong: true,
			background: true,
			maxDepth: 6,
			minCoefficient: 1e-2,
			x: [0, camera.width],
			y: [0, camera.height],
			debug: false
		}, opts);
		this._camera = camera;
		this._bvh = bvh;
		this._cubemap = new Cubemap();
		this._startTime = 0;
		this._data = [];

		// material
		this._materials = [new Material()];

		// svetlo
		this._lights = [new Light(new Vector3(0.2, 0.3, 0.5)), new Light(new Vector3(0, 0.2, 0.1))];
		this._lights[0].diffuse.setXYZ(0.5, 0.5, 0.5);
		this._lights[1].diffuse.setXYZ(0.3, 0.3, 0.7);
	}

	get data() {
		return this._data;
	}

	async render() {
		if (this._opts.background) {
			if (this._opts.debug) {
				console.log(`Render`);
				console.log(`Render loading cubemap images...`);
			}
			
			await this._cubemap.load();

			if (this._opts.debug) {
				console.log(`Images are loaded`);
			}
		}
		else if (this._opts.debug) {
			console.log(`Render`);
		}

		if (this._opts.debug) {
			console.log(`Starting rendering...`);
		}

		this._startTime = Date.now();

		let time = Date.now();

		for (let y = this._opts.y[0]; y < this._opts.y[1]; y++) {
			for (let x = this._opts.x[0]; x < this._opts.x[1]; x++) {
				let ray = this._camera.generateRay(x, y);
				let color = this._raytrace(ray);

				// nastavime barvu
				let hxColor = Jimp.rgbaToInt(color.r, color.g, color.b, color.a);

				this._data.push(hxColor);
			}
		}
	}

	_raytrace(rayArg) {
		let ray = rayArg;
		let color = new Vector3();
		let depth = 0;
		// koeficient utlumu odrazivosti 1
		let coefficient = 1;
		// byl aspon 1 zasah ?
		let hits = 0;
		let currentMaterial = IOR_MATERIAL;

		do {
			this._bvh.traverse(ray);

			if (ray.changed) {
				// zasah ++
				hits++;

				// neco jsme trefili, ziskame material zasazeneho objektu
				let material = this._materials[0];
				// souradnice zasahu
				let target = ray.getTarget();
				// interpolovana normala plochy v bode target
				let targetNormal = ray.triangle.normal(target);
				let r = ray.direction.minus(targetNormal.mul(2 * targetNormal.dotProduct(ray.direction)));
				let newRay;
				
				if (!this._opts.phong) {
					// materialy
					let n1 = currentMaterial;
					let n2 = (n1 == IOR_AIR) ? IOR_MATERIAL : IOR_AIR;

					// snell's law
					let cosTheta1 = Math.abs(targetNormal.dotProduct(-ray.direction));
					let cosTheta2 = Math.sqrt(1 - Math.pow(n1 / n2, 2) * (1 - Math.pow(cosTheta1, 2)));
					// goniometricka 1 dopocteni
					let sinTheta1 = Math.sqrt(1 - Math.pow(cosTheta1, 2));
					// pokud je tato hodnota vetsi jak 1 -> totalni reflexe
					let sinTheta2 = (n1 / n2) * sinTheta1;

					// nyni budeme pocitat fresnel equations
					// cost theta i = cos theta 1 apod. pro theta t
					let Rs = Math.pow((n1 * cosTheta1 - n2 * cosTheta2) / (n1 * cosTheta1 + n2 * cosTheta2), 2);
					let Rp = Math.pow((n1 * cosTheta2 - n2 * cosTheta1) / (n1 * cosTheta2 + n2 * cosTheta1), 2);

					let R = (Rs + Rp) / 2;
					let T = 1 - R;
					// material - transmisivity
					let matTran = 1;

					// ruska ruleta, nahodne cislo <0..1>
					let rr = Math.random();

					if (rr <= R) {
						// odrazeny paprsek - reflect
						matTran = R;
						currentMaterial = n1;

						// tento kod je podobny jak ten nahore z phonga
						r = ray.direction.plus(targetNormal.mul(2 * cosTheta1));
						r.normalize();
					}
					else if (rr <= R + T) {
						// propusteny paprsek - refract
						matTran = T;
						currentMaterial = n2;

						// smerovy paprsek noveho paprsku ulozime do r
						r = ray.direction.mul(n1 / n2).plus(targetNormal.mul(n1 / n2 * cosTheta1 - cosTheta2));
						r.normalize();
					}

					// ruska ruleta pro material transmitivity, jinak phong pouze reflectivity
					coefficient *= matTran * material.reflectivity;
				}
				else {
					// pouze odrazivoast materialu
					coefficient *= material.reflectivity;
				
					// odražený nebo propuštěný paprsek
					newRay = new Ray(target.plus(r.mul(0.001)), r);
				}

				// vypocet prispevku osvetleni bodu target ze vsech svetel
				for (let li = 0; li < this._lights.length; ++li) {
					let light = this._lights[li];

					// ambientni osvetleni je pritomno vzdy
					color.plusApply(material.ambiente.mul(light.ambiente, coefficient));

					// smerovy vektor od bodu zasahu k svetelnemu zdroji
					let l = light.position.minus(target);
					l.normalize();
					
					// paprsek z bodu target do svetla
					let shadowRay = new Ray(target.plus(l.mul(0.001)), l);
					// je target ve stinu
					this._bvh.traverse(shadowRay);

					if (!shadowRay.changed) {
						// target neni ve stinu, vypocteme tedy i ostatni slozky osvetleni
						// odrazeny paprsek
						let lr = l.minus(targetNormal.mul(2 * targetNormal.dotProduct(l)));

						// difuzni
						color.plusApply(material.diffuse.mul(light.diffuse, coefficient, Math.max(targetNormal.dotProduct(l), 0)));

						// spekularni
						let ldd = Math.max(lr.dotProduct(ray.direction), 0);
						color.plusApply(material.specular.mul(light.specular, coefficient, Math.pow(ldd, material.shininess)));
					}
				}

				ray = newRay; // trasování pokračuje s novým paprskem
			}
			else {
				// nic jsme netrefili, končíme s tím, co je v color
				break;
			}
		}
		while ((depth++ < this._opts.maxDepth) && (coefficient > this._opts.minCoefficient));

		// nic jsme nezasahli ?
		if (hits == 0) {
			if (this._opts.background) {
				return this._cubemap.getColor(ray.bgDirection);
			}
			else {
				return Color.black();
			}
		}
		else {
			// omezeni - todo, nekde je chyba, barva mimo <0;1>
			color.alignValues(0, 1);
			return Color.fromVector3(color, true);
		}
	}
}

module.exports = Render;
