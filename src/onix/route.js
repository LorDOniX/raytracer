/**
 * Simple router for the application.
 * 
 * @class $route
 */

import * as $location from "./location";
import $template from "./template";

class $route {
	constructor() {
		/**
		 * All routes.
		 *
		 * @private
		 * @type {Array}
		 * @memberof $route
		 */
		this._routes = [];

		/**
		 * Otherwise route.
		 *
		 * @private
		 * @type {Object}
		 * @memberof $route
		 */
		this._otherwise = null;
	}

	/**
	 * Add route to the router.
	 *
	 * @chainable
	 * @param  {String} url 
	 * @param  {Object} config
	 * @param  {String} [config.templateId] Template ID which will be used for templateUrl
	 * @param  {String} [config.templateUrl] Template URL which will be loaded and cached in the $template
	 * @param  {String} [config.controller] Run this function if the route is used
	 * @param  {Object} [config.xyz] Rest parameters goes to the $routeParams
	 * @memberof $route
	 */
	when(url, config) {
		this._routes.push({
			url: url,
			config: config
		});

		return this;
	}

	/**
	 * Otherwise.
	 *
	 * @chainable
	 * @param  {String} page
	 * @param  {Object} config
	 * @param  {String} [config.templateId] Template ID which will be used for templateUrl
	 * @param  {String} [config.templateUrl] Template URL which will be loaded and cached in the $template
	 * @param  {String} [config.controller] Run this function if the route is used
	 * @param  {Object} [config.xyz] Rest parameters goes to the $routeParams
	 * @memberof $route
	 */
	otherwise(config) {
		this._otherwise = {
			config: config
		};

		return this;
	}

	/**
	 * Route GO. Walk through all routes, if there is match, route controller will be called.
	 *
	 * @memberof $route
	 */
	go() {
		let path = $location.get();
		let find = false;
		let config = null;

		this._routes.every(item => {
			// exact match or regular expression
			if (path == item.url || path.match(new RegExp(item.url))) {
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
			let templateId = "";
			let templateUrl = null;
			let contr = null;
			let routeParams = {};

			Object.keys(config).forEach(key => {
				let value = config[key];

				switch (key) {
					case "templateId":
						templateId = value;
						break;

					case "templateUrl":
						templateUrl = value;
						break;
						
					case "controller":
						contr = value;
						break;

					default:
						routeParams[key] = value;
				}
			});

			// run controller function
			let runController = () => {
				if (typeof contr === "function") {
					contr(routeParams);
				}
			};

			if (templateUrl) {
				$template.load(config.templateId || config.templateUrl, config.templateUrl).then(runController);
			}
			else {
				runController();
			}
		}
	}
}

export default new $route();
