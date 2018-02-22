/**
 * JSON object visualiser.
 * 
 * @class $jsonViewer
 */

import * as $dom from "../dom";

export default class $jsonViewer {
	constructor() {
		this._const = {
			HIDE_CLASS: "hide"
		};

		this._dom = {
			container: $dom.create({
				el: "pre",
				class: "json-viewer"
			})
		};
	}

	/**
	 * Visualise JSON object.
	 * 
	 * @param {Object|Array} json Input value
	 * @param {Number} [maxLvl] Process only to max level, where 0..n, -1 unlimited
	 * @param {Number} [colAt] Collapse at level, where 0..n, -1 unlimited
	 * @param {Array} [cutArray] Cuted arrays list
	 * @memberof $jsonViewer
	 * @method showJSON
	 * 
	 */
	showJSON (json, maxLvl, colAt, cutArray) {
		maxLvl = typeof maxLvl === "number" ? maxLvl : -1; // max level
		colAt = typeof colAt === "number" ? colAt : -1; // collapse at
		cutArray = cutArray || [];

		let jsonData = this._processInput(json);
		let walkEl = this._walk(jsonData, maxLvl, colAt, 0, cutArray);

		this._dom.container.innerHTML = "";
		this._dom.container.appendChild(walkEl);
	}

	/**
	 * Get container with pre object - this container is used for visualise JSON data.
	 * 
	 * @return {Element}
	 * @memberof $jsonViewer
	 * @method getContainer
	 */
	getContainer() {
		return this._dom.container;
	}

	/**
	 * Process input JSON - throws exception for unrecognized input.
	 * 
	 * @param {Object|Array} json Input value
	 * @return {Object|Array}
	 * @memberof $jsonViewer
	 * @method _processInput
	 * @private
	 */
	_processInput(json) {
		if (json && typeof json === "object") {
			return json;
		}
		else {
			throw "Input value is not object or array!";
		}
	}

	/**
	 * Recursive walk for input value.
	 * 
	 * @param {Object|Array} value Input value
	 * @param {Number} maxLvl Process only to max level, where 0..n, -1 unlimited
	 * @param {Number} colAt Collapse at level, where 0..n, -1 unlimited
	 * @param {Number} lvl Current level
	 * @memberof $jsonViewer
	 * @method _walk
	 * @private
	 */
	_walk(value, maxLvl, colAt, lvl, cutArray) {
		let frag = document.createDocumentFragment();
		let isMaxLvl = maxLvl >= 0 && lvl >= maxLvl;
		let isCollapse = colAt >= 0 && lvl >= colAt;

		switch (typeof value) {
			case "object":
				if (value) {
					let isArray = Array.isArray(value);
					let items = isArray ? value : Object.keys(value);

					if (lvl === 0) {
						// root level
						let rootCount = this._createItemsCount(items.length);
						// hide/show
						let rootLink = this._createLink(isArray ? "[" : "{");

						if (items.length) {
							rootLink.addEventListener("click", e => {
								if (isMaxLvl) return;

								rootLink.classList.toggle("collapsed");
								rootCount.classList.toggle("hide");

								// main list
								this._dom.container.querySelector("ul").classList.toggle("hide");
							});

							if (isCollapse) {
								rootLink.classList.add("collapsed");
								rootCount.classList.remove("hide");
							}
						}
						else {
							rootLink.classList.add("empty");
						}

						rootLink.appendChild(rootCount);
						frag.appendChild(rootLink);
					}

					if (items.length && !isMaxLvl) {
						let len = items.length - 1;
						let ulList = $dom.create({
							el: "ul",
							class: "type-" + (isArray ? "array" : "object"),
							attrs: {
								"data-level": lvl
							}
						});

						items.forEach((key, ind) => {
							let item = isArray ? key : value[key];
							let li = $dom.create({
								el: "li"
							});

							if (typeof item === "object") {
								let isEmpty = false;

								// null && date
								if (!item || item instanceof Date) {
									li.appendChild(this._createText(isArray ? "" : key + ": "));
									li.appendChild(this._createSimple(item ? item : null));
								}
								// array & object
								else {
									let itemIsArray = Array.isArray(item);
									let itemLen = itemIsArray ? item.length : Object.keys(item).length;

									// empty
									if (!itemLen) {
										li.appendChild(this._createText((typeof key === "string"? key + ": " : "") + (itemIsArray ? "[]" : "{}")));
									}
									else {
										// 1+ items
										let itemTitle = (typeof key === "string" ? key + ": " : "") + (itemIsArray ? "[" : "{");
										let itemLink = this._createLink(itemTitle);
										let origCount = null;

										if (itemIsArray) {
											cutArray.every(cutItem => {
												if (cutItem.array == item) {
													origCount = cutItem.len;
													return false;
												}
												else {
													return true;
												}
											});
										}

										let itemsCount = this._createItemsCount(itemLen, origCount);

										// maxLvl - only text, no link
										if (maxLvl >= 0 && lvl + 1 >= maxLvl) {
											li.appendChild(this._createText(itemTitle));
										}
										else {
											itemLink.appendChild(itemsCount);
											li.appendChild(itemLink);
										}

										li.appendChild(this._walk(item, maxLvl, colAt, lvl + 1, cutArray));
										li.appendChild(this._createText(itemIsArray ? "]" : "}"));
										
										let list = li.querySelector("ul");
										let itemLinkCb = () => {
											itemLink.classList.toggle("collapsed");
											itemsCount.classList.toggle("hide");
											list.classList.toggle("hide");
										};

										// hide/show
										itemLink.addEventListener("click", itemLinkCb);

										// collapse lower level
										if (colAt >= 0 && lvl + 1 >= colAt) {
											itemLinkCb();
										}
									}
								}
							}
							// simple values
							else {
								// object keys with key:
								if (!isArray) {
									li.appendChild(this._createText(key + ": "));
								}

								// recursive
								li.appendChild(this._walk(item, maxLvl, colAt, lvl + 1, cutArray));
							}

							// add comma to the end
							if (ind < len) {
								li.appendChild(this._createText(","));
							}

							ulList.appendChild(li);
						}, this);

						frag.appendChild(ulList);
					}
					else if (items.length && isMaxLvl) {
						let itemsCount = this._createItemsCount(items.length);
						itemsCount.classList.remove("hide");

						frag.appendChild(itemsCount);
					}

					if (lvl === 0) {
						// empty root
						if (!items.length) {
							let itemsCount = this._createItemsCount(0);
							itemsCount.classList.remove("hide");

							frag.appendChild(itemsCount);
						}

						// root cover
						frag.appendChild(this._createText(isArray ? "]" : "}"));

						// collapse
						if (isCollapse) {
							frag.querySelector("ul").classList.add("hide");
						}
					}
					break;
				}

			default:
				// simple values
				frag.appendChild(this._createSimple(value));
				break;
		}

		return frag;
	}

	/**
	 * Create text node.
	 * 
	 * @param  {String} value Text content
	 * @return {Element}
	 * @memberof $jsonViewer
	 * @method _createText
	 * @private
	 */
	_createText(value) {
		return $dom.create({
			el: "text",
			textContent: value || ""
		});
	}

	/**
	 * Create simple value (no object|array).
	 * 
	 * @param  {Number|String|null|undefined|Date} value Input value
	 * @return {Element}
	 * @memberof $jsonViewer
	 * @method _createSimple
	 * @private
	 */
	_createSimple(value) {
		let type = typeof value;
		let txt = value;

		if (type === "string") {
			txt = '"' + value + '"';
		}
		else if (value === null) {
			type = "null";
			txt = "null";
		}
		else if (value === undefined) {
			txt = "undefined";
		}
		else if (value instanceof Date) {
			type = "date";
			txt = value.toString();
		}

		return $dom.create({
			el: "span",
			class: "type-" + type,
			innerHTML: txt
		});
	}

	/**
	 * Create items count element.
	 * 
	 * @param  {Number} count Items count
	 * @param  {Number} [origCount] Original count
	 * @return {Element}
	 * @memberof $jsonViewer
	 * @method _createItemsCount
	 * @private
	 */
	_createItemsCount(count, origCount) {
		return $dom.create({
			el: "span",
			class: ["items-ph", this._const.HIDE_CLASS],
			href: "javascript:void(0)",
			innerHTML: this._getItemsTitle(count, origCount)
		});
	}

	/**
	 * Create clickable link.
	 * 
	 * @param  {String} title Link title
	 * @return {Element}
	 * @memberof $jsonViewer
	 * @method _createLink
	 * @private
	 */
	_createLink(title) {
		return $dom.create({
			el: "a",
			class: "list-link",
			href: "javascript:void(0)",
			innerHTML: title || ""
		});
	}

	/**
	 * Get correct item|s title for count.
	 * 
	 * @param  {Number} count Items count
	 * @param  {Number} [origCount] Original count
	 * @return {String}
	 * @memberof $jsonViewer
	 * @method _getItemsTitle
	 * @private
	 */
	_getItemsTitle(count, origCount) {
		let itemsTxt = count > 1 || count === 0 ? "items" : "item";
		var orig = typeof origCount === "number" ? "/" + origCount : "";

		return (count + orig + " " + itemsTxt);
	}
};
