import * as $http from "./onix/http";

const TYPES = {
	END_HEADER: "end_header",
	ELEMENT: /element (\w+) (\d+)/,
	PROPERTY: /property (\w+) (.*)$/
};

export default class Ply {
	constructor(opts) {
		this._opts = Object.assign({
			switchYZ: true
		}, opts);
		this._lines = null;
		this._elements = null;
	}

	load(url) {
		return new Promise((resolve, reject) => {
			$http.createRequest({
				url
			}).then(data => {
				this._lines = data.data.split("\n");

				this._parse();
				resolve(this._elements);
			}, e => {
				console.error(e);
				reject(e);
			});
		});
	}

	get elements() {
		return this._elements;
	}

	_parse() {
		// hlavicka
		let elements = [];
		let elementsObj = {};
		let ind = -1;
		let len = this._lines.length;

		// hlavicka
		for (let i = 0; i <= len; i++) {
			let line = this._lines[i].trim();

			if (line.indexOf(TYPES.END_HEADER) != -1) {
				ind = i + 1;
				break;
			}
			else if (line.match(TYPES.ELEMENT)) {
				let data = line.match(TYPES.ELEMENT);
				let elementObj = {
					name: data[1],
					size: parseFloat(data[2]),
					properties: [],
					items: []
				};

				elements.push(elementObj);
				elementsObj[elementObj.name] = elementObj;
			}
			else if (line.match(TYPES.PROPERTY)) {
				let lastElement = elements.length ? elements[elements.length - 1] : null;

				if (lastElement) {
					let data = line.match(TYPES.PROPERTY);
					lastElement.properties.push({
						name: data[2],
						type: data[1]
					});
				}
			}
		}

		if (elementsObj.vertex && this._opts.switchYZ) {
			let propLen = elementsObj.vertex.properties.length;
			let yInd = -1;
			let zInd = -1;

			for (let i = 0; i < propLen; i++) {
				let property = elementsObj.vertex.properties[i];

				if (property.name == "y") {
					yInd = i;
				}
				else if (property.name == "z") {
					zInd = i;
				}
			}

			if (yInd != -1 && zInd != -1 && yInd < zInd) {
				let yItem = elementsObj.vertex.properties.splice(yInd, 1);
				elementsObj.vertex.properties.splice(zInd, 0, yItem[0]);
			}
		}

		if (elements.length) {
			let elInd = 0;
			let curElement = elements[elInd];

			while (true) {
				if (ind >= len) break;

				let line = this._lines[ind];
				this._parseLine(curElement, line);
				
				if (curElement.size == curElement.items.length) {
					elInd++;
					curElement = elements[elInd];

					if (!curElement) break;
				}
				ind++;
			}
		}

		this._elements = elementsObj;
	}

	_parseLine(element, line) {
		let parts = line.split(/\s/).filter(i => i.length);
		let newItem = {};

		element.properties.forEach((property, ind) => {
			switch (property.type) {
				case "float":
					let partValue = parts[ind];

					if (partValue) {
						newItem[property.name] = parseFloat(partValue);
					}
					break;

				case "list":
					parts.forEach((part, partInd) => {
						switch (partInd) {
							case 0:
								newItem.size = parseInt(part);
								newItem.ids = [];
								break;

							default:
								newItem.ids.push(parseInt(part));
						}
					});
					break;
			}
		});

		element.items.push(newItem);
	}
}
