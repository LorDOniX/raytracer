const TYPES = {
	FORMAT: /^format (\w+)/,
	END_HEADER: "end_header",
	ELEMENT: /^element (\w+) (\d+)/,
	LIST_PROPERTY: /^property list (\w+) (\w+) (\w+)/,
	PROPERTY: /^property (\w+) (\w+)/
};

// nazvy list vlastnosti s indexy vrcholu facu
const VERTEX_INDICES = ["vertex_indices", "vertex_index"];

type PlyFormat = "ascii" | "binary_little_endian" | "binary_big_endian";

// velikost v bajtech a cteni hodnoty binarniho typu (stare i nove nazvy typu)
const BINARY_TYPES: Record<string, { size: number; read: (view: DataView, offset: number, littleEndian: boolean) => number }> = {
	char: { size: 1, read: (view, offset) => view.getInt8(offset) },
	uchar: { size: 1, read: (view, offset) => view.getUint8(offset) },
	short: { size: 2, read: (view, offset, le) => view.getInt16(offset, le) },
	ushort: { size: 2, read: (view, offset, le) => view.getUint16(offset, le) },
	int: { size: 4, read: (view, offset, le) => view.getInt32(offset, le) },
	uint: { size: 4, read: (view, offset, le) => view.getUint32(offset, le) },
	float: { size: 4, read: (view, offset, le) => view.getFloat32(offset, le) },
	double: { size: 8, read: (view, offset, le) => view.getFloat64(offset, le) }
};

const TYPE_ALIASES: Record<string, string> = {
	int8: "char",
	uint8: "uchar",
	int16: "short",
	uint16: "ushort",
	int32: "int",
	uint32: "uint",
	float32: "float",
	float64: "double"
};

export interface PlyProperty {
	name: string;
	// datovy typ hodnoty, u listu typ jeho polozek
	type: string;
	// datovy typ poctu polozek listu
	countType: string;
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
	private _elements: PlyElements;

	constructor(opts?: Partial<PlyOptions>) {
		this._opts = Object.assign({
			switchYZ: true
		}, opts);
		this._elements = {};
	}

	load(url: string): Promise<PlyElements> {
		return fetch(url).then(response => {
			if (!response.ok) {
				throw new Error(`Loading ${url} failed with status ${response.status}`);
			}

			return response.arrayBuffer();
		}).then(data => {
			this._parse(data);
			return this._elements;
		}, e => {
			console.error(e);
			throw e;
		});
	}

	get elements(): PlyElements {
		return this._elements;
	}

	private _parse(buffer: ArrayBuffer): void {
		let bytes = new Uint8Array(buffer);
		let dataStart = findHeaderEnd(bytes);

		if (dataStart == -1) {
			throw new Error("PLY header is missing end_header");
		}

		// hlavicka je vzdy textova, data podle formatu
		let lines = new TextDecoder().decode(bytes.subarray(0, dataStart)).split("\n");
		let elements: PlyElement[] = [];
		let elementsObj: PlyElements = {};
		let format: PlyFormat = "ascii";

		for (let i = 0; i < lines.length; i++) {
			let line = lines[i].trim();
			let data: RegExpMatchArray | null;
			let lastElement = elements.length ? elements[elements.length - 1] : null;

			if ((data = line.match(TYPES.FORMAT))) {
				if (data[1] != "ascii" && data[1] != "binary_little_endian" && data[1] != "binary_big_endian") {
					throw new Error(`Unsupported PLY format "${data[1]}"`);
				}

				format = data[1];
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
					type: normalizeType(data[2]),
					countType: normalizeType(data[1]),
					list: true
				});
			}
			else if (lastElement && (data = line.match(TYPES.PROPERTY))) {
				lastElement.properties.push({
					name: data[2],
					type: normalizeType(data[1]),
					countType: "",
					list: false
				});
			}
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
		if (format == "ascii") {
			this._parseAscii(elements, new TextDecoder().decode(bytes.subarray(dataStart)).split("\n"));
		}
		else {
			this._parseBinary(elements, new DataView(buffer, dataStart), format == "binary_little_endian");
		}

		// prohozeni dvou os model zrcadli, otocime poradi vrcholu facu, aby normaly dal smerovaly ven
		if (swapped && elementsObj.face) {
			elementsObj.face.items.forEach(item => item.ids.reverse());
		}

		this._elements = elementsObj;
	}

	private _parseAscii(elements: PlyElement[], lines: string[]): void {
		let elInd = 0;

		for (let i = 0; i < lines.length; i++) {
			// preskocime naplnene (i prazdne) elementy
			while (elInd < elements.length && elements[elInd].items.length >= elements[elInd].size) {
				elInd++;
			}

			if (elInd >= elements.length) break;

			let line = lines[i].trim();

			if (!line) continue;

			this._parseLine(elements[elInd], line);
		}
	}

	private _parseBinary(elements: PlyElement[], view: DataView, littleEndian: boolean): void {
		let offset = 0;

		// cteni hodnoty daneho typu na aktualni pozici
		let read = (type: string): number => {
			let binaryType = BINARY_TYPES[type];

			if (!binaryType) {
				throw new Error(`Unsupported PLY property type "${type}"`);
			}

			if (offset + binaryType.size > view.byteLength) {
				throw new Error("PLY binary data is shorter than the header describes");
			}

			let value = binaryType.read(view, offset, littleEndian);
			offset += binaryType.size;

			return value;
		};

		elements.forEach(element => {
			for (let i = 0; i < element.size; i++) {
				let newItem: PlyItem = {
					values: {},
					ids: []
				};

				element.properties.forEach(property => {
					if (property.list) {
						let count = read(property.countType);
						let items: number[] = [];

						for (let k = 0; k < count; k++) {
							items.push(read(property.type));
						}

						if (VERTEX_INDICES.includes(property.name)) {
							newItem.ids = items;
						}
					}
					else {
						newItem.values[property.name] = read(property.type);
					}
				});

				element.items.push(newItem);
			}
		});
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

// zacatek dat za radkem end_header, -1 pokud hlavicka nekonci
function findHeaderEnd(bytes: Uint8Array): number {
	let marker = TYPES.END_HEADER;

	for (let i = 0; i + marker.length <= bytes.length; i++) {
		let match = true;

		for (let k = 0; k < marker.length && match; k++) {
			match = bytes[i + k] == marker.charCodeAt(k);
		}

		if (!match) continue;

		// konec radku (\n nebo \r\n), data zacinaji za nim
		let end = i + marker.length;

		while (end < bytes.length && bytes[end] != 10) {
			end++;
		}

		return Math.min(end + 1, bytes.length);
	}

	return -1;
}

function normalizeType(type: string): string {
	return TYPE_ALIASES[type] || type;
}
