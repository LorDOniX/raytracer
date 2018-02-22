/**
 * Browser features.
 * 
 * @module $features
 */

/**
 * FileReader is available.
 *
 * @type {Boolean}
 */
export const FILE_READER = "FileReader" in window;

/**
 * Canvas is available.
 *
 * @type {Boolean}
 */
export const CANVAS = !!document.createElement("canvas").getContext;

// local storage
let locStor = true;

try {
	window.localStorage;
}
catch (err) {
	locStor = false;
}

/**
 * Local storage is available.
 *
 * @type {Boolean}
 */
export const LOCAL_STORAGE = locStor;

/**
 * Media queries are available.
 *
 * @type {Boolean}
 */
export const MEDIA_QUERY = "matchMedia" in window && "matches" in window.matchMedia("(min-width: 500px)");

// mouse wheel event name
let mouseWheel = "DOMMouseScroll";

if ("onwheel" in window) {
	mouseWheel = "wheel";
}
else if ("onmousewheel" in window) {
	mouseWheel = "mousewheel";
}

/**
 * Event name for mouse wheel.
 *
 * @type {String}
 */
export const MOUSE_WHEEL_EVENT_NAME = mouseWheel;
