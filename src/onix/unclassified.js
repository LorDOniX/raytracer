/**
 * Unclassfied methods.
 *
 * @module $unclassified
 */

/**
 * Get counter-strike message after numbers of kills.
 *
 * @param  {Number} number
 * @return {String}
 */
export function cssKill(number) {
	let mapping = {
		1: "First blood",
		2: "Double Kill",
		3: "Triple Kill",
		4: "Multi-Kill",
		5: "Ultra Kill",
		6: "M-M-M-M-Monster Kill",
		7: "Rampage",
		8: "Unstoppable",
		9: "Wicked Sick",
		10: "GODLIKE"
	};
	
	return (number in mapping ? mapping[number] : "");
};

/**
 * Memory usage in bytes - http://creativecommons.org/publicdomain/zero/1.0/legalcode.
 * 
 * @param  {Object} object Tested object
 * @return {Number}
 */
export function sizeof(object) {
	// initialise the list of objects and size
	let objects = [object];
	let size = 0;

	// loop over the objects
	for (let index = 0; index < objects.length; index ++){
		// determine the type of the object
		switch (typeof objects[index]){
			// the object is a boolean
			case 'boolean': size += 4; break;
			// the object is a number
			case 'number': size += 8; break;

			// the object is a string
			case 'string': size += 2 * objects[index].length; break;

			// the object is a generic object
			case 'object':
				// if the object is not an array, add the sizes of the keys
				if (!Array.isArray(objects[index])){
					for (let key in objects[index]) size += 2 * key.length;
				}

				// loop over the keys
				for (let key in objects[index]){
					// determine whether the value has already been processed
					let processed = false;

					for (let search = 0; search < objects.length; search ++){
						if (objects[search] === objects[index][key]){
							processed = true;
							break;
						}
					}

					// queue the value to be processed if appropriate
					if (!processed) objects.push(objects[index][key]);
				}
		}
	}

	// return the calculated size
	return size;
}
