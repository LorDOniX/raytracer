/**
 * Repositoner on axe X.
 *
 * @param {Object} [opts] Configuration
 * @param {Number} [opts.width = 400] items parent width
 * @param {Number} [opts.domEdgeCorrection = 2] move items by x px from the edge
 * @class $repositionerX
 */
export default class $repositionerX {
	constructor(opts) {
		this._opts = Object.assign({
			width: 400,
			domEdgeCorrection: 2
		}, opts);
		this._items = [];
		this._width = 0;
	}

	/**
	 * Add new item.
	 * 
	 * @param {Number} x  Position
	 * @param {Number} width Width
	 */
	addItem(x, width) {
		if (typeof x !== "number" || width < 0) return;

		let halfWidth = width / 2;
		let leftEdgeX = x - halfWidth;
		let rightEdgeX = x + halfWidth;

		this._width += width;

		this._items.push({
			leftX: x,
			origLeftX: x,
			width,
			halfWidth,
			leftEdgeX,
			rightEdgeX
		});
	}

	/**
	 * Add new element - it counts his position and width itself.
	 * 
	 * @param {Element} el Element
	 */
	addElement(el) {
		let x = parseFloat(el.style.left.replace("px", ""));

		this.addItem(x, el.offsetWidth);
	}

	/**
	 * Get correct reposition items.
	 * 
	 * @return {Array|null}
	 */
	reposition() {
		let len = this._items.length;

		if (this._width <= this._opts.width && len > 0) {
			// sort items from left to right
			if (len > 1) {
				this._items.sort((a, b) => {
					return (a.leftX - b.leftX);
				});
			}
			
			this._items.forEach((i, ind) => {
				// align for the first and last item
				if (ind === 0 && i.leftEdgeX < 0) {
					i.leftEdgeX = this._opts.domEdgeCorrection;
					i.leftX = i.leftEdgeX + i.halfWidth;
					i.rightEdgeX = i.leftX + i.halfWidth;
				}
				if (ind === len - 1 && i.rightEdgeX > this._opts.width) {
					i.rightEdgeX = this._opts.width - this._opts.domEdgeCorrection;
					i.leftX = i.rightEdgeX - i.halfWidth;
					i.leftEdgeX = i.leftX - i.halfWidth;
				}

				// compare items
				if (ind > 0) {
					let prev = this._items[ind - 1];

					if (prev.rightEdgeX > i.leftEdgeX) {
						// rest - between two items
						let rest = Math.abs(prev.rightEdgeX - i.leftEdgeX);
						let prevPrev = ind > 1 ? this._items[ind - 2] : null;

						// move previous one
						if ((ind == 1 && prev.leftEdgeX - rest >= this._opts.domEdgeCorrection) || (ind > 1 && prev.leftEdgeX - rest >= prevPrev.rightEdgeX)) {
							let halfRest = rest / 2;
							i.leftX += halfRest;
							prev.leftX -= halfRest;
							prev.leftEdgeX = prev.leftX - prev.halfWidth;
							prev.rightEdgeX = prev.leftX + prev.halfWidth;
						}
						else {
							// move only current
							i.leftX = prev.rightEdgeX + i.halfWidth;
						}
						
						i.leftEdgeX = i.leftX - i.halfWidth;
						i.rightEdgeX = i.leftX + i.halfWidth;
					}
				}
			});

			return this._items;
		}
		else {
			return null;
		}
	}
}
