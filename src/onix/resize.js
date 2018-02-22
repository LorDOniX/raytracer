import $event from "./event";

/**
 * Handle window resize event, triggers signal "resize".
 *
 * @class $resize
 */
class $resize extends $event {
	constructor() {
		super();

		/**
		 * Is active?
		 *
		 * @memberof $resize
		 * @private
		 */
		this._active = false;
		
		/**
		 * Resize object.
		 *
		 * @memberof $resize
		 * @private
		 */
		this._resizeObj = {
			id: null,
			timeout: 333
		};

		/**
		 * Binds for functions.
		 *
		 * @memberof $resize
		 * @private
		 */
		this._binds = {
			resize: this._resize.bind(this),
			resizeInner: this._resizeInner.bind(this)
		};
	}

	/**
	 * Window resize event.
	 *
	 * @memberof $resize
	 * @private
	 * @method _resize
	 */
	_resize() {
		if (this._resizeObj.id) {
			clearTimeout(this._resizeObj.id);
			this._resizeObj.id = null;
		}

		this._resizeObj.id = setTimeout(this._binds.resizeInner, this._resizeObj.timeout);
	}

	/**
	 * Window resize event - trigger signal "resize".
	 *
	 * @memberof $resize
	 * @private
	 * @method _resizeInner
	 */
	_resizeInner() {
		this.trigger("resize");
	}
	
	// ------------------------ public ----------------------------------------

	/**
	 * Bind resize event to window object.
	 *
	 * @memberof $resize
	 * @method start
	 */
	start() {
		if (this._active) return;

		window.addEventListener("resize", this._binds.resize);

		this._active = true;
	}

	/**
	 * Unbind resize event from window object.
	 *
	 * @memberof $resize
	 * @method end
	 */
	end() {
		if (!this._active) return;

		window.removeEventListener("resize", this._binds.resize);
		
		this._active = false;
	}

	/**
	 * Is resize event captured?
	 *
	 * @return {Boolean}
	 * @memberof $resize
	 * @method isActive
	 */
	isActive() {
		return this._active;
	}
};

export default new $resize();
