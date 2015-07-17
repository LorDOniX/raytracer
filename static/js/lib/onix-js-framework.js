onix = (function() {
	/**
	 * Module/app types
	 * @const
	 */
	var TYPES = {
		SERVICE: 1,
		FACTORY: 2,
		CONSTANT: 3,
		RUN: 4
	};

	/**
	 * $$module item
	 * @class $$module
	 * 
	 */
	var $$module = function() {
		this._allObj = [];
	};

	/**
	 * Add a new service
	 *
	 * @public
	 * @param  {String} name
	 * @param  {Array|Function} param With DI
	 * @memberof $$module
	 */
	$$module.prototype.service = function(name, param) {
		this._allObj.push({
			name: name,
			param: param,
			type: TYPES.SERVICE
		});
	};

	/**
	 * Add a new factory
	 *
	 * @public
	 * @param  {String} name
	 * @param  {Array|Function} param With DI
	 * @memberof $$module
	 */
	$$module.prototype.factory = function(name, param) {
		this._allObj.push({
			name: name,
			param: param,
			type: TYPES.FACTORY
		});
	};

	/**
	 * Add new constant
	 * 
	 * @public
	 * @param  {String} name
	 * @param  {Object} param
	 * @memberof onix
	 */
	$$module.prototype.constant = function(name, obj) {
		this._allObj.push({
			name: name,
			param: obj,
			type: TYPES.CONSTANT
		});
	};

	/**
	 * Add a new run
	 * 
	 * @public
	 * @param  {Array|Function} param With DI
	 * @memberof $$module
	 */
	$$module.prototype.run = function(param) {
		this._allObj.push({
			param: param,
			type: TYPES.RUN
		});
	};

	/**
	 * Read/add a config
	 * 
	 * @public
	 * @param  {Object|String} obj
	 * @memberof $$module
	 */
	$$module.prototype.config = function(obj) {
		// read/write ?
		var o = onix.config(obj);

		// if read -> return output o
		if (o) {
			return o;
		}
	};

	/**
	 * Get all objects in the module.
	 * 
	 * @public
	 * @return {Object}
	 * @memberof $$module
	 */
	$$module.prototype.getAllObjects = function() {
		return this._allObj;
	};

	/**
	 * Dependency injection
	 *
	 * @class $$inject
	 */
	var $$inject = function(allObjects) {
		this._objects = allObjects;
	};

	/**
	 * Dependency injection bind
	 *
	 * @private
	 * @param  {Function|Array} param
	 * @param  {Object} [replace]
	 * @return {Object}
	 * @memberof $$inject
	 */
	$$inject.prototype.bind = function(param, replace) {
		var fn;
		var args = [];

		replace = replace || {};

		if (Array.isArray(param)) {
			param.every(function(item) {
				if (typeof item === "function") {
					fn = item;
					return false;
				}
				else {
					args.push(item in replace ? replace[item] : this._objects[item]);
				}

				return true;
			}, this);
		}
		else {
			fn = param;
		}

		/**
		 * Run new binded function - with the new
		 * @param  {Function|Object} [scope] 
		 * @param  {Boolean} [callWithNew] 
		 * @return {Function}
		 */
		return function(scope, callWithNew) {
			if (callWithNew) {
				return new (Function.prototype.bind.apply(scope || fn, [null].concat(args)))
			}
			else {
				return fn.apply(scope || fn, args);
			}
		};
	};

	/**
	 * Main framework object.
	 * 
	 * @class onix
	 */
	var onix = {
		/**
		 * All objects
		 *
		 * @private
		 * @type {Array}
		 * @memberof onix
		 */
		_allObj: [],

		/**
		 * All processed objects
		 *
		 * @private
		 * @type {Object}
		 * @memberof onix
		 */
		_objects: {},

		/**
		 * All modules
		 *
		 * @private
		 * @type {Object}
		 * @memberof onix
		 */
		_modules: {},

		/**
		 * Config name
		 *
		 * @private
		 * @const
		 * @memberof onix
		 */
		_CONFIG_NAME: "$config",

		/**
		 * DI name
		 *
		 * @private
		 * @const
		 * @memberof onix
		 */
		_DI_NAME: "$inject",

		/**
		 * Init function
		 *
		 * @private
		 * @memberof onix
		 */
		_init: function() {
			// pred DOM loadem
			this._objects[this._CONFIG_NAME] = {};

			document.addEventListener("DOMContentLoaded", this._domLoad.bind(this));
		},

		/**
		 * Event - Dom LOAD
		 *
		 * @private
		 * @memberof onix
		 */
		_domLoad: function() {
			// create DI
			var $inject = new $$inject(this._objects);

			this._objects[this._DI_NAME] = $inject;

			// process all inner items
			this._allObj.forEach(function(item) {
				// only 2 types
				switch (item.type) {
					case TYPES.SERVICE:
						this._objects[item.name] = $inject.bind(item.param)(null, true);
						break;

					case TYPES.FACTORY:
						this._objects[item.name] = $inject.bind(item.param)();
						break;
				}
			}, this);

			// delete them
			this._allObj.length = 0;

			var runs = [];

			// process all modules
			Object.keys(this._modules).forEach(function(moduleName) {
				var module = this._modules[moduleName].module;

				module.getAllObjects().forEach(function(moduleItem) {
					// modules have more types
					switch (moduleItem.type) {
						case TYPES.SERVICE:
							this._objects[moduleItem.name] = $inject.bind(moduleItem.param)(null, true);
							break;

						case TYPES.FACTORY:
							this._objects[moduleItem.name] = $inject.bind(moduleItem.param)();
							break;

						case TYPES.CONSTANT:
							this._objects[moduleItem.name] = moduleItem.param;
							break;

						case TYPES.RUN:
							runs.push(moduleItem);
							break;
					}
				}, this);
			}, this);

			// onix main run
			$inject.bind(this._run)(this);

			var $q = this.getObject("$q");
			var _promise = this.getObject("$$promise");
			var all = [];

			// run all runs
			runs.forEach(function(run) {
				var runO = $inject.bind(run.param)();

				// returns a promise
				if (runO && runO instanceof _promise) {
					all.push(runO);
				}
			}, this);

			var $route = this.getObject("$route");

			if (all.length) {
				$q.all(all)["finally"](function() {
					// route go
					$route.go();
				});
			}
			else {
				// route go
				$route.go();
			}
		},

		/**
		 * Main access point in the framework
		 *
		 * @private
		 * @memberof onix
		 */
		_run: [
			"$i18n",
			"$template",
			"$loader",
			"$route",
			"$myQuery",
		function(
			$i18n,
			$template,
			$loader,
			$route,
			$myQuery
		) {
			// binds
			this.element = function(value, parent) {
				return new $myQuery.get(value, parent);
			};

			// inits
			$loader.init();
			$route.init();
			$template.init();

			// language
			window._ = $i18n._.bind($i18n);
		}],

		/**
		 * Read/add config to the onix application.
		 *
		 * @public
		 * @param  {Object|String} obj
		 * @memberof onix
		 */
		config: function(obj) {
			if (typeof obj === "string") {
				// obj is key
				return this._objects[this._CONFIG_NAME][obj];
			}
			else if (typeof obj === "object") {
				Object.keys(obj).forEach(function(key) {
					this._objects[this._CONFIG_NAME][key] = obj[key];
				}.bind(this));
			}
		},

		/**
		 * Add service to the application.
		 *
		 * @public
		 * @param  {String} name 
		 * @param  {Function|Array} param
		 * @memberof onix
		 */
		service: function(name, param) {
			this._allObj.push({
				name: name,
				param: param,
				type: TYPES.SERVICE
			});
		},

		/**
		 * Add factory to the application.
		 *
		 * @public
		 * @param  {String} name 
		 * @param  {Function|Array} param
		 * @memberof onix
		 */
		factory: function(name, param) {
			this._allObj.push({
				name: name,
				param: param,
				type: TYPES.FACTORY
			});
		},

		/**
		 * Add module to the application.
		 *
		 * @public
		 * @param  {String} name 
		 * @return {$$module}
		 * @memberof onix
		 */
		module: function(name) {
			var module = new $$module();

			this._modules[name] = {
				module: module
			};

			return module;
		},

		/**
		 * Get object
		 *
		 * @public
		 * @param  {String} name
		 * @return {Function|Object} 
		 * @memberof onix
		 */
		getObject: function(name) {
			name = name || "";

			return this._objects[name];
		},

		/**
		 * Get all objects
		 *
		 * @public
		 * @return {Object}
		 * @memberof onix
		 */
		getAllObjects: function() {
			return this._objects;
		},

		/**
		 * Empty function
		 *
		 * @public
		 * @memberof onix
		 */
		noop: function() {

		},

		/**
		 * Framework info.
		 *
		 * @public
		 * @memberof onix
		 */
		info: function() {
			console.log(
				"Onix JS Framework\n" +
				"Version: 2.1.0\n" +
				"Date: 15. 7. 2015"
			);
		}
	};

	// init app
	onix._init();

	return onix;
})();
;/**
 * Main framework configuration
 * @class CONFIG
 */
onix.config({
	/**
	 * Template delimiter
	 *
	 * @public
	 * @type {Object}
	 * @memberof CONFIG
	 */
	TMPL_DELIMITER: {
		LEFT: "{{",
		RIGHT: "}}"
	}
});
;/**
 * @class $routeParams
 *
 * TODO
 */
onix.service("$routeParams", function() {
	return {};
});
;onix.factory("$$promise", function() {
	/**
	 * @class $$promise
	 */
	var $$promise = function() {
		/**
		 * Promise states
		 * 
		 * @const
		 * @memberof $$promise
		 */
		this._E_STATES = {
			IDLE: 0,
			RESOLVED: 1,
			REJECTED: 2
		};

		// current state
		this._state = this._E_STATES.IDLE;

		// all funcs
		this._funcs = [];

		// done data
		this._finishData = null;
	};

	/**
	 * Resolve all functions
	 *
	 * @private
	 * @param  {Boolean} isError
	 * @memberof $$promise
	 */
	$$promise.prototype._resolveFuncs = function(isError) {
		this._funcs.forEach(function(fnItem) {
			if (fnItem["finally"] || (fnItem.isError && isError) || (!fnItem.isError && !isError)) {
				(fnItem.fn)(this._finishData);
			}
		}, this);
		
		// clear array
		this._funcs.length = 0;
		this._state = isError ? this._E_STATES.REJECTED : this._E_STATES.RESOLVED;
	};

	/**
	 * Is promise already finished?
	 *
	 * @private
	 * @return {Boolean}
	 * @memberof $$promise
	 */
	$$promise.prototype._isAlreadyFinished = function() {
		if (this._state != this._E_STATES.IDLE) {
			this._resolveFuncs(this._state == this._E_STATES.REJECTED);
		}
	};

	/**
	 * Resolve promise using obj.
	 *
	 * @public
	 * @param  {Object} obj
	 * @memberof $$promise
	 */
	$$promise.prototype.resolve = function(obj) {
		this._finishData = obj;
		this._resolveFuncs(false);
	};

	/**
	 * Reject promise using obj.
	 *
	 * @public
	 * @param  {Object} obj
	 * @memberof $$promise
	 */
	$$promise.prototype.reject = function(obj) {
		this._finishData = obj;
		this._resolveFuncs(true);
	};

	/**
	 * After promise resolve/reject call then (okFn, errorFn)
	 *
	 * @public
	 * @param {Function} [cbOk]
	 * @param {Function} [cbError]
	 * @return {$$promise}
	 * @memberof $$promise
	 */
	$$promise.prototype.then = function(cbOk, cbError) {
		if (cbOk && typeof cbOk === "function") {
			this._funcs.push({
				fn: cbOk,
				isError: false
			});
		}

		if (cbError && typeof cbError === "function") {
			this._funcs.push({
				fn: cbError,
				isError: true
			});
		}

		this._isAlreadyFinished();
		
		return this;
	};

	/**
	 * After promise resolve call then cbOk
	 *
	 * @public
	 * @param  {Function}   cbOk
	 * @return {$$promise}
	 * @memberof $$promise
	 */
	$$promise.prototype.done = function(cbOk) {
		this._funcs.push({
			fn: cbOk,
			isError: false
		});

		this._isAlreadyFinished();

		return this;
	};

	/**
	 * After promise reject call then cbError
	 *
	 * @public
	 * @param  {Function}   cbError
	 * @return {$$promise}
	 * @memberof $$promise
	 */
	$$promise.prototype.error = function(cbError) {
		this._funcs.push({
			fn: cbError,
			isError: true
		});

		this._isAlreadyFinished();

		return this;
	};

	/**
	 * Finally for promise
	 *
	 * @function finally
	 * @public
	 * @param  {Function}   cb
	 * @return {$$promise}
	 * @memberof $$promise
	 */
	$$promise.prototype["finally"] = function(cb) {
		this._funcs.push({
			fn: cb,
			"finally": true
		});

		this._isAlreadyFinished();

		return this;
	};

	return $$promise;
});
;onix.factory("$q", [
	"$$promise",
function(
	$$promise
) {
	/**
 	 * @class $q
 	 * @description DI: $$promise;
 	 */
	return {
		/**
		 * Resolve all promises in the array
		 *
		 * @public
		 * @param {Array} promises
		 * @return {$$promise}
		 * @memberof $q
		 */
		all: function(promises) {
			var promise = new $$promise();

			if (Array.isArray(promises)) {
				var count = promises.length;
				var test = function() {
					count--;

					if (count == 0) {
						promise.resolve();
					}
				};

				promises.forEach(function(item) {
					item["finally"](test);
				});
			}
			else {
				promise.resolve();
			}

			return promise;
		},

		/**
		 * Deferable object of the promise.
		 *
		 * @public
		 * @return {$$promise}
		 * @memberof $q
		 */
		defer: function() {
			return new $$promise();
		}
	};
}]);
;onix.factory("$$myQuery", function() {
	/**
	 * Cover function
	 * 
	 * @class $$myQuery
	 * @param {String|NodeElement|Array} value
	 * @param {NodeElement} [parent]
	 * @return {Himself}
	 */
	var $$myQuery = function(value, parent) {
		this._els = [];
		parent = parent || document;

		if (typeof value === "string") {
			this._els = parent.querySelectorAll(value);
		}
		else if (Array.isArray(value)) {
			this._els = value;
		}
		else {
			// node element todo
			this._els.push(value);
		}

		return this;
	};

	/**
	 * Operation on elements
	 * 
	 * @private
	 * @param  {Function} cb
	 * @param  {Function} scope
	 * @memberof $$myQuery
	 */
	$$myQuery.prototype._operation = function(cb, scope) {
		// NodeList -> Array
		if (!Array.isArray(this._els)) {
			this._els = Array.prototype.slice.call(this._els);
		}

		this._els.forEach(function(item, ind) {
			cb.apply(scope || cb, [item, ind]);
		});
	};

	/**
	 * Set or get all - cover function.
	 * 
	 * @private
	 * @param  {String} newValue
	 * @param  {String} attr
	 * @memberof $$myQuery
	 */
	$$myQuery.prototype._setGetAll = function(newValue, attr) {
		if (newValue) {
			this._operation(function(item) {
				item[attr] = newValue;
			});

			return this;
		}
		else {
			var values = [];

			this._operation(function(item) {
				values.push(item[attr]);
			});

			if (!values.length) {
				return null;
			}
			else if (values.length == 1) {
				return values[0];
			}
			else {
				return values;
			}
		}
	};

	/**
	 * Get original element.
	 * 
	 * @public
	 * @param  {Number} [ind]
	 * @return {NodeElement|Null}
	 * @memberof $$myQuery
	 */
	$$myQuery.prototype.getEl = function(ind) {
		ind = ind || 0;

		if (ind > this._els.length) {
			return null;
		}
		else {
			return this._els[ind];
		}
	};

	/**
	 * Get or set attribute
	 * 
	 * @public
	 * @param  {String} name 
	 * @param  {String} [newValue]
	 * @return {Himself|String|Array}
	 * @memberof $$myQuery
	 */
	$$myQuery.prototype.attr = function(name, newValue) {
		if (newValue) {
			this._operation(function(item) {
				item.setAttribute(name, newValue);
			});

			return this;
		}
		else {
			var values = [];

			this._operation(function(item) {
				values.push(item.getAttribute(name));
			});

			if (!values.length) {
				return null;
			}
			else if (values.length == 1) {
				return values[0];
			}
			else {
				return values;
			}
		}
	};

	/**
	 * Get or set src
	 * 
	 * @public
	 * @param  {String} [newValue]
	 * @return {Himself|String}
	 * @memberof $$myQuery
	 */
	$$myQuery.prototype.src = function(newValue) {
		return this._setGetAll(newValue, "src");
	};

	/**
	 * Hide element
	 * 
	 * @public
	 * @return {Himself}
	 * @memberof $$myQuery
	 */
	$$myQuery.prototype.hide = function() {
		this._operation(function(item) {
			item.style.display = "none";
		});

		return this;
	};

	/**
	 * Show element
	 * 
	 * @public
	 * @param  {String} [displayStyle]
	 * @return {Himself}
	 * @memberof $$myQuery
	 */
	$$myQuery.prototype.show = function(displayStyle) {
		this._operation(function(item) {
			item.style.display = displayStyle || "block";
		});

		return this;
	};

	/**
	 * Get or set value
	 * 
	 * @public
	 * @param  {String} [newValue]
	 * @return {Himself|String}
	 * @memberof $$myQuery
	 */
	$$myQuery.prototype.val = function(newValue) {
		return this._setGetAll(newValue, "value");
	};

	/**
	 * Get or set HTML
	 * 
	 * @public
	 * @param  {String} [newValue]
	 * @return {Himself|String}
	 * @memberof $$myQuery
	 */
	$$myQuery.prototype.html = function(newValue) {
		return this._setGetAll(newValue, "innerHTML");
	};

	/**
	 * Append another element to this one
	 * TODO: cannot use on n elements
	 * 
	 * @public
	 * @param  {NodeElement} child
	 * @return {Himself}
	 * @memberof $$myQuery
	 */
	$$myQuery.prototype.append = function(child) {
		this._operation(function(item) {
			item.appendChild(child);
		});

		return this;
	};

	/**
	 * Add css class
	 * 
	 * @public
	 * @param  {String} className
	 * @return {Himself}
	 * @memberof $$myQuery
	 */
	$$myQuery.prototype.addClass = function(className) {
		this._operation(function(item) {
			item.classList.add(className);
		});

		return this;
	};

	/**
	 * Remove css class
	 * 
	 * @public
	 * @param  {String} className
	 * @return {Himself}
	 * @memberof $$myQuery
	 */
	$$myQuery.prototype.removeClass = function(className) {
		this._operation(function(item) {
			item.classList.remove(className);
		});

		return this;
	};

	/**
	 * Toggle css class
	 * 
	 * @public
	 * @param  {String} className
	 * @return {Himself}
	 * @memberof $$myQuery
	 */
	$$myQuery.prototype.toggleClass = function(className) {
		this._operation(function(item) {
			item.classList.toggle(className);
		});

		return this;
	};

	/**
	 * Get width
	 * 
	 * @public
	 * @return {Number}
	 * @memberof $$myQuery
	 */
	$$myQuery.prototype.width = function() {
		var width = 0;

		this._operation(function(item) {
			width += item.offsetWidth;
		});

		return width;
	};

	/**
	 * Get height
	 * 
	 * @public
	 * @return {Number}
	 * @memberof $$myQuery
	 */
	$$myQuery.prototype.height = function() {
		var height = 0;

		this._operation(function(item) {
			height += item.offsetHeight;
		});

		return height;
	};

	/**
	 * Click event
	 * 
	 * @public
	 * @param  {Function} cb
	 * @param  {Function} scope
	 * @return {Himself}
	 * @memberof $$myQuery
	 */
	$$myQuery.prototype.click = function(cb, scope) {
		this._operation(function(item) {
			item.addEventListener("click", function(event) {
				cb.apply(scope || cb, [event, item]);
			});
		});

		return this;
	};

	/**
	 * Change event
	 * 
	 * @public
	 * @param  {Function} cb
	 * @param  {Function} scope
	 * @return {Himself}
	 * @memberof $$myQuery
	 */
	$$myQuery.prototype.change = function(cb, scope) {
		this._operation(function(item) {
			item.addEventListener("change", function(event) {
				cb.apply(scope || cb, [event, item]);
			});
		});

		return this;
	};

	/**
	 * Foreach
	 * 
	 * @public
	 * @param  {Function} cb
	 * @param  {Function} scope
	 * @return {Himself}
	 * @memberof $$myQuery
	 */
	$$myQuery.prototype.forEach = function(cb, scope) {
		this._operation(function(item, ind) {
			cb.apply(scope || cb, [item, ind]);
		});

		return this;
	};

	/**
	 * Remove element
	 * 
	 * @public
	 * @return {Himself}
	 * @memberof $$myQuery
	 */
	$$myQuery.prototype.remove = function() {
		this._operation(function(item) {
			item.parentNode.removeChild(item);
		});

		return this;
	};

	/**
	 * Prepend element
	 * 
	 * @public
	 * @param  {NodeElement} child
	 * @return {Himself}
	 * @memberof $$myQuery
	 */
	$$myQuery.prototype.prepend = function(child) {
		this._operation(function(item) {
			item.parentNode.insertBefore(child, item);
		});

		return this;
	};

	/**
	 * Empty element - clear all its children.
	 * Much faster than innerHTML = "".
	 * 
	 * @public
	 * @return {Himself}
	 * @memberof $$myQuery
	 */
	$$myQuery.prototype.empty = function() {
		this._operation(function(item) {
			while (item.firstChild) {
				item.removeChild(item.firstChild);
			}
		});

		return this;
	};

	/**
	 * Get all elements length
	 * 
	 * @public
	 * @return {Number}
	 * @memberof $$myQuery
	 */
	$$myQuery.prototype.len = function() {
		return this._els.length;
	};

	return $$myQuery;
});
;onix.factory("$myQuery", [
	"$$myQuery",
function(
	$$myQuery
) {
	/**
 	 * @class $myQuery
 	 * @description DI: $$myQuery;
 	 */
	return {
		 /**
		 * Main cover function.
		 * 
		 * @public
		 * @param  {String|NodeElement|Array} value
		 * @param {NodeElement} [parent]
		 * @return {$$myQuery}
		 * @memberof $myQuery
		 */
		get: function(value, parent) {
			return new $$myQuery(value, parent);
		}
	};
}]);
;/**
 * @class $dom
 */
onix.service("$dom", function() {
	/**
	 * Create $dom from the configuration.
	 * config: {
	 * 	el string: element name
	 * 	attrs json: attributes
	 * 	child array: children, with same config
	 * 	events array
	 * 	innerHTML -- default
	 * 	value
	 * 	multiple...
	 * }
	 * exported - to this object will be exported all marked elements (_exported attr.)
	 *
	 * @public
	 * @param  {Object} config
	 * @param  {Object} [exported]
	 * @return {NodeElement}
	 * @memberof $dom
	 */
	this.create = function(config, exported) {
		var el = document.createElement(config.el);

		Object.keys(config).forEach(function(key) {
			switch (key) {
				case "el":
					break;

				case "attrs":
					Object.keys(config.attrs).forEach(function(attr) {
						el.setAttribute(attr, config.attrs[attr]);
					});
					break;

				case "events":
					config.events.forEach(function(item) {
						el.addEventListener(item.event, item.fn);
					});
					break;

				case "child":
					config.child.forEach(function(child) {
						el.appendChild(this.create(child, exported));
					}, this);
					break;

				case "_exported":
					exported[config._exported] = el;
					break;

				case "class":
					var value = config["class"];

					if (typeof value === "string") {
						el.classList.add(value);
					}
					else if (Array.isArray(value)) {
						value.forEach(function(item) {
							el.classList.add(item);
						});
					}
					break;

				default:
					el[key] = config[key];
			}
		}, this);

		return el;
	};

	/**
	 * Get element from the document.
	 *
	 * @public
	 * @param  {String|Array} els     els = "" -> element; array [] -> {...}
	 * @param  {NodeElement} parent
	 * @return {NodeElement}
	 * @memberof $dom
	 */
	this.get = function(els, parent) {
		var output;
		parent = parent || document;

		if (typeof els === "string" && els) {
			output = parent.querySelector(els);
		}
		else if (Array.isArray(els)) {
			output = {};

			els.forEach(function(item) {
				if (typeof item === "string") {
					var name = item.replace(/^[.# ]+/g, "");

					output[name] = parent.querySelector(item);
				}
				else {
					var name = item.sel.replace(/^[.# ]+/g, "");

					output[item.name || name] = parent.querySelector(item.sel);
				}
			});
		}

		return output;
	};
});
;/**
 * @class $location
 */
onix.service("$location", function() {
	// ------------------------ public ----------------------------------------
	
	/**
	 * Page refresh.
	 *
	 * @public
	 * @memberof $location
	 */
	this.refresh = function() {
		window.location.reload();
	};

	/**
	 * Create a new search url.
	 * 
	 * @public
	 * @param  {Object} obj
	 * @return {String}
	 * @memberof $location
	 */
	this.createSearchURL = function(obj) {
		var newURL = [];

		if (obj) {
			// write
			var newURL = [];

			Object.keys(obj).forEach(function(key) {
				newURL.push(key + "=" + encodeURIComponent(obj[key]));
			});
		}

		if (newURL.length) {
			return "?" + newURL.join("&");
		}
		else return "";
	};

	/**
	 * Get or set new url search. obj -> set new url from obj; !obj -> create obj from search part of url
	 *
	 * @public
	 * @param  {Object} [obj]
	 * @return {Null|Object}
	 * @memberof $location
	 */
	this.search = function(obj) {
		if (obj) {
			// write
			var newURL = this.createSearchURL(obj);

			if (newURL) {
				window.location.search = newURL;
			}
		}
		else {
			// read
			var data = location.search;
			var output = {};

			if (data) {
				data = data.replace("?", "");

				data.split("&").forEach(function(item) {
					var parts = item.split("=");
					
					output[parts[0]] = decodeURIComponent(parts[1]);
				});
			}

			return output;
		}
	};

	/**
	 * Get current location
	 *
	 * @public
	 * @return {String}
	 * @memberof $location
	 */
	this.get = function() {
		return window.location.pathname;
	};
	
});
;/**
 * @class $provide
 */
onix.service("$provide", function() {
	/**
	 * Decorate existing object.
	 *
	 * @public
	 * @param  {String} name Object name
	 * @param  {Function} cb Callback function
	 * @memberof $provide
	 */
	this.decorator = function(name, cb) {
		var obj = onix.getObject(name);

		if (obj) {
			// todo - maybe public function?
			onix._objects[name] = cb(obj);
		}
	};
});
;/**
 * @class $common
 * @description DI: $q;
 */
onix.service("$common", [
	"$q",
function(
	$q
) {
	/**
	 * Object copy, from source to dest
	 *
	 * @private
	 * @param  {Object} dest
	 * @param  {Object} source
	 * @memberof $common
	 */
	this._objCopy = function(dest, source) {
		Object.keys(source).forEach(function(prop) {
			if (source.hasOwnProperty(prop)) {
				var sourceVal = source[prop];
				var sourceType = typeof sourceVal;

				// array
				if (Array.isArray(sourceVal)) {
					// array - copy object to another array - keep referencings on array, objects
					var newArray = [];

					sourceVal.forEach(function(item) {
						newArray.push(item);
					});

					dest[prop] = newArray;
				}
				// not null and object
				else if (sourceVal && sourceType === "object") {
					// recursive copy
					if (!(prop in dest)) {
						dest[prop] = {};
 					}

					this._objCopy(dest[prop], sourceVal);
				}
				else {
					// string, numbers, functions
					dest[prop] = sourceVal;
				}
			}
		}.bind(this));
	};

	/**
	 * Get cookie by her name
	 *
	 * @public
	 * @param  {String} name
	 * @return {String}     
	 * @memberof $common
	 */
	this.getCookie = function(name) {
		var cookieValue = null;

		if (document.cookie && document.cookie != '') {
			var cookies = document.cookie.split(';');

			cookies.every(function(cookie) {
				cookie = cookie.trim();

				if (cookie.substring(0, name.length + 1) == (name + '=')) {
					cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
					return false;
				}
				else return true;
			});
		}

		return cookieValue;
	};

	/**
	 * Confirm window.
	 *
	 * @public
	 * @param  {String} txt
	 * @return {$q}
	 * @memberof $common
	 */
	this.confirm = function(txt) {
		var promise = $q.defer();

		if (confirm(txt)) {
			promise.resolve();
		}
		else {
			promise.reject();
		}

		return promise;
	};

	/**
	 * Create one object from arguments
	 *
	 * @public
	 * @param  {Object|Function} mainObj
	 * @param  {Object|Function|Array} a data | dependicies
	 * @param  {Object|Function} [b] data | dependicies
	 * @return {Object}
	 * @memberof $common
	 */
	this.create = function(mainObj, a, b) {
		var args = [];

		if (a && b && Array.isArray(a)) {
			// a == dependicies
			// b == data

			// arguments
			a.forEach(function(item) {
				args.push(onix.getObject(item));
			});
		}

		// data
		args.push(mainObj);

		// data override
		args.push(b || a);

		return this.merge.apply(this, args);
	};

	/**
	 * Merge X objects into the single one.
	 *
	 * @public
	 * @return {Object}
	 * @memberof $common
	 */
	this.merge = function() {
		var count = arguments.length;
		var dest = {};
		
		if (count > 0) {
			for (var i = 0; i < count; i++) {
				var source = arguments[i];

				this._objCopy(dest, source);
			}
		}

		return dest;
	};

	/**
	 * Extend one object by other; from source to dest.
	 *
	 * @public
	 * @param  {Object} dest
	 * @param  {Object} source
	 * @memberof $common
	 */
	this.extend = function(dest, source) {
		dest = dest || {};
		source = source || {};

		this._objCopy(dest, source);
	};

	/**
	 * Bind function arguments without scope
	 *
	 * @public
	 * @param  {Function} cb
	 * @return {Function}
	 * @memberof $common
	 */
	this.bindWithoutScope = function(cb) {
		var bindArgs = Array.prototype.slice.call(arguments, 1);

		return function () {
			var internalArgs = Array.prototype.slice.call(arguments, 0);
			var args = Array.prototype.concat(internalArgs, bindArgs);
			return cb.apply(this, args);
		};
	};
	
	/**
	 * Missing for each for Node array.
	 *
	 * @public
	 * @param  {NodeArray} nodes
	 * @param  {Function} cb
	 * @param  {Object|Function}   scope
	 * @memberof $common
	 */
	this.nodesForEach = function(nodes, cb, scope) {
		cb = cb || function() {};
		
		if (nodes) {
			Array.prototype.slice.call(nodes).forEach(function(item, ind) {
				cb.apply(scope || cb, [item, ind]);
			});
		}
	};

	/**
	 * Reverse for each
	 *
	 * @public
	 * @param  {Array} arr 
	 * @param {Function} cb
	 * @param {Function} scope
	 * @memberof $common
	 */
	this.reverseForEach = function (arr, cb, scope) {
		arr = arr || [];
		cb = cb || function() {};

		for (var i = arr.length - 1; i >= 0; i--) {
			cb.apply(scope || this, [arr[i], i]);
		}
	};

	/**
	 * HEX value to DEC
	 *
	 * @public
	 * @param  {String} hex
	 * @return {Number}    
	 * @memberof $common
	 */
	this.hxToDe = function(hex) {
		hex = hex.toLowerCase();

		switch (hex) {
			case "a":
				return 10;
			case "b":
				return 11;
			case "c":
				return 12;
			case "d":
				return 13;
			case "e":
				return 14;
			case "f":
				return 15;
			default:
				return parseInt(hex, 10);
		}
	};

	/**
	 * HEX value to RGB
	 *
	 * @public
	 * @param  {String} hexColor
	 * @return {Object}         
	 * @memberof $common
	 */
	this.hexToRGB = function(hexColor) {
		if (hexColor[0] == "#") {
			hexColor = hexColor.replace("#", "");

			if (hexColor.length == 3) {
				return {
					r: this.hxToDe(hexColor[0]) * 16 + this.hxToDe(hexColor[0]),
					g: this.hxToDe(hexColor[1]) * 16 + this.hxToDe(hexColor[1]),
					b: this.hxToDe(hexColor[2]) * 16 + this.hxToDe(hexColor[2])
				};
			}
			else {
				return {
					r: this.hxToDe(hexColor[0]) * 16 + this.hxToDe(hexColor[1]),
					g: this.hxToDe(hexColor[2]) * 16 + this.hxToDe(hexColor[3]),
					b: this.hxToDe(hexColor[4]) * 16 + this.hxToDe(hexColor[5])
				};
			}
		}
		else {
			return hexColor;
		}
	};

	/**
	 * If EXPR then function
	 *
	 * @public
	 * @param  {Boolean} expr  test if (EXPR)
	 * @param  {Function} fn
	 * @param  {Function} scope
	 * @memberof $common
	 */
	this.ift = function(expr, th, scope) {
		if (expr) {
			th.apply(scope || th, [expr]);
		}
	};

	/**
	 * Is value element?
	 *
	 * @public
	 * @param  {Object} val
	 * @return {Boolean}
	 * @memberof $common
	 */
	this.isElement = function(val) {
		return (val instanceof HTMLElement);
	};
}]);
;onix.factory("$$notify", [
	"$q",
	"$common",
function(
	$q,
	$common
) {
	/**
	 * Notification object
	 * DI: $q; $common;
	 *
	 * @class $$notify
	 * @param {NodeElement} el
	 */
	var $$notify = function(el) {
		this._el = el;

		this._HIDE_TIMEOUT = 1500; // [ms]

		this._options = {
			"ok": "alert-success",
			"error": "alert-danger",
			"info": "alert-info"
		};

		return this;
	};

	/**
	 * Set value to the notify element
	 *
	 * @private
	 * @param  {String|NodeElement} txt
	 * @memberof $$notify
	 */
	$$notify.prototype._setValue = function(txt) {
		if ($common.isElement(txt)) {
			onix.element(this._el).empty().append(txt);
		}
		else if (typeof txt === "string") {
			this._el.innerHTML = txt;
		}
	};

	/**
	 * Reset classess
	 *
	 * @public
	 * @memberof $$notify
	 */
	$$notify.prototype.reset = function() {
		Object.keys(this._options).forEach(function(key) {
			this._el.classList.remove(this._options[key]);
		}.bind(this));

		return this;
	};

	/**
	 * Show OK state
	 * 
	 * @public
	 * @param  {String|NodeElement} txt
	 * @memberof $$notify
	 */
	$$notify.prototype.ok = function(txt) {
		this._el.classList.add(this._options["ok"]);
		
		this._setValue(txt);

		return this;
	};

	/**
	 * Show ERROR state
	 * 
	 * @public
	 * @param  {String|NodeElement} txt
	 * @memberof $$notify
	 */
	$$notify.prototype.error = function(txt) {
		this._el.classList.add(this._options["error"]);
		
		this._setValue(txt);

		return this;
	};

	/**
	 * Show INFO state
	 *
	 * @public
	 * @param  {String|NodeElement} txt
	 * @memberof $$notify
	 */
	$$notify.prototype.info = function(txt) {
		this._el.classList.add(this._options["info"]);
		
		this._setValue(txt);

		return this;
	};

	/**
	 * Timeout hide.
	 *
	 * @public
	 * @return {$q}
	 * @memberof $$notify
	 */
	$$notify.prototype.hide = function() {
		var promise = $q.defer();

		setTimeout(function() {
			this.reset();
			
			promise.resolve();
		}.bind(this), this._HIDE_TIMEOUT);

		return promise;
	};

	return $$notify;
}]);
;/**
 * @class $notify
 * @description DI: $$notify;
 */
onix.service("$notify", [
	"$$notify",
function(
	$$notify
) {
	/**
	 * Main public access to the notify obj.
	 *
	 * @public
	 * @param  {NodeElement} el
	 * @return {$$notify}
	 * @memberof $notify
	 */
	this.get = function(el) {
		return new $$notify(el);
	};
}]);
;onix.factory("$event", [
	"$common",
function(
	$common
) {
	/**
 	 * @class $event
 	 * @description DI: $common;
 	 */
	return {
		/**
		 * All events. { name: name, event: function, scope, [once] }
		 * 
		 * @private
		 * @type {Array}
		 * @memberof $event
		 */
		_allEvents: [],

		/**
		 * Get all events by his name.
		 * 
		 * @private
		 * @param  {String} name 
		 * @return {Array}
		 * @memberof $event
		 */
		_getEvents: function (name) {
			var events = [];

			this._allEvents.forEach(function(item, ind) {
				if (name == item.name) {
					events.push({
						item: item,
						pos: ind
					});
				}
			});

			return events;
		},

		/**
		 * Add new event to the stack.
		 * 
		 * @public
		 * @param  {String}   name 
		 * @param  {Function} fn   
		 * @param  {Object|Function}   scope
		 * @memberof $event
		 */
		on: function (name, fn, scope) {
			this._allEvents.push({ 
				name: name,
				fn: fn,
				scope: scope
			});
		},

		/**
		 * Remove event from the stack.
		 * 
		 * @public
		 * @param  {String}   name 
		 * @param  {Function} [fn]
		 * @memberof $event
		 */
		off: function (name, fn) {
			var events = this._getEvents(name);

			$common.reverseForEach(events, function(item) {
				if (!fn || fn && item.fn == fn) {
					this._allEvents.splice(item.pos, 1);
				}
			}, this);
		},

		/**
		 * Add one time event to the stack.
		 * 
		 * @public
		 * @param  {String}   name 
		 * @param  {Function} [fn]
		 * @param  {Object|Function}   scope
		 * @memberof $event
		 */
		once: function (name, fn, scope) {
			this._allEvents.push({ 
				name: name,
				fn: fn,
				scope: scope,
				once: true
			});
		},

		/**
		 * Trigger event with arguments 0..n
		 * 
		 * @public
		 * @param  {String} name
		 * @memberof $event
		 */
		trigger: function (name) {
			var events = this._getEvents(name);
			var args = arguments;
			var onceArray = [];

			events.forEach(function(event) {
				var newArgs = Array.prototype.slice.call(args, 0);
				newArgs.shift();

				var item = event.item;

				item.fn.apply(item.scope || this, newArgs);
				if (item.once) {
					onceArray.push(event.pos);
				}
			}, this);

			$common.reverseForEach(onceArray, function(pos) {
				this._allEvents.splice(pos, 1);
			}, this);
		}
	};
}]);
;/**
 * @class $loader
 * @description DI: $dom;
 */
onix.service("$loader", [
	"$dom",
function(
	$dom
) {
	/**
	 * Create $loader.
	 *
	 * @private
	 * @memberof $loader
	 */
	this._create = function() {
		this._el = $dom.create({
			el: "div",
			"class": "loader"
		});

		// insert into the body on first position
		document.body.insertBefore(this._el, document.body.firstChild);
	};
	
	/**
	 * Loader init.
	 *
	 * @public
	 * @memberof $loader
	 */
	this.init = function() {
		this._create();
	};

	/**
	 * Start loader.
	 *
	 * @public
	 * @memberof $loader
	 */
	this.start = function() {
		this._el.classList.add("start");
	};

	/**
	 * End loader.
	 *
	 * @public
	 * @memberof $loader
	 */
	this.end = function() {
		this._el.classList.remove("start");
		this._el.classList.add("end");

		setTimeout(function() {
			this._el.classList.remove("end");
			this._el.classList.add("hide");

			setTimeout(function() {
				this._el.classList.remove("hide");
			}.bind(this), 350);
		}.bind(this), 150);
	};
}]);
;/**
 * @class $http
 * @description DI: $q;
 */
onix.service("$http", [
	"$q",
function(
	$q
) {
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/Guide/Using_FormData_Objects
	 * Prepare post data
	 *
	 * @private
	 * @param  {Object|Array} data { name, value }
	 * @return {FormData}
	 * @memberof $http
	 */
	this._preparePostData = function(data) {
		var formData = new FormData();

		if (data) {
			if (Array.isArray(data)) {
				data.forEach(function(item) {
					formData.append(item.name, item.value);
				});
			}
			else {
				Object.keys(data).forEach(function(key) {
					formData.append(key, data[key]);
				});
			}
		}

		return formData;
	};

	/**
	 * Update URL by get data.
	 *
	 * @private
	 * @param  {String} url
	 * @param  {Array} data { name, value }
	 * @return {String}    
	 * @memberof $http
	 */
	this._updateURL = function(url, data) {
		if (data) {
			var add = [];

			if (Array.isArray(data)) {
				data.forEach(function(item) {
					add.push(item.name + "=" + encodeURIComponent(item.value));
				});

				url += (url.indexOf("?") == -1 ? "?" : "") + add.join("&");
			}
		}

		return url;
	};

	/**
	 * Request types
	 *
	 * @public
	 * @const
	 * @memberof $http
	 */
	this.POST_TYPES = {
		JSON: 1,
		FORM_DATA: 2
	};

	/**
	 * Http methods.
	 *
	 * @public
	 * @const
	 * @memberof $http
	 */
	this.METHOD = {
		POST: "POST",
		GET: "GET",
		DELETE: "DELETE",
		PATCH: "PATCH"
	};

	/**
	 * Create new XHR request.
	 *
	 * @public
	 * @param  {Object} config { url, method, [getData], [postData], [headers {type, value}] }
	 * @return {$q}
	 * @memberof $http
	 */
	this.createRequest = function(config) {
		var promise = $q.defer();
		var request = new XMLHttpRequest();

		config = config || {};

		var method = config.method || this.METHOD.GET;
		var url = config.url || "";

		if (!url) {
			promise.reject();
			return promise;
		}

		url = this._updateURL(url, config.getData);

		request.onerror = function () { promise.reject(); };
		request.open(method, url, true);
		request.onreadystatechange = function() {
			if (request.readyState == 4) {
				var responseData = request.responseText || "";
				var responseType = request.getResponseHeader("Content-Type");
				var promiseData = null;

				if (responseType == "application/json") {
					promiseData = responseData.length ? JSON.parse(responseData) : {};
				}
				else {
					promiseData = responseData;
				}

				// 200 ok
				// 201 created
				// 204 succesfully deleted
				// 403 unautorized
				promise[request.status >= 200 && request.status < 300 ? "resolve" : "reject"]({
					status: request.status,
					data: promiseData,
					url: url,
					method: method
				});
			}
		};

		try {
			// add headers
			var headers = config.headers;
			if (headers && Array.isArray(headers)) {
				headers.forEach(function(header) {
					request.setRequestHeader(header.type, header.value);
				});
			}

			if (method == this.METHOD.GET) {
				request.setRequestHeader('Accept', 'application/json');
			}

			var type = config.postType || this.POST_TYPES.JSON;

			if (config.postData && type == this.POST_TYPES.JSON) {
				request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
				request.send(JSON.stringify(config.postData));
			}
			else if (config.postData && type == this.POST_TYPES.FORM_DATA) {
				request.send(this._preparePostData(config.postData));
			}
			else {
				request.send();
			}
		}
		catch (err) {
			promise.reject();
		}

		return promise;
	};
}]);
;/**
 * @class $i18n
 * @description DI: $http, $q;
 */
onix.service("$i18n", [
	"$http",
	"$q",
function(
	$http,
	$q
) {
	/**
	 * All langs data.
	 *
	 * @private
	 * @type {Object}
	 * @memberof $i18n
	 */
	this._langs = {};

	/**
	 * Current language
	 *
	 * @private
	 * @type {String}
	 * @memberof $i18n
	 */
	this._currentLang = "";

	/**
	 * Add a new language
	 *
	 * @public
	 * @param {String} lang Language key
	 * @param {Object} data
	 * @memberof $i18n
	 */
	this.addLanguage = function(lang, data) {
		this._langs[lang] = data;
	};

	/**
	 * Set new language by his key.
	 *
	 * @public
	 * @param {String} lang Language key
	 * @memberof $i18n
	 */
	this.setLanguage = function(lang) {
		this._currentLang = lang;
	};

	/**
	 * Get text function. Translate for the current language and the key.
	 *
	 * @public
	 * @param  {String} key
	 * @return {String}    
	 * @memberof $i18n
	 */
	this._ = function(key) {
		key = key || "";
		var lObj = this._langs[this._currentLang];
		var translate = "";

		if (lObj) {
			var parts = key.split(".");
			var len = parts.length;

			parts.every(function(item, ind) {
				if (item in lObj) {
					lObj = lObj[item];

					if (ind == len - 1) {
						translate = lObj;
						return false;
					}
				}
				else return false;

				// go on
				return true;
			});
		}

		return translate;
	};

	/**
	 * Load language from the file.
	 *
	 * @public
	 * @param  {String} lang Language key
	 * @param  {String} url  Path to the file
	 * @return {$q}
	 * @memberof $i18n
	 */
	this.loadLanguage = function(lang, url) {
		var promise = $q.defer();

		$http.createRequest({
			url: url
		}).then(function(data) {
			this.addLanguage(lang, data.data);
			promise.resolve();
		}.bind(this), function(data) {
			promise.resolve();
		});

		return promise;
	};
}]);
;/**
 * @class $template
 * @description DI: $common, $q, $http, $config;
 */
onix.service("$template", [
	"$common",
	"$q",
	"$http",
	"$config",
function(
	$common,
	$q,
	$http,
	$config
) {
	/**
	 * Template cache.
	 *
	 * @private
	 * @type {Object}
	 * @memberof $template
	 */
	this._cache = {};

	/**
	 * Regular expressions
	 *
	 * @private
	 * @type {Object}
	 * @memberof $template
	 */
	this._RE = {
		VARIABLE: /[$_a-zA-Z][$_a-zA-Z0-9]+/g,
		NUMBERS: /[-]?[0-9]+[.]?([0-9e]+)?/g,
		STRINGS: /["'][^"']+["']/g,
		JSONS: /[{][^}]+[}]/g,
		ALL: /[-]?[0-9]+[.]?([0-9e]+)?|["'][^"']+["']|[{][^}]+[}]|[$_a-zA-Z][$_a-zA-Z0-9]+/g
	};

	/**
	 * Parse a function name from the string.
	 *
	 * @private
	 * @param  {String} value
	 * @return {String}      
	 * @memberof $template
	 */
	this._parseFnName = function(value) {
		value = value || "";

		return value.match(/[a-zA-Z0-9_]+/)[0];
	};

	/**
	 * Parse arguments from the string -> makes array from them
	 *
	 * @private
	 * @param  {String} value
	 * @param  {Object} config { event, element... }
	 * @return {Array}
	 * @memberof $template
	 */
	this._parseArgs = function(value, config) {
		argsValue = value ? value.replace(/^[^(]+./, "").replace(/\).*$/, "") : "";

		var args = [];
		var matches = argsValue.match(this._RE.ALL);
		
		if (matches) {
			var all = [];

			matches.forEach(function(item) {
				var value;

				if (item.match(this._RE.STRINGS)) {
					value = item.substr(1, item.length - 2)
				}
				else if (item.match(this._RE.NUMBERS)) {
					value = parseFloat(item);
				}
				else if (item.match(this._RE.JSONS)) {
					value = JSON.parse(item);
				}
				else if (item.match(this._RE.VARIABLE)) {
					var variable = item.match(this._RE.VARIABLE)[0];

					if (variable == "$event") {
						value = config.event;
					}
					else if (variable == "$element") {
						value = config.el;
					}
					else {
						// todo - maybe eval with scope
						value = null;
					}
				}

				all.push({
					value: value,
					pos: argsValue.indexOf(item)
				});
			}, this);

			if (all.length) {
				all.sort(function(a, b) {
					return a.pos - b.pos
				}).forEach(function(item) {
					args.push(item.value);
				});
			}
		}

		return args;
	};

	/**
	 * Bind one single event to element.
	 * 
	 * @param  {NodeElement} el
	 * @param  {String} eventName click, keydown...
	 * @param  {String} data      data-x value
	 * @param  {Function} scope
	 * @memberof $template
	 */
	this._bindEvent = function(el, eventName, data, scope) {
		if (data && this._parseFnName(data) in scope) {
			el.addEventListener(eventName, $common.bindWithoutScope(function(event, templScope) {
				var value = this.getAttribute("data-" + eventName);
				var fnName = templScope._parseFnName(value);
				var args = templScope._parseArgs(value, {
					el: this,
					event: event
				});

				scope[fnName].apply(scope, args);
			}, this));
		}
	};

	/**
	 * Init - get all templates from the page.
	 *
	 * @public
	 * @memberof $template
	 */
	this.init = function() {
		onix.element("script[type='text/template']").forEach(function(item) {
			this.add(item.id, item.innerHTML);
		}, this);
	};
	
	/**
	 * Add new item to the cachce
	 *
	 * @public
	 * @param {String} key 
	 * @param {String} data
	 * @memberof $template
	 */
	this.add = function(key, data) {
		this._cache[key] = data;
	};

	/**
	 * Compile one template - replaces all ocurances of {} by model
	 *
	 * @public
	 * @param  {String} key  Template key/name
	 * @param  {Object} data Model
	 * @return {String}
	 * @memberof $template
	 */
	this.compile = function(key, data) {
		var tmpl = this.get(key);
		var cnf = $config.TMPL_DELIMITER;

		if (data) {
			Object.keys(data).forEach(function(key) {
				tmpl = tmpl.replace(new RegExp(cnf.LEFT + "[ ]*" + key + "[ ]*" + cnf.RIGHT, "g"), data[key]);
			});
		}

		return tmpl;
	};

	/**
	 * Get template from the cache
	 *
	 * @public
	 * @param  {String} key Template key/name
	 * @return {String}
	 * @memberof $template
	 */
	this.get = function(key) {
		return this._cache[key] || "";
	};

	/**
	 * Bind all elements in the root element.
	 * Supports: click, change, bind
	 *
	 * @public
	 * @param  {NodeElement} root
	 * @param  {Object|Function} scope
	 * @memberof $template
	 */
	this.bindTemplate = function(root, scope) {
		var allElements = onix.element("*[data-click], *[data-change], *[data-bind], *[data-keydown]", root);

		if (allElements.len()) {
			var newEls = {};

			allElements.forEach(function(item) {
				this._bindEvent(item, "click", item.getAttribute("data-click"), scope);
				this._bindEvent(item, "change", item.getAttribute("data-change"), scope);
				this._bindEvent(item, "keydown", item.getAttribute("data-keydown"), scope);

				var dataBind = item.getAttribute("data-bind");

				if (dataBind) {
					newEls[dataBind] = item;
				}
			}, this);

			if ("addEls" in scope && typeof scope.addEls === "function") {
				scope.addEls(newEls);
			}
		}
	};

	/**
	 * Load template from the path.
	 *
	 * @public
	 * @param  {String} key
	 * @param  {String} path
	 * @return {$q}
	 * @memberof $template
	 */
	this.load = function(key, path) {
		var promise = $q.defer();

		$http.createRequest({
			url: path
		}).then(function(data) {
			this.add(key, data.data);

			promise.resolve();
		}.bind(this), function(data) {
			promise.reject();
		});

		return promise;
	};
}]);
;/**
 * @class $route
 * @description DI: $routeParams, $location, $template;
 */
onix.service("$route", [
	"$routeParams",
	"$location",
	"$template",
	"$inject",
function(
	$routeParams,
	$location,
	$template,
	$inject
) {
	/**
	 * All routes
	 *
	 * @private
	 * @type {Array}
	 * @memberof $route
	 */
	this._routes = [];

	/**
	 * Otherwise route
	 *
	 * @private
	 * @type {Object}
	 * @memberof $route
	 */
	this._otherwise = null;

	/**
	 * Route init.
	 *
	 * @public
	 * @memberof $route
	 */
	this.init = function() {
	};

	/**
	 * Add route to the router.
	 *
	 * @public
	 * @param  {String} url 
	 * @param  {Object} config
	 * @return {Himself}
	 * @memberof $route
	 */
	this.when = function(url, config) {
		this._routes.push({
			url: url,
			config: config
		});

		return this;
	};

	/**
	 * Otherwise.
	 *
	 * @public
	 * @param  {String} page
	 * @param  {Object} config
	 * @return {Himself}
	 * @memberof $route
	 */
	this.otherwise = function(config) {
		this._otherwise = {
			config: config
		};

		return this;
	};

	/**
	 * Run controller from $route path
	 *
	 * @param  {String|Array|Function} contr
	 * @param  {Object} [contrData] 
	 */
	this._runController = function(contr, contrData) {
		if (typeof contr === "string") {
			var param = onix.getObject(contr);

			$inject.bind(param, contrData)();
		}
		else if (Array.isArray(contr)) {
			$inject.bind(contr, contrData)();
		}
		else if (typeof contr === "function") {
			contr.apply(contr, [contrData]);
		}
	};

	/**
	 * Route GO.
	 *
	 * @public
	 * @memberof $route
	 */
	this.go = function() {
		var path = $location.get();
		var find = false;
		var config = null;
		var data = {};

		this._routes.every(function(item) {
			if (path.match(new RegExp(item.url))) {
				config = item.config;
				find = true;
				
				return false;
			}
			else {
				return true;
			}
		});

		if (!find && this._otherwise) {
			config = this._otherwise.config;
		}

		if (config) {
			// todo - clear all routeParams - never set
			Object.keys($routeParams).forEach(function(key) {
				delete $routeParams[key];
			});

			var templateUrl = null;
			var contr = null;
			var contrData = {};

			Object.keys(config).forEach(function(key) {
				var value = config[key];

				switch (key) {
					case "templateUrl":
						templateUrl = value;
						break;
						
					case "controller":
						contr = value;
						break;

					default:
						contrData[key] = value;
				}
			});

			if (templateUrl) {
				$template.load(config.templateUrl, config.templateUrl).done(function() {
					if (contr) {
						this._runController(contr, contrData);
					}
				}.bind(this));
			}
			else {
				if (contr) {
					this._runController(contr, contrData);
				}
			}
		}
	};
}]);
;onix.factory("$select", [
	"$common",
	"$event",
function(
	$common,
	$event
) {
	/**
	 * Main class for select.
	 * DI: $common, $event;
	 *
	 * @class $select
	 * @param {NodeElement} el Where element has class "dropdown"
	 */
	var $select = function(el) {
		// extend our class
		$common.extend(this, $event);

		this._CONST = {
			CAPTION_SEL: ".dropdown-toggle",
			OPTIONS_SEL: ".dropdown-menu a",
			OPEN_DROPDOWN_SEL: ".dropdown.open",
			OPEN_CLASS: "open",
			ACTIVE_CLASS: "active"
		};

		this._el = el;

		this._bind(el);
	};

	/**
	 * Bind clicks on the select.
	 *
	 * @private
	 * @param {NodeElement} el Where element has class "dropdown"
	 * @memberof $select
	 */
	$select.prototype._bind = function(el) {
		var captionEl = el.querySelector(this._CONST.CAPTION_SEL);
		var con = this._CONST;

		// click on the caption
		captionEl.addEventListener("click", function(e) {
			e.stopPropagation();

			var isOpen = el.classList.contains(con.OPEN_CLASS);

			var removeAllOpened = function() {
				// remove all
				onix.element(con.OPEN_DROPDOWN_SEL).forEach(function(item) {
					item.classList.remove("open");
				});
			};

			removeAllOpened();

			if (isOpen) {
				// outside click
				window.removeEventListener("click");
			}
			else {
				// outside click
				window.addEventListener("click", function(e) {
					removeAllOpened();
					window.removeEventListener("click");
				});

				el.classList.add(con.OPEN_CLASS);
			}
		});

		onix.element(this._CONST.OPTIONS_SEL, el).forEach(function(option) {
			option.addEventListener("click", $common.bindWithoutScope(function(e, scope) {
				e.stopPropagation();

				if (!this.parentNode.classList.contains(con.ACTIVE_CLASS)) {
					// remove previously selected
					this.parentNode.parentNode.querySelector("." + con.ACTIVE_CLASS).classList.remove(con.ACTIVE_CLASS);

					// add to the current
					this.parentNode.classList.add(con.ACTIVE_CLASS);

					el.classList.remove(con.OPEN_CLASS);

					// trigger click
					var value = this.getAttribute("data-value") || "";
					scope.trigger("change", value);
				}
			}, this));
		}, this);
	};

	return $select;
}]);
