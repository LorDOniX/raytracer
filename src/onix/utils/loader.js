/**
 * Progress loader in the application.
 * 
 * @class $loader
 */

import * as $dom from "../dom";

class $loader {
	constructor() {
		// loader init
		this._create();
	}
	
	/**
	 * Start loader.
	 *
	 * @memberof $loader
	 * @method start
	 */
	start() {
		this._el.classList.add("start");
	}

	/**
	 * End loader.
	 *
	 * @memberof $loader
	 * @method end
	 */
	end() {
		this._el.classList.remove("start");
		this._el.classList.add("end");

		setTimeout(() => {
			this._el.classList.remove("end");
			this._el.classList.add("hide");

			setTimeout(() => {
				this._el.classList.remove("hide");
			}, 350);
		}, 150);
	}

	/**
	 * Get spinner - DOM or object.
	 *
	 * @param {Boolean} [getObject] True for object DOM configuration for $dom; default HTML node
	 * @return {HTMLElement|Object}
	 * @memberof $loader
	 * @method getSpinner
	 */
	getSpinner(getObject) {
		let children = [];

		for (let i = 1; i < 6; i++) {
			children.push({
				el: "div",
				class: "rect" + i
			});
		}

		let domConf = {
			el: "div",
			class: "spinner",
			child: children
		};

		return (getObject ? domConf : $dom.create(domConf));
	}

	/**
	 * Create loader.
	 *
	 * @private
	 * @memberof $loader
	 * @method _create
	 */
	_create() {
		this._el = $dom.create({
			el: "div",
			class: "loader"
		});

		$dom.load(() => {
			// insert into the body on first position
			document.body.insertBefore(this._el, document.body.firstChild);
		});
	}
}

export default new $loader();
