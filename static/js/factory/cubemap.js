raytracer.factory("Cubemap", [
	"Vector3",
	"$q",
function(
	Vector3,
	$q
) {
	
	var Cubemap = function() {
		// pojmenovane jednotlive bitmapy
		this._E_CUBE_MAPS = {
			POS_X: 0,
			NEG_X: 1,
			POS_Y: 2,
			NEG_Y: 3,
			POS_Z: 4,
			NEG_Z: 5
		};

		this._IMG_DIM = {
			width: 2048,
			height: 2048
		};

		// pocet map
		this._mapsCount = 6;

		// cesty k mapam
		this._cubeMaps = new Array(this._mapsCount);

		// jednotlive obrazky
		this._maps = new Array(this._mapsCount);

		// cesty k mapam
		this._cubeMaps[0] = "/img/posx.jpg";
		this._cubeMaps[1] = "/img/negx.jpg";
		this._cubeMaps[2] = "/img/posy.jpg";
		this._cubeMaps[3] = "/img/negy.jpg";
		this._cubeMaps[4] = "/img/posz.jpg";
		this._cubeMaps[5] = "/img/negz.jpg";

		this._el = document.querySelector(".img-area");

		var canvas = document.createElement("canvas");
		canvas.width = this._IMG_DIM.width;
		canvas.height = this._IMG_DIM.height;

		this._el.appendChild(canvas);

		this._canvas = canvas;
	};

	Cubemap.prototype.load = function() {
		return this._loadImages();
	};

	Cubemap.prototype._loadImages = function() {
		var lock = this._mapsCount;
		var promise = $q.defer();

		// pro vsechny prvky
		for (var i = 0; i < this._mapsCount; i++) {
			var img = new Image();
			img.src = this._cubeMaps[i];
			img.onload = function() {
				lock--;
				
				if (lock == 0) {
					promise.resolve();
				}
			};
			img.onerror = function() {
				lock--;
				
				if (lock == 0) {
					promise.resolve();
				}
			};

			this._el.appendChild(img);

			this._maps[i] = img;
		}

		return promise;
	};

	Cubemap.prototype._getMasterAxis = function(vec3) {
		var vec = vec3.rwData();

		if (Math.abs(vec.x) > Math.abs(vec.y) && Math.abs(vec.x) > Math.abs(vec.z)) {
			return 0;
		}
		else if (Math.abs(vec.y) > Math.abs(vec.x) && Math.abs(vec.y) > Math.abs(vec.z)) {
			return 1;
		}
		else if (Math.abs(vec.z) > Math.abs(vec.x) && Math.abs(vec.z) > Math.abs(vec.y)) {
			return 2;
		}
	};

	// http://cboard.cprogramming.com/game-programming/87890-bilinear-interpolation.html
	// x a y je vstup ve float formatu, vystup je pak taky x a y, ale prepocitany
	// vraci vec3
	Cubemap.prototype._bilinearInterpolation = function(width, height, x, y, image) {
		// S = (1-p)(1-q) a + (1-p) q c + p (1-q) b + p q d
		// where (p,q) are the coordinates you find by taking the R-inverse transformation of your destination image pixel and a, b, c and d are the color information of the respective pixels (you have to apply red, green and blue seperately).
		
		var p = x - Math.floor(x);
		var q = y - Math.floor(y);

		// potrebuje 4 souradnice okolnich pixelu
		var p1x, p2x, p3x, p4x;
		var p1y, p2y, p3y, p4y;

		// omezeni sirky
		if (x >= width - 1.0)
		{
			p1x = p2x = p3x = p4x = Math.floor(x);
		}
		else
		{
			p1x = Math.floor(x);
			p2x = Math.floor(x);
			p3x = Math.floor(x) + 1;
			p4x = Math.floor(x) + 1;
		}

		// omezeni vysky
		if (y >= height - 1.0)
		{
			p1y = p2y = p3y = p4y = Math.floor(y);
		}
		else
		{
			p1y = Math.floor(y);
			p2y = Math.floor(y) + 1;
			p3y = Math.floor(y);
			p4y = Math.floor(y) + 1;
		}

		// 4 barvy pixelu
		var ctx = this._canvas.getContext("2d");
		ctx.drawImage(image, 0, 0, this._IMG_DIM.width, this._IMG_DIM.height);

		var a = this._getPixelFromImage(ctx, p1x, p1y); // 4x vektor s barvou
		var b = this._getPixelFromImage(ctx, p2x, p2y);
		var c = this._getPixelFromImage(ctx, p3x, p3y);
		var d = this._getPixelFromImage(ctx, p4x, p4y);

		//var S = (1 - p)*(1 - q) * a + (1-p) * q * c + p * (1-q) * b + p * q * d;

		var S = Vector3.plus(
			Vector3.plus(
				Vector3.multiply(
					(1 - p) * (1 - q),
					a
				),
				Vector3.multiply(
					(1- p) * q,
					c
				)
			),
			Vector3.plus(
				Vector3.multiply(
					p * (1-q),
					b
				),
				Vector3.multiply(
					p * q,
					d
				)
			)
		);

		// vracime
		return S;
	};

	Cubemap.prototype._getPixelFromImage = function(ctx, x, y) {
		var data = ctx.getImageData(x, y, 1, 1).data;

		var colorX = data[0] / 255;
		var colorY = data[1] / 255;
		var colorZ = data[2] / 255;

		var output = new Vector3(0, 0, 0);
		output.setXYZ(colorZ, colorY, colorX);

		return output;
	};

	Cubemap.prototype.getColor = function(direction) {
		var map = this._getCubeMap(direction);

		var x, y;
		var image = this._maps[map];
		var d = direction.rwData();

		switch (map)
		{// s = (sc / |ma| + 1) / 2    t = (tc / |ma| + 1) / 2
			case this._E_CUBE_MAPS.POS_X: // -y,z 
				x = 1.0 - (d.z / Math.abs(d.x) + 1.0) * 0.5;
				y = 1.0 - (d.y / Math.abs(d.x) + 1.0) * 0.5; 
				break;

			case this._E_CUBE_MAPS.NEG_X: // z, y
				x = (d.z / Math.abs(d.x) + 1.0) * 0.5;
				y = 1.0 - (d.y / Math.abs(d.x) + 1.0) * 0.5; 
				break; 

			case this._E_CUBE_MAPS.POS_Y:
				x = (d.x / Math.abs(d.y) + 1.0) * 0.5;
				y = (d.z / Math.abs(d.y) + 1.0) * 0.5; 
				break;

			case this._E_CUBE_MAPS.NEG_Y:
				x = (d.x / Math.abs(d.y) + 1.0) * 0.5;
				y = 1.0 - (d.z / Math.abs(d.y) + 1.0) * 0.5; 
				break;

			case this._E_CUBE_MAPS.POS_Z:
				x = (d.x / Math.abs(d.z) + 1.0) * 0.5;
				y = 1.0 - (d.y / Math.abs(d.z) + 1.0) * 0.5; 
				break;

			case this._E_CUBE_MAPS.NEG_Z:
				x = 1.0 - (d.x / Math.abs(d.z) + 1.0) * 0.5;
				y = 1.0 - (d.y / Math.abs(d.z) + 1.0) * 0.5; 
				break;
		}

		// parametry obrazu - bilinearni interpolace
		// http://www.devmaster.net/articles/raytracing_series/part6.php
		var width = this._IMG_DIM.width; 
		var height = this._IMG_DIM.height;

		// nova pozice x
		var newX = width * x;
		var newY = height * y;

		//return GetPixelFromImage(image, (int) newX, (int) newY);
		return this._bilinearInterpolation(width, height, newX, newY, image);
	};

	Cubemap.prototype._getCubeMap = function(direction) {
		var ma = this._getMasterAxis(direction);

		var d = direction.rwData();

		switch (ma)
		{
			case 0:
				if (d.x >= 0) {
					return (this._E_CUBE_MAPS.POS_X);
				}
				else {
					return (this._E_CUBE_MAPS.NEG_X);
				}
				break;

			case 1:
				if (d.y >= 0) {
					return (this._E_CUBE_MAPS.POS_Y);
				}
				else {
					return (this._E_CUBE_MAPS.NEG_Y);
				}
				break;

			case 2:
				if (d.z >= 0) {
					return (this._E_CUBE_MAPS.POS_Z);
				}
				else {
					return (this._E_CUBE_MAPS.NEG_Z);
				}
				break;
		}
	};

	return Cubemap;
}]);
