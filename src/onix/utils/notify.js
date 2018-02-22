/**
 * $notify uses bootstrap alerts and provides additional functionality.
 * Create notification object from the element.
 *
 * @param {HTMLElement} el
 * @class $notify
 */

import * as $common from "../common";
import { element } from "../my-query";

export default class $notify {
	constructor(el) {
		this._el = el;

		this._HIDE_TIMEOUT = 1500; // [ms]

		this._options = {
			"ok": "alert-success",
			"error": "alert-danger",
			"info": "alert-info",
			"warn": "alert-warning"
		};

		return this;
	}

	/**
	 * Reset CSS classes.
	 *
	 * @method reset
	 * @memberof $notify
	 */
	reset() {
		Object.keys(this._options).forEach(key => {
			this._el.classList.remove(this._options[key]);
		});

		return this;
	}

	/**
	 * Show OK state.
	 * 
	 * @param  {String|HTMLElement} txt
	 * @method ok
	 * @memberof $notify
	 */
	ok(txt) {
		this._el.classList.add(this._options.ok);
		
		this._setValue(txt);

		return this;
	}

	/**
	 * Show ERROR state.
	 * 
	 * @param  {String|HTMLElement} txt
	 * @method error
	 * @memberof $notify
	 */
	error(txt) {
		this._el.classList.add(this._options.error);
		
		this._setValue(txt);

		return this;
	}

	/**
	 * Show INFO state.
	 *
	 * @param  {String|HTMLElement} txt
	 * @method info
	 * @memberof $notify
	 */
	info(txt) {
		this._el.classList.add(this._options.info);
		
		this._setValue(txt);

		return this;
	}

	/**
	 * Show WARNING state.
	 *
	 * @param  {String|HTMLElement} txt
	 * @method warn
	 * @memberof $notify
	 */
	warn(txt) {
		this._el.classList.add(this._options.warn);
		
		this._setValue(txt);

		return this;
	}

	/**
	 * Hide alert after timeout and returns promise at the end of operation.
	 * Default timeout is 1500 ms.
	 *
	 * @param {Number} [timeout] Hide timeout in [ms]
	 * @return {Promise}
	 * @method hide
	 * @memberof $notify
	 */
	hide(timeout) {
		return new Promise(resolve => {
			setTimeout(() => {
				this.reset();
				
				resolve();
			}, timeout || this._HIDE_TIMEOUT);
		});
	}

	/**
	 * Set value to the notify element.
	 *
	 * @param  {String|HTMLElement} txt
	 * @memberof $notify
	 * @method _setValue
	 * @private
	 */
	_setValue(txt) {
		if ($common.isElement(txt)) {
			element(this._el).empty().append(txt);
		}
		else if (typeof txt === "string") {
			this._el.innerHTML = txt;
		}
	}
}
