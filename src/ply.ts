const TYPES = {
	END_HEADER: "end_header",
	ELEMENT: /element (\w+) (\d+)/,
	PROPERTY: /property (\w+) (.*)$/
};

export interface PlyProperty {
	name: string;
	type: string;
}

export interface PlyItem {
	// float vlastnosti z hlavicky (x, y, z...)
	values: Record<string, number>;
	// list vlastnost - indexy vrcholu facu
	ids: number[];
}

export interface PlyElement {
	name: string;
	size: number;
	properties: PlyProperty[];
	items: PlyItem[];
}

export type PlyElements = Record<string, PlyElement>;

export interface PlyOptions {
	switchYZ: boolean;
}

export default class Ply {
	private _opts: PlyOptions;
	private _lines: string[];
	private _elements: PlyElements;

	constructor(opts?: Partial<PlyOptions>) {
		this._opts = Object.assign({
			switchYZ: true
		}, opts);
		this._lines = [];
		this._elements = {};
	}

	load(url: string): Promise<PlyElements> {
		return fetch(url).then(response => {
			if (!response.ok) {
				throw new Error(`Loading ${url} failed with status ${response.status}`);
			}

			return response.text();
		}).then(data => {
			this._lines = data.split("\n");

			this._parse();
			return this._elements;
		}, e => {
			console.error(e);
			throw e;
		});
	}

	get elements(): PlyElements {
		return this._elements;
	}

	private _parse(): void {
		// hlavicka
		let elements: PlyElement[] = [];
		let elementsObj: PlyElements = {};
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
				let data = line.match(TYPES.ELEMENT)!;
				let elementObj: PlyElement = {
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
					let data = line.match(TYPES.PROPERTY)!;
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

	private _parseLine(element: PlyElement, line: string): void {
		let parts = line.split(/\s/).filter(i => i.length);
		let newItem: PlyItem = {
			values: {},
			ids: []
		};

		element.properties.forEach((property, ind) => {
			switch (property.type) {
				case "float":
					let partValue = parts[ind];

					if (partValue) {
						newItem.values[property.name] = parseFloat(partValue);
					}
					break;

				case "list":
					// prvni cislo je pocet indexu, zbytek jsou indexy
					parts.slice(1).forEach(part => {
						newItem.ids.push(parseInt(part));
					});
					break;
			}
		});

		element.items.push(newItem);
	}
}
