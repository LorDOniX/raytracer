// pole pro data sdilena mezi workery: pri cross-origin isolation ve SharedArrayBuffer (workery si
// je nekopiruji), jinak v obycejnem ArrayBufferu (postMessage je zkopiruje do kazdeho workeru)

function createBuffer(byteLength: number): ArrayBufferLike {
	return crossOriginIsolated ? new SharedArrayBuffer(byteLength) : new ArrayBuffer(byteLength);
}

export function createFloat64Array(length: number): Float64Array {
	return new Float64Array(createBuffer(length * Float64Array.BYTES_PER_ELEMENT));
}

export function createInt32Array(length: number): Int32Array {
	return new Int32Array(createBuffer(length * Int32Array.BYTES_PER_ELEMENT));
}
