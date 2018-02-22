/**
 * Create $popup window.
 * Signals:
 * popup-close - popup is closed
 *
 * Signal listeners:
 * window-resize - window was resized
 * 
 * @param {Object} [opts] Configuration
 * @param {Number} [opt.maxWidth] max. width [px]
 * @param {Boolean} [opt.draggable] can be popup moved on the screen?
 * @param {String} [opt.className] optinal css class name
 * @param {POSITIONS} [opt.position] default popup position on the screen
 * @param {Number} [opt.padding] except all centers, add padding to position
 * @class $popup
 */

import * as $dom from "../dom";
import $event from "../event";
import $resize from "../resize";

/**
 * $popup available positions.
 * 
 * @type {Object}
 * @memberof $popup
 * @static
 */
export const POSITIONS = {
	TOP_LEFT: 0,
	TOP_CENTER: 1,
	TOP_RIGHT: 2,
	CENTER_LEFT: 3,
	CENTER_CENTER: 4,
	CENTER_RIGHT: 5,
	BOTTOM_LEFT: 6,
	BOTTOM_CENTER: 7,
	BOTTOM_RIGHT: 8
};

class $popup extends $event {
	constructor(opts) {
		super();

		this._const = {
			ROOT_CLASS: "popup",
			CONTENT_CLASS: "content",
			CLOSE_BTN_CLASS: "close-btn",
			MOVE_COVER_CLASS: "popup-move-cover",
			DRAGGABLE_CLASS: "draggable",
			// responsive mode - popup width is smaller than screen width
			RESPONSIVE_CLASS: "responsive-mode",
			// popup height is smaller the screen height
			OVERFLOW_Y_CLASS: "overflow-y"
		};
		
		this._opts = {
			maxWidth: null,
			draggable: true,
			className: "",
			position: POSITIONS.CENTER_CENTER,
			padding: 0
		};

		for (let opt in opts) {
			this._opts[opt] = opts[opt];
		}

		this._binds = {};
		this._binds.mouseDown = this._mouseDown.bind(this);
		this._binds.mouseUp = this._mouseUp.bind(this);
		this._binds.mouseMove = this._mouseMove.bind(this);
		this._binds.click = this._click.bind(this);

		this._dom = this._create();

		this._appendNode = document.body;
		this._isDraggedOut = false;
		
		this._saved = {
			width: 0,
			height: 0,
			x: 0,
			y: 0
		};
		this._screen = {
			width: 0,
			height: 0
		};

		this._setScreenSize();

		// signals
		this.on("window-resize", this._resize, this);

		// append - open popup
		this._appendNode.appendChild(this._dom.root);

		this.setPosition();
	}

	/**
	 * Get $popup root element.
	 *
	 * @return {Element}
	 * @memberof $popup
	 * @method getContainer
	 */
	getContainer() {
		return this._dom.root;
	}

	/**
	 * Get $popup content.
	 *
	 * @return {Element}
	 * @memberof $popup
	 * @method getContent
	 */
	getContent() {
		return this._dom.content;
	}

	/**
	 * Close popup.
	 *
	 * @memberof $popup
	 * @method close
	 */
	close() {
		if (this._dom.root) {
			this._dom.root.parentNode.removeChild(this._dom.root);

			this._isDraggedOut = false;
			this._dom.root = null;
			
			this.trigger("popup-close");
		}
	}

	/**
	 * Set position.
	 * 
	 * @param {Object} [pos] optinal position; otherwise startup position is used
	 * @memberof $popup
	 * @method setPosition
	 */
	setPosition(pos) {
		if (!this._isDraggedOut) {
			this._setPosition(pos);
		}
		else {
			this._setPositionAfterDragged();
		}
	}

	/**
	 * Window resize event.
	 * 
	 * @memberof $popup
	 * @method _resize
	 * @private
	 */
	_resize() {
		this._setScreenSize();
		this.setPosition();
	}

	/**
	 * Save screen dimensions.
	 * 
	 * @memberof $popup
	 * @method _setScreenSize
	 * @private
	 */
	_setScreenSize() {
		this._screen.width = Math.min(window.innerWidth, document.body.offsetWidth);
		this._screen.height = window.innerHeight;
	}

	/**
	 * Calculate position according to the selected position from the enum POSITIONS.
	 * 
	 * @param {Object} pos Position
	 * @memberof $popup
	 * @method _calculatePosition
	 * @private
	 */
	_calculatePosition(pos) {
		let width = this._dom.root.offsetWidth;
		let height = this._dom.root.offsetHeight;

		// default center - center
		let left = Math.floor((this._screen.width - width) / 2);
		let top = Math.floor((this._screen.height - height) / 2);

		switch (pos) {
			case POSITIONS.TOP_LEFT:
				left = 0 + this._opts.padding;
				top = 0 + this._opts.padding;
				break;

			case POSITIONS.TOP_CENTER:
				left = Math.floor((this._screen.width - width) / 2);
				top = 0 + this._opts.padding;
				break;

			case POSITIONS.TOP_RIGHT:
				left = this._screen.width - width - this._opts.padding;
				top = 0 + this._opts.padding;
				break;

			case POSITIONS.CENTER_LEFT:
				left = 0 + this._opts.padding;
				top = Math.floor((this._screen.height - height) / 2);
				break;

			case POSITIONS.CENTER_RIGHT:
				left = this._screen.width - width - this._opts.padding;
				top = Math.floor((this._screen.height - height) / 2);
				break;

			case POSITIONS.BOTTOM_LEFT:
				left = 0 + this._opts.padding;
				top = this._screen.height - height - this._opts.padding;
				break;

			case POSITIONS.BOTTOM_CENTER:
				left = Math.floor((this._screen.width - width) / 2);
				top = this._screen.height - height - this._opts.padding;
				break;

			case POSITIONS.BOTTOM_RIGHT:
				left = this._screen.width - width - this._opts.padding;
				top = this._screen.height - height - this._opts.padding;
				break;
		}

		return {
			left: left,
			top: top
		};
	}

	/**
	 * Set position.
	 * 
	 * @param {Object} [pos] optinal position; otherwise startup position is used
	 * @memberof $popup
	 * @method _setPosition
	 * @private
	 */
	_setPosition(pos) {
		let left = 0;
		let top = 0;

		if (!pos) {
			pos = this._opts.position;
		}

		if (typeof pos === "number") {
			let cp = this._calculatePosition(pos);

			left = cp.left;
			top = cp.top;
		}
		else if (typeof pos === "object") {
			left = pos.left || 0;
			top = pos.top || 0;
		}

		this._setRootPosition(left, top);
	}

	/**
	 * Set position after $popup was dragged.
	 *
	 * @memberof $popup
	 * @method _setPositionAfterDragged
	 * @private
	 */
	_setPositionAfterDragged() {
		// dragged popup - is visible in the viewport?
		let width = this._dom.root.offsetWidth;
		let height = this._dom.root.offsetHeight;
		let left = this._dom.root.offsetLeft;
		let top = this._dom.root.offsetTop;

		if ((width + left > this._screen.width) || (height + top > this._screen.height)) {
			// center
			let cp = this._calculatePosition();
			// def.
			let def = this._calculatePosition(this._opts.position);

			// set
			if (cp.left != def.left && cp.top != def.top) {
				this._setRootPosition(def.left, def.top);
			}
			else {
				this._setRootPosition(cp.left, cp.top);
			}

			this._isDraggedOut = false;
		}
	}

	/**
	 * Set root position.
	 *
	 * @param {Number} x Axe X
	 * @param {Number} y Axe Y
	 * @memberof $popup
	 * @method _setRootPosition
	 * @private
	 */
	_setRootPosition(x, y) {
		let left = x || 0;
		let top = y || 0;
		let width = this._dom.root.offsetWidth;
		let height = this._dom.root.offsetHeight;

		// x, y modifications
		if (left < 0) {
			left = 0;
		}
		else if (left + width > this._screen.width) {
			left = this._screen.width - width;
		}

		if (top < 0) {
			top = 0;
		}
		else if (top + height > this._screen.height) {
			top = this._screen.height - height;
		}

		// height overflow
		if (!this._saved.height && height > this._screen.height) {
			this._dom.root.classList.add(this._const.OVERFLOW_Y_CLASS);
			this._saved.height = height;
		}
		else if (this._saved.height && this._saved.height < this._screen.height) {
			this._saved.height = 0;

			// ok
			this._dom.root.classList.remove(this._const.OVERFLOW_Y_CLASS);
		}

		// width modification
		if (!this._saved.width && width > this._screen.width) {
			if ("getComputedStyle" in window) {
				let style = window.getComputedStyle(this._dom.root);
				width = parseFloat(style.width);
			}

			this._saved.width = this._opts.maxWidth ? Math.min(width, this._opts.maxWidth) : width;
			this._dom.root.style.width = (this._opts.maxWidth ? Math.min(this._screen.width, this._opts.maxWidth) : this._screen.width) + "px";

			// responsive mode
			this._dom.root.classList.add(this._const.RESPONSIVE_CLASS);
		}
		else if (this._saved.width) {
			if (this._saved.width < this._screen.width) {
				// leave responsive mode
				this._dom.root.classList.remove(this._const.RESPONSIVE_CLASS);

				this._dom.root.style.width = this._saved.width + "px";
				this._saved.width = 0;
			}
			else {
				// smaller - we are still in responsive mode
				this._dom.root.style.width = this._screen.width + "px";
			}

			let cp = this._calculatePosition();
			left = cp.left >= 0 ? cp.left : 0;
			top = cp.top >= 0 ? cp.top : 0;
		}

		// position
		this._dom.root.style.left = left + "px";
		this._dom.root.style.top = top + "px";
	}

	/**
	 * Mouse down event - only for draggable.
	 *
	 * @param {Event} e
	 * @memberof $popup
	 * @method _mouseDown
	 * @private
	 */
	_mouseDown(e) {
		if (e.target.classList.contains(this._const.ROOT_CLASS)) {
			e.preventDefault();
			e.stopPropagation();

			this._saved.x = parseFloat(this._dom.root.style.left) - e.clientX;
			this._saved.y = parseFloat(this._dom.root.style.top) - e.clientY;

			this._dom.moveCover = this._createMoveCover();
			this._dom.moveCover.addEventListener("mousemove", this._binds.mouseMove);
			this._dom.moveCover.addEventListener("mouseup", this._binds.mouseUp);

			this._appendNode.appendChild(this._dom.moveCover);
		}
	}

	/**
	 * Mouse move event - draggable.
	 *
	 * @param {Event} e
	 * @memberof $popup
	 * @method _mouseMove
	 * @private
	 */
	_mouseMove(e) {
		this._isDraggedOut = true;

		let left = e.clientX + this._saved.x;
		let top = e.clientY + this._saved.y;

		this._setRootPosition(left, top);
	}

	/**
	 * Mouse up event.
	 *
	 * @param {Event} e
	 * @memberof $popup
	 * @method _mouseUp
	 * @private
	 */
	_mouseUp(e) {
		this._dom.moveCover.removeEventListener("mousemove", this._binds.mouseMove);
		this._dom.moveCover.removeEventListener("mouseup", this._binds.mouseUp);

		this._appendNode.removeChild(this._dom.moveCover);

		this._dom.moveCover = null;
	}

	/**
	 * Close button click event.
	 *
	 * @param {Event} e
	 * @memberof $popup
	 * @method _click
	 * @private
	 */
	_click(e) {
		this.close();
	}

	/**
	 * Create whole $popup.
	 *
	 * @return {Element}
	 * @memberof $popup
	 * @method _create
	 * @private
	 */
	_create() {
		let exported = {};
		let events = [];
		let className = [this._const.ROOT_CLASS];

		if (this._opts.className) {
			className.push(this._opts.className);
		}

		if (this._opts.draggable) {
			className.push(this._const.DRAGGABLE_CLASS);

			events = {
				event: "mousedown",
				fn: this._binds.mouseDown
			};
		}

		$dom.create({
			el: "div",
			class: className,
			events: events,
			_exported: "root",
			child: [{
				el: "button",
				attrs: {
					type: "button"
				},
				class: [this._const.CLOSE_BTN_CLASS, "notranslate"],
				innerHTML: "x",
				events: {
					event: "click",
					fn: e => {
						this._click(e);
					}
				}
			}, {
				el: "div",
				class: this._const.CONTENT_CLASS,
				_exported: "content"
			}]
		}, exported);

		return exported;
	}

	/**
	 * Create move cover - iframe fix.
	 *
	 * @return {Element}
	 * @memberof $popup
	 * @method _createMoveCover
	 * @private
	 */
	_createMoveCover() {
		return $dom.create({
			el: "div",
			class: this._const.MOVE_COVER_CLASS
		});
	}
};

/**
 * Cover class for manage $popup - esc bindings, window resize events.

 * @class $popupManager
 */
class $popupManager {
	constructor() {
		this._popupList = [];
		this._binds = {};
		this._binds.keyDown = this._keyDown.bind(this);

		this.captureResize();

		$resize.on("resize", this._resize, this);
	}

	/**
	 * Capture resize event for all $popup windows.
	 *
	 * @memberof $popupManager
	 * @method captureResize
	 */
	captureResize() {
		$resize.start();
	}

	/**
	 * Create $popup window.
	 * Signals:
	 * popup-close - popup is closed
	 * 
	 * @param {Object} [opts] Configuration
	 * @param {Number} [opt.maxWidth] max. width [px]
	 * @param {Boolean} [opt.draggable] can be popup moved on the screen?
	 * @param {String} [opt.className] optinal css class name
	 * @param {POSITIONS} [opt.position] default popup position on the screen
	 * @param {Number} [opt.padding] except all centers, add padding to position
	 * @method create
	 * @memberof $popupManager
	 */
	create(opts) {
		let inst = new $popup(opts);

		this._register(inst);

		return inst;
	}

	/**
	 * Alert message - not draggable.
	 * 
	 * @param  {String} msg Alert message
	 * @return {$popup} instance of the $popup
	 * @memberof $popupManager
	 * @method alert
	 */
	alert(msg) {
		let inst = new $popup({
			className: "alert",
			draggable: false
		});

		let cont = inst.getContent();
		cont.appendChild($dom.create({
			el: "p",
			innerHTML: msg || ""
		}));

		this._register(inst);

		return inst;
	}

	/**
	 * Resize event for all $popups.
	 *
	 * @memberof $popupManager
	 * @method _resize
	 * @private
	 */
	_resize() {
		this._popupList.forEach(popup => {
			popup.trigger("window-resize");
		});
	}

	/**
	 * Keydown - ESC for $popup close.
	 *
	 * @param {Event} e
	 * @memberof $popupManager
	 * @method _keyDown
	 * @private
	 */
	_keyDown(e) {
		let keyCode = e.which || e.keyCode;

		if (keyCode == 27) {
			e.preventDefault();
			e.stopPropagation();

			let last = this._popupList[this._popupList.length - 1];
			last.close();
		}
	}

	/**
	 * Register new $popup. If $popup length is equal == 1, bind keydown
	 *
	 * @param {$popup} inst Instance of the new $popup
	 * @memberof $popupManager
	 * @method _register
	 * @private
	 */
	_register(inst) {
		this._popupList.push(inst);
		inst.on("popup-close", () => {
			this._unRegister(inst);
		});

		if (this._popupList.length == 1) {
			document.addEventListener("keydown", this._binds.keyDown);
		}
	}

	/**
	 * Unregister $popup. If there is no $popup, unbind keydown.
	 * This method is automatically called after $popup window is closed.
	 *
	 * @param {$popup} inst Instance of the new $popup
	 * @memberof $popupManager
	 * @method _register
	 * @private
	 */
	_unRegister(inst) {
		this._popupList.every((popup, ind) => {
			if (popup == inst) {
				this._popupList.splice(ind, 1);
				return false;
			}
			else {
				return true;
			}
		});

		if (!this._popupList.length) {
			document.removeEventListener("keydown", this._binds.keyDown);
		}
	}
};

export default new $popupManager();
