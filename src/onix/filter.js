/**
 * Filter - for template and JS.
 *
 * @class $filter
 */
class $filter {
	constructor() {
		this._filters = [];
	}

	/**
	 * Main function - get/set.
	 * 
	 * @param  {String} name Filter name
	 * @param  {Function} [fn] Filter cb function
	 * @return {String|Function}
	 */
	filter(name, fn) {
		if (typeof name === "string" && typeof fn === "function") {
			this._filters.push({
				name,
				fn: fn()
			});
		}
		else if (typeof name === "string" && arguments.length == 1) {
			let findFilter = this._filters.filter(i => i.name == name);
			
			return (findFilter.length ? findFilter[0].fn : value => value);
		}
	}
}

let filter = new $filter();

/**
 * Filter - lowercase functionality.
 */
filter.filter("lowercase", () => {
	/**
	 * Input is transformatted to lowercase.
	 *
	 * @method lowercase
	 * @param  {String} input
	 * @return {String|Object}
	 * @memberof $filterLowercase
	 */
	return (input) => {
		if (typeof input === "string") {
			return input.toLowerCase();
		}
		else {
			return input;
		}
	};
});

/**
 * Filter - uppercase functionality.
 */
filter.filter("uppercase", () => {
	/**
	 * Input is transformatted to uppercase.
	 *
	 * @method uppercase
	 * @param  {String} input
	 * @return {String|Object}
	 * @memberof $filterUppercase
	 */
	return (input) => {
		if (typeof input === "string") {
			return input.toUpperCase();
		}
		else {
			return input;
		}
	};
});

/**
 * Filter - json stringify functionality.
 *
 * @class $filterJson
 */
filter.filter("json", () => {
	/**
	 * Input object is stringfied.
	 *
	 * @method json
	 * @param {Object} obj Input object
	 * @param {Number} [spacing] Number of spaces per indetation
	 * @return {String}
	 * @memberof $filterJson
	 */
	return (obj, spacing) => {
		if (typeof obj === "object") {
			let space = null;

			if (spacing) {
				spacing = parseInt(spacing, 10);
				space = isNaN(spacing) ? null : spacing;
			}

			return JSON.stringify(obj, null, space);
		}
		else {
			return obj;
		}
	};
});

/**
 * Get filter function by filter name.
 * 
 * @param  {String} name Filter name
 * @return {Function}
 */
export default function(name) {
	return filter.filter(name);
}
