/**
 * Handle templates, binds events - syntax similar to moustache and angular template system.
 * $myQuery is used for cache record.
 *
 * @class $template
 */

import * as $common from "./common";
import { element } from "./my-query";
import * as $http from "./http";
import filter from "./filter";

class $template {
	constructor(conf) {
		/**
		 * Template conf.
		 *
		 * @type {Object}
		 * @memberof $template
		 * @private
		 */
		this._conf = {
			left: "{{",
			right: "}}",
			elEventPrefix: "data-event-",
			elDataBind: "data-bind"
		};

		/**
		 * Template cache.
		 *
		 * @type {Object}
		 * @memberof $template
		 * @private
		 */
		this._cache = {};

		/**
		 * Regular expressions for handle template variables.
		 *
		 * @type {Object}
		 * @memberof $template
		 * @private
		 */
		this._RE = {
			VARIABLE: /^[$_a-zA-Z][$_a-zA-Z0-9]+$/,
			NUMBERS: /^[-]?[0-9]+[.]?([0-9e]+)?$/,
			STRINGS: /^["'][^"']+[\"']$/
		};

		/**
		 * Constants.
		 * 
		 * @type {Object}
		 * @memberof $template
		 * @private
		 */
		this._CONST = {
			FILTER_DELIMETER: "|",
			FILTER_PARAM_DELIMETER: ":",
			TEMPLATE_SCRIPT_SELECTOR: "script[type='text/template']"
		};

		// template init
		this._init();
	}

	/**
	 * Update template conf.
	 * 
	 * @param  {Object} conf New conf
	 */
	updateConf(conf) {
		this._conf = Object.assign(this._conf, conf);
	}
	
	/**
	 * Add new item to the cache.
	 *
	 * @param {String} key 
	 * @param {String} data
	 * @memberof $template
	 * @method add
	 */
	add(key, data) {
		this._cache[key] = data;
	}

	/**
	 * Compile one template - replaces all ocurances of {{ xxx }} by model.
	 *
	 * @param  {String} key Template key/name
	 * @param  {Object} data Model
	 * @return {String}
	 * @memberof $template
	 * @method compile
	 */
	compile(key, data) {
		if (!key || !data) return "";

		let tmpl = this.get(key);
		let all = $common.match(tmpl, this._conf.left, this._conf.right);

		all.forEach(item => {
			let itemSave = this._conf.left + item + this._conf.right;

			// filter
			if (item.indexOf(this._CONST.FILTER_DELIMETER) != -1) {
				let filterValue;

				// filters
				item.split(this._CONST.FILTER_DELIMETER).forEach((filterItem, ind) => {
					filterItem = filterItem.trim();

					if (!ind) {
						// value
						if (filterItem in data) {
							filterValue = data[filterItem];
						}
					}
					else {
						// preprocessing by filter
						let args = [filterValue];
						let filterParts = filterItem.split(this._CONST.FILTER_PARAM_DELIMETER);
						let filterName = "";

						if (filterParts.length == 1) {
							filterName = filterParts[0].trim();
						}
						else {
							filterParts.forEach((filterPartItem, filterPartInd) => {
								filterPartItem = filterPartItem.trim();

								if (!filterPartInd) {
									filterName = filterPartItem;
								}
								else {
									args.push(filterPartItem);
								}
							});
						}

						let filterCb = filter(filterName);
						filterValue = filterCb.apply(filterCb, args);
					}
				});

				tmpl = tmpl.replace(itemSave, filterValue || "");
			}
			else {
				// standard
				let replaceValue = "";

				item = item.trim();

				if (item in data) {
					replaceValue = data[item];
				}

				tmpl = tmpl.replace(itemSave, replaceValue);
			}
		});

		return tmpl;
	}

	/**
	 * Get template from the cache.
	 *
	 * @param  {String} key Template key/name
	 * @return {String}
	 * @memberof $template
	 * @method get
	 */
	get(key) {
		return this._cache[key] || "";
	}

	/**
	 * Bind all elements in the root element. Selectors all data-* and functions are binds against scope object.
	 * For data-bind, scope has to have "addEls" function.
	 * Supports: click, change, keydown, bind.
	 *
	 * @param  {HTMLElement} root Root element
	 * @param  {Object} scope Scope which against will be binding used
	 * @param  {Function} [addElsCb] Callback function with object with all data-bind objects
	 * @memberof $template
	 * @method bindTemplate
	 */
	bindTemplate(root, scope, addElsCb) {
		let allElements = element("*", root);

		if (allElements.len()) {
			let newEls = {};

			allElements.forEach(item => {
				let attrs = this._getAttributes(item);

				attrs.forEach(attr => {
					if (attr.isBind) {
						newEls[attr.value] = item;
					}
					else {
						this._bindEvent(item, attr, scope);
					}
				});
			});

			if (addElsCb && typeof addElsCb === "function") {
				addElsCb(newEls);
			}
		}
	}

	/**
	 * Load template from the path, returns promise after load.
	 *
	 * @param  {String} key
	 * @param  {String} path
	 * @return {Promise}
	 * @memberof $template
	 * @method load
	 */
	load(key, path) {
		return new Promise((resolve, reject) => {
			$http.createRequest({
				url: path
			}).then(okData => {
				this.add(key, okData.data);

				resolve();
			}, errorData => {
				reject(errorData);
			});
		});
	}

	/**
	 * Parse a function name from the string.
	 *
	 * @param  {String} value
	 * @return {String}
	 * @memberof $template
	 * @private
	 * @method _parseFnName
	 */
	_parseFnName(value) {
		value = value || "";

		let match = value.match(/^\s*([a-zA-Z0-9_$]+)/);

		if (match) {
			return match[1];
		}
		else {
			return "";
		}
	}

	/**
	 * Parse arguments from the string -> makes array from them.
	 *
	 * @param  {String} value
	 * @param  {Object} config
	 * @param  {Object} config.$event Event object
	 * @param  {Object} config.$element Reference to element
	 * @return {Array}
	 * @memberof $template
	 * @private
	 * @method _parseArgs
	 */
	_parseArgs(value, config) {
		value = value || "";
		config = config || {};

		let bracketsData = $common.match(value, "(", ")");
		let argsValue = bracketsData.length ? bracketsData[0] : "";
		let parts = $common.split(argsValue);
		let args = [];
		let all = [];

		parts.forEach(item => {
			let origItem = item;
			let value = null;

			item = item.trim();

			if (item.match(this._RE.VARIABLE)) {
				//console.log("variable");
				switch (item) {
					case "$event":
						value = config.event;
						break;

					case "$element":
						value = config.el;
						break;

					case "undefined":
						value = undefined;
						break;

					case "null":
					default:
						value = null;
				}
			}
			else if (item.match(this._RE.STRINGS)) {
				value = item.substr(1, item.length - 2)
			}
			else if (item.match(this._RE.NUMBERS)) {
				value = parseFloat(item);
			}
			else {
				// array 
				let array = $common.match(item, "[", "]");
				// expr
				let expr = $common.match(item, "{", "}");

				if (array.length) {
					try {
						value = JSON.parse("[" + array[0] + "]");
					}
					catch (err) {
						console.error(err);
					}
				}
				else if (expr.length) {
					value = () => {
						return new Function(expr[0]);
					};
				}
			}

			all.push({
				value: value,
				pos: argsValue.indexOf(origItem)
			});
		});

		if (all.length) {
			all.sort((a, b) => {
				return a.pos - b.pos
			}).forEach(item => {
				args.push(item.value);
			});
		}

		return args;
	}

	/**
	 * Bind one single event to the element.
	 * 
	 * @param  {HTMLElement} el
	 * @param  {Object} attr { name, value }
	 * @param  {Function} scope
	 * @memberof $template
	 * @private
	 * @method _bindEvent
	 */
	_bindEvent(el, attr, scope) {
		if (!el || !attr || !scope) return;

		let fnName = this._parseFnName(attr.value);

		if (attr.name && fnName in scope) {
			el.addEventListener(attr.name, event => {
				let args = this._parseArgs(attr.value, {
					el: el,
					event: event
				});

				scope[fnName].apply(scope, args);
			});
		}
	}

	/**
	 * Get element prefixed attributes.
	 * 
	 * @param  {HTMLElement} el
	 * @return {Array}
	 * @memberof $template
	 * @private
	 * @method _getAttributes
	 */
	_getAttributes(el) {
		let output = [];

		if (el && "attributes" in el) {
			Object.keys(el.attributes).forEach(attr => {
				let item = el.attributes[attr];

				// ie8 fix
				if (!item || typeof item !== "object" || !item.name) return;

				let isBind = item.name == this._conf.elDataBind;
				let isPrefix = item.name.indexOf(this._conf.elEventPrefix) != -1;

				if (isBind || isPrefix) {
					output.push({
						isBind: isBind,
						name: isPrefix ? item.name.replace(this._conf.elEventPrefix, "") : item.name,
						value: item.value
					});
				}
			});
		}

		return output;
	}

	/**
	 * Init - get all templates from the page. Uses 'text/template' script with template data.
	 * Each script has to have id and specifi type="text/template".
	 *
	 * @private
	 * @memberof $template
	 * @method _init
	 */
	_init() {
		element(this._CONST.TEMPLATE_SCRIPT_SELECTOR).forEach(item => {
			this.add(item.id || "", item.innerHTML);
		});
	}
};

export default new $template();
