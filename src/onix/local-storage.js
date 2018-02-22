/**
 * Cover class for localStorage.
 * 
 * @module $localStorage
 */

import * as $features from "./features";

// localStorage provider
let provider = $features.LOCAL_STORAGE ? window.localStorage : {
	_data: {},

	setItem: function(key, value) {
		if (!key) return;

		this._data[key] = value;
	},

	getItem: function(key) {
		if (!key) return null;

		return this._data[key];
	},

	removeItem: function(key) {
		if (!key) return;

		if (key in this._data) {
			delete this._data[key];
		}
	}
};

/**
 * Set value to localStorage.
 *
 * @param {String} key
 * @param {String} [value]
 */
export function set(key, value) {
	provider.setItem(key, value);
};

/**
 * Get value from localStorage.
 *
 * @param {String} key
 * @return {String}
 */
export function get(key) {
	return provider.getItem(key);
};

/**
 * Remove key from localStorage.
 *
 * @param {String} key
 * @return {Boolean}
 */
export function remove(key) {
	provider.removeItem(key);
};
