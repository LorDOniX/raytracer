/**
 * Signals:
 * click { item, e } click on item
 * position-change {} item move
 */
class Sortable {
	constructor(listEl, opts) {
		this._listEl = listEl;
		this._opts = Object.assign({
			setTimeout: 50, // [ms]
			setCount: 2, // read DOM count
			className: "sortable", // class for the list
			itemClassName: "sortable-item", // class for the list item
			itemSelector: "li", // list selector
			cb: null, // signals callback
			minDistance: 3, // min distance for click/move
			useTranslate3d: true // use translate3d? - def. turn off
		}, opts);
		this._placeholderEl = this._createPlaceholder()
		this._liItems = [];
		this._items = [];
		this._mouse = {};

		this.clean();

		// list setting
		this._listEl.addEventListener("pointerdown", this);
		this._listEl.classList.add(this._opts.className);

		if (this._opts.useTranslate3d) {
			this._listEl.classList.add("use-translate3d");
		}

		// auto setting
		this.set();
	}

	/**
	 * Destructor.
	 */
	destroy() {
		this.clean();

		// disable use
		this._enabled = false;
	}

	/**
	 * Setting - counting widths a items reposition.
	 * It requires to have be appended to the DOM, otherwise it call itself two times.
	 */
	set() {
		// getting li items
		this._liItems = this._getListItems();

		// was set?
		if (this._wasSet || this._setCounter == this._opts.setCount) return;

		if (this._liItems.length) {
			let firstHeight = this._liItems[0].offsetHeight;

			if (!firstHeight) {
				this._setCounter++;

				setTimeout(() => {
					this.set();
				}, this._opts.setTimeout);

				return;
			}

			this._wasSet = true;
		}

		// no animations for first run
		this._listEl.classList.add("no-anim");

		let listHeight = 0;
		let fromY = 0;

		this._liItems.forEach((li, ind) => {
			let height = li.offsetHeight;
			let item = {
				el: li,
				height
			};

			// init transformation
			item.el.classList.add(this._opts.itemClassName);
			this._setItemAxeY(li, fromY);
			fromY += height;
			listHeight += height;

			this._items.push(item);
		});

		this._height = listHeight;
		this._listEl.style.height = `${listHeight}px`;

		setTimeout(() => {
			this._listEl.classList.remove("no-anim");
		}, 0);
	}

	/**
	 * Clean - value reset.
	 *
	 * @param {Boolean} [clearList] Remove all li items
	 */
	clean(clearList) {
		while (this._items.length) {
			this._items.pop();
		}
		this._dragged = null;
		this._startInd = -1;
		this._wasSet = false;
		this._setCounter = 0;
		this._height = 0;
		this._mouse.x = 0;
		this._mouse.y = 0;
		this._mouse.downY = 0;
		this._mouse.moved = false;
		this._enabled = true;

		while (this._liItems.length) {
			let li = this._liItems.pop();

			if (clearList) {
				this._listEl.removeChild(li);
			}
		}

		this._listEl.style.height = "0px";
	}

	/**
	 * Reset - after add/remove list item.
	 */
	reset() {
		this.clean();
		this.set();
	}

	/**
	 * Enable move.
	 */
	enable() {
		this._enabled = true;
	}

	/**
	 * Disable move.
	 */
	disable() {
		this._enabled = false;
	}

	/**
	 * Enable/disable move.
	 * 
	 * @param {Boolean} state New state
	 */
	setEnable(state) {
		this._enabled = state;
	}

	/**
	 * Get enable state.
	 * 
	 * @return {Boolean}
	 */
	get enabled() {
		return this._enabled;
	}

	handleEvent(e) {
		switch (e.type) {
			case "pointerdown":
				this._pointerDown(e);
				break;

			case "pointermove":
				this._pointerMove(e);
				break;

			case "pointerup":
				this._pointerUp(e);
				break;
		}
	}

	/**
	 * Placeholder.
	 * 
	 * @return {Element}
	 */
	_createPlaceholder() {
		let ph = document.createElement(this._opts.itemSelector);
		ph.classList.add("placeholder");
		return ph;
	}

	/**
	 * Li items to an array.
	 * 
	 * @return {Array}
	 */
	_getListItems() {
		let liItems = [];
		let els = this._listEl.querySelectorAll(this._opts.itemSelector) || [];

		for (let i = 0; i < els.length; i++) {
			// pouze prime potomky
			if (els[i].parentNode != this._listEl) continue;

			liItems.push(els[i]);
		}

		return liItems;
	}

	/**
	 * Pointer event - down.
	 * 
	 * @param  {Event} e
	 */
	_pointerDown(e) {
		e.preventDefault();
		e.stopPropagation();

		// on which li was clicked?
		let liEl = e.target.nodeName.toLowerCase() == this._opts.itemSelector ? e.target : e.target.closest(this._opts.itemSelector);
		
		// results li must have selector class name
		if (!liEl.classList.contains(this._opts.itemClassName)) return;

		let item = null;

		// find correct li item
		for (let i = 0; i < this._items.length; i++) {
			if (this._items[i].el == liEl) {
				item = this._items[i];
				break;
			}
		}

		this._dragged = item;
		this._startInd = this._items.indexOf(this._dragged);
		this._mouse.x = e.clientX;
		this._mouse.y = e.clientY;
		this._mouse.moved = false;

		// events
		this._listEl.addEventListener("pointermove", this);
		document.addEventListener("pointerup", this);
	}

	/**
	 * Pointer event - move.
	 * 
	 * @param  {Event} e
	 */
	_pointerMove(e) {
		e.stopPropagation();

		// min. distance + are we able to move? Otherwise we generates clicks.
		if (this._items.length <= 1 || !this._enabled || this._getDistance(e) < this._opts.minDistance) return;

		// move start
		if (!this._mouse.moved) {
			let fromY = this._getIntervals(this._dragged).fromY;

			this._mouse.moved = true;
			this._dragged.el.classList.add("dragged");
			this._mouse.startY = fromY;

			// insert placeholder
			this._setItemAxeY(this._placeholderEl, fromY);
			this._placeholderEl.style.height = `${this._dragged.height}px`;
			this._listEl.insertBefore(this._placeholderEl, this._dragged.el);
		}

		// move itself
		let y = Math.min(this._height - this._dragged.height, Math.max(0, this._mouse.startY + e.clientY - this._mouse.y));
		this._setItemAxeY(this._dragged.el, y);

		let intersection = this._getIntersection(y, e.clientY < this._mouse.y ? -1 : 1);

		if (intersection && intersection.el != this._dragged.el) {
			let draggedInd = this._items.indexOf(this._dragged);
			let interInd = this._items.indexOf(intersection);
			let draggedItem = this._items.splice(draggedInd, 1)[0];

			this._items.splice(interInd, 0, draggedItem);
			this._listEl.insertBefore(this._placeholderEl, intersection.el);

			// rest corrections
			let fromY = 0;

			this._items.forEach(i => {
				this._setItemAxeY(i.el, fromY);
				fromY += i.height;
			});
		}
	}

	/**
	 * Pointer event - up.
	 * 
	 * @param  {Event} e
	 */
	_pointerUp(e) {
		e.stopPropagation();

		if (this._mouse.moved) {
			let endInd = this._items.indexOf(this._dragged);
			let dir = e.clientY < this._mouse.y ? -1 : 1;

			this._dragged.el.classList.remove("dragged");
			this._setItemAxeY(this._dragged.el, this._getIntervals(this._dragged).fromY);

			// up - beside placeholder; after placeholder
			this._listEl.insertBefore(this._dragged.el, this._listEl.children[endInd + (dir == -1 ? 0 : 2)]);
			this._listEl.removeChild(this._placeholderEl);

			// event for move
			if (endInd != this._startInd) {
				this._sendSignal("position-change", {
					start: this._startInd,
					end: this._items.indexOf(this._dragged),
					item: this._dragged.el,
					e
				});
			}
		}
		else if (this._getDistance(e) <= this._opts.minDistance) {
			// event for click
			this._sendSignal("click", {
				item: this._dragged.el,
				e
			});
		}

		this._dragged = null;

		// events
		this._listEl.removeEventListener("pointermove", this);
		document.removeEventListener("pointerup", this);
	}

	_getDistance(e) {
		return Math.sqrt(Math.pow(e.clientX - this._mouse.x, 2) + Math.pow(e.clientY - this._mouse.y, 2));
	}

	/**
	 * Set axe Y move.
	 * 
	 * @param {Element} el
	 * @param {Number} y New value
	 */
	_setItemAxeY(el, y) {
		if (this._opts.useTranslate3d) {
			el.style.transform = `translate3d(0, ${y}px, 0)`;
		}
		else {
			el.style.top = `${y}px`;
		}
	}

	/**
	 * Get intervals of all items.
	 * 
	 * @param  {Object} [searchItem] For search item, it returns fromY and toY for it.
	 * @return {Array|Object}
	 */
	_getIntervals(searchItem) {
		let intervals = [];
		let fromY = 0;
		let find = null;

		this._items.forEach(i => {
			let item = {
				fromY,
				toY: fromY + i.height - 1,
				item: i
			};

			intervals.push(item);

			if (searchItem && !find && i == searchItem) {
				find = item;
			}

			fromY += i.height;
		});

		if (find) {
			return find;
		}
		else {
			return intervals;
		}
	}

	/**
	 * Get intersection item after move.
	 * 
	 * @param  {Number} y Value
	 * @param  {Number} dir dir -1 - top edge; dir +1 - bottom edge
	 * @return {Object} Intersection object
	 */
	_getIntersection(y, dir) {
		let intersection = null;
		let intervals = this._getIntervals();
		let len = intervals.length;

		if (dir == -1) {
			for (let i = 0; i < len; i++) {
				let int = intervals[i];

				if (y <= int.fromY) {
					intersection = int.item;
					break;
				}
			}
		}
		else {
			y += this._dragged.height;

			for (let i = len - 1; i >= 0; i--) {
				let int = intervals[i];

				if (y >= int.toY) {
					intersection = int.item;
					break;
				}
			}
		}

		return intersection;
	}

	/**
	 * Sending signal.
	 * 
	 * @param  {String} name Signal name
	 * @param  {Object} data Data
	 */
	_sendSignal(name, data) {
		if (typeof this._opts.cb === "function") {
			this._opts.cb(Object.assign({
				name
			}, data));
		}
	}
}
