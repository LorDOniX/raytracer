/**
 * Class for creating img previews from File[] variable.
 * 
 * @module $previewImages
 */

import * as $image from "../image";
import * as $dom from "../dom";
import { multipleJobs } from "../job";
import $loader from "./loader";

/**
 * Main function for showing img previews.
 * 
 * @param  {HTMLElement} el Placeholder element
 * @param  {File[]} files
 * @param  {Object} [opts] Configuration
 * @param  {Number} [opts.maxSize = 0] Max image size in px; the size is used for image scale
 * @param  {Number} [opts.count = 0] How many images are processed simultinously
 * @param  {Boolean} [opts.createHolder = false] Create placeholder, see _createPreviewHolders function
 * @return  {Boolean} Images will be shown?
 */
export default function(el, files, optsArg) {
	// clear previous
	el.innerHTML = "";

	// add class
	el.classList.add("preview-images");

	let opts = {
		maxSize: 0,
		count: 0,
		createHolder: false
	};

	let dom = {
		previewItems: el
	};

	for (let key in optsArg) {
		opts[key] = optsArg[key];
	}

	let pictureFiles = $image.getPictureFiles(files);
	let count = pictureFiles.length;

	if (count) {
		// create placeholder?
		if (opts.createHolder) {
			_createPreviewHolders(el, count, dom);
		}

		let jobsArray = [];

		// sort by name, make previewID - only for 7 pictures
		pictureFiles = pictureFiles.sort((a, b) => {
			if (a.name < b.name)
				return -1;
			else if (a.name > b.name)
				return 1;
			else 
				return 0;
		}).forEach((pf, ind) => {
			jobsArray.push({
				task: _jobTask,
				args: [{
					file: pf,
					previewID: "img_0" + ind
				}, opts.maxSize, dom]
			});
		});

		// run jobs array
		multipleJobs(jobsArray, opts.count);

		return true;
	}
	else {
		return false;
	}
};

/**
 * Create one image preview.
 *
 * @private
 * @param  {File} file
 * @param  {Number} [maxSize] Max image size
 * @return {Object} dom references
 */
function _createPreview(file, maxSize) {
	let exported = {};

	let cont = $dom.create({
		el: "span",
		class: ["preview-item", "preview-loading"],
		child: [{
			el: "span",
			class: "canvas-cover",
			child: $loader.getSpinner(true),
			style: "height: " + (maxSize || 100) + "px",
			_exported: "canvasCover"
		}, {
			el: "span",
			class: "title",
			innerHTML: file.name.replace(/\..*/g, "")
		}]
	}, exported);

	return {
		cont: cont,
		canvasCover: exported.canvasCover
	};
};

/**
 * Create preview holders. Only for images count 4 and 7.
 * Four images are in the one row, seven images has the last one above them.
 *
 * @private
 * @param {HTMLElement} el
 * @param {Number} count
 * @param {Object} dom
 */
function _createPreviewHolders(el, count, dom) {
	if (!el || (count != 4 && count != 7)) return;

	let exported = {};

	// placeholder for 7 images
	if (count == 7) {
		// ceiling line
		el.appendChild($dom.create({
			el: "div",
			child: {
				el: "span",
				_exported: "img_06"
			}
		}, exported));
	}

	let child = [];
	let childCount = count == 7 ? 6 : 4;

	for (let i = 0; i < childCount; i++) {
		child.push({
			el: "span",
			_exported: "img_0" + i
		});
	}

	// rest line
	el.appendChild($dom.create({
		el: "div",
		child: child
	}, exported));

	for (let i = 0; i < count; i++) {
		dom["img_0" + i] = exported["img_0" + i];
	}
};

/**
 * One job task
 *
 * @private
 * @param  {Object} previewObj Object with file and preview ID
 * @param  {Number} maxSize Max image size in px
 * @param  {Function} jobDone Function which indicates that job is done
 * @param  {Object} dom Object with DOM elements
 */
function _jobTask(previewObj, maxSize, dom, jobDone) {
	let file = previewObj.file;
	let previewID = previewObj.previewID;
	let preview = _createPreview(file, maxSize);
	
	// append
	if (previewID in dom) {
		dom[previewID].appendChild(preview.cont);
	}
	else {
		dom.previewItems.appendChild(preview.cont);
	}

	$image.readFromFile(file, maxSize).then(readFileObj => {
		preview.cont.classList.remove("preview-loading");
		preview.canvasCover.innerHTML = "";
		preview.canvasCover.appendChild(readFileObj.canvas);

		jobDone();
	});
};
