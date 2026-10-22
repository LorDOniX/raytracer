const TYPES = {
	FORMAT: /^format (\w+)/,
	END_HEADER: "end_header",
	ELEMENT: /^element (\w+) (\d+)/,
	LIST_PROPERTY: /^property list (\w+) (\w+) (\w+)/,
	PROPERTY: /^property (\w+) (\w+)/
};

// nazvy list vlastnosti s indexy vrcholu facu
const VERTEX_INDICES = ["vertex_indices", "vertex_index"];

export interface PlyProperty {
	name: string;
	// datovy typ hodnoty, u listu typ jeho polozek
	type: string;
	list: boolean;
}

export interface PlyItem {
	// skalarni vlastnosti z hlavicky (x, y, z...)
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
		let elements: PlyElement[] = [];
		let elementsObj: PlyElements = {};
		let ind = -1;
		let len = this._lines.length;

		// hlavicka
		for (let i = 0; i < len; i++) {
			let line = this._lines[i].trim();
			let data: RegExpMatchArray | null;
			let lastElement = elements.length ? elements[elements.length - 1] : null;

			if (line == TYPES.END_HEADER) {
				ind = i + 1;
				break;
			}
			else if ((data = line.match(TYPES.FORMAT))) {
				if (data[1] != "ascii") {
					throw new Error(`Unsupported PLY format "${data[1]}", only ascii is supported`);
				}
			}
			else if ((data = line.match(TYPES.ELEMENT))) {
				let elementObj: PlyElement = {
					name: data[1],
					size: parseInt(data[2]),
					properties: [],
					items: []
				};

				elements.push(elementObj);
				elementsObj[elementObj.name] = elementObj;
			}
			else if (lastElement && (data = line.match(TYPES.LIST_PROPERTY))) {
				lastElement.properties.push({
					name: data[3],
					type: data[2],
					list: true
				});
			}
			else if (lastElement && (data = line.match(TYPES.PROPERTY))) {
				lastElement.properties.push({
					name: data[2],
					type: data[1],
					list: false
				});
			}
		}

		if (ind == -1) {
			throw new Error("PLY header is missing end_header");
		}

		// prohozeni os Y a Z - prejmenujeme vlastnosti
		let swapped = false;

		if (elementsObj.vertex && this._opts.switchYZ) {
			let yProperty = elementsObj.vertex.properties.find(property => property.name == "y");
			let zProperty = elementsObj.vertex.properties.find(property => property.name == "z");

			if (yProperty && zProperty) {
				yProperty.name = "z";
				zProperty.name = "y";
				swapped = true;
			}
		}

		// data - elementy jdou za sebou v poradi z hlavicky
		let elInd = 0;

		for (let i = ind; i < len; i++) {
			// preskocime naplnene (i prazdne) elementy
			while (elInd < elements.length && elements[elInd].items.length >= elements[elInd].size) {
				elInd++;
			}

			if (elInd >= elements.length) break;

			let line = this._lines[i].trim();

			if (!line) continue;

			this._parseLine(elements[elInd], line);
		}

		// prohozeni dvou os model zrcadli, otocime poradi vrcholu facu, aby normaly dal smerovaly ven
		if (swapped && elementsObj.face) {
			elementsObj.face.items.forEach(item => item.ids.reverse());
		}

		this._elements = elementsObj;
	}

	private _parseLine(element: PlyElement, line: string): void {
		let parts = line.split(/\s+/);
		let cursor = 0;
		let newItem: PlyItem = {
			values: {},
			ids: []
		};

		element.properties.forEach(property => {
			if (property.list) {
				// prvni cislo je pocet polozek, za nim polozky
				let count = parseInt(parts[cursor++]);
				let items = parts.slice(cursor, cursor + count);
				cursor += count;

				if (VERTEX_INDICES.includes(property.name)) {
					newItem.ids = items.map(part => parseInt(part));
				}
			}
			else {
				let partValue = parts[cursor++];

				if (partValue) {
					newItem.values[property.name] = parseFloat(partValue);
				}
			}
		});

		element.items.push(newItem);
	}
}
