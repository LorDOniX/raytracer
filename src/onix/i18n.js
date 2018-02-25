/**
 * Language support, string translation with support for message format syntax.
 * 
 * @class $i18n
 */

import * as $http from "./http";
import * as $common from "./common";

/**
 * Czech alphabet with diacritic.
 * 
 * @type {String}
 * @memberof $i18n
 */
const CZECH_ALPHABET = "aábcččdďeěéfghiíjklmnoópqrřtsštťuůúvwxyz";

export default class $i18n {
	constructor(conf) {
		/**
		 * Conf with delimeters.
		 * 
		 * @type {Object}
		 */
		this._conf = Object.assign({
			leftDelimeter: "{",
			rightDelimeter: "}"
		}, conf);

		/**
		 * All langs data.
		 *
		 * @type {Object}
		 * @memberof $i18n
		 * @private
		 */
		this._langs = {};

		/**
		 * Current language-
		 *
		 * @type {String}
		 * @memberof $i18n
		 * @private
		 */
		this._currentLang = "";
	}

	/**
	 * Get text function. Translate for the current language and the key.
	 *
	 * @param  {String} key
	 * @param  {Object} [replace] Replace all {} in the string
	 * @return {String}
	 * @memberof $i18n
	 * @method _
	 */
	_(key, replace) {
		let lObj = this._langs[this._currentLang];
		let translate = key || "";

		if (lObj) {
			let parts = key.split(".");
			let len = parts.length;

			parts.every((item, ind) => {
				if (item in lObj) {
					lObj = lObj[item];

					if (ind == len - 1) {
						translate = lObj;

						return false;
					}
				}
				else {
					return false;
				}

				// go on
				return true;
			});
		}

		return this._transReplace(translate, replace);
	}

	/**
	 * Add a new language.
	 *
	 * @param {String} lang Language key
	 * @param {Object} data
	 * @memberof $i18n
	 * @method addLanguage
	 */
	addLanguage(lang, data) {
		if (!lang || !data) return;

		if (!this._langs[lang]) {
			this._langs[lang] = {};
		}

		// merge
		Object.keys(data).forEach(key => {
			this._langs[lang][key] = data[key];
		});
	}

	/**
	 * Add a new language from the structured file - lang.key.key2 = { langKey: trans, langKey2: another trans... }
	 *
	 * @param {Array[String]} langs All language variations
	 * @param {Object} data
	 * @memberof $i18n
	 * @method addStructuredLanguage
	 */
	addStructuredLanguage(langs, data) {
		langs.forEach(langKey => {
			this.addLanguage(langKey, this._getLanguage(data, {}, null, langKey));
		});
	}

	/**
	 * Set new language by his key.
	 *
	 * @param {String} lang Language key
	 * @memberof $i18n
	 * @method setLanguage
	 */
	setLanguage(lang) {
		this._currentLang = lang || "";
	}

	/**
	 * Get current language key.
	 *
	 * @return {String} Language key
	 * @memberof $i18n
	 * @method getLanguage
	 */
	getLanguage(lang) {
		return this._currentLang;
	}

	/**
	 * Get all languages keys.
	 *
	 * @return {Array[String]} Languages keys
	 * @memberof $i18n
	 * @method getAllLanguages
	 */
	getAllLanguages(lang) {
		return Object.keys(this._langs);
	}

	/**
	 * Load language from the file.
	 *
	 * @param  {String} lang Language key
	 * @param  {String} url  Path to the file
	 * @return {Promise}
	 * @memberof $i18n
	 * @method loadLanguage
	 */
	loadLanguage(lang, url) {
		return new Promise((resolve, reject) => {
			$http.createRequest({
				url: url
			}).then(okData => {
				this.addLanguage(lang, okData.data);

				resolve();
			}, errorData => {
				reject(errorData);
			});
		});
	}

	/**
	 * Compare two strings with czech diacritic.
	 * 
	 * @param  {String} a String to compare
	 * @param  {String} b String to compare
	 * @return {Number} Results
	 * @memberof $i18n
	 */
	compareCzech(a, b) {
		a = a.toLowerCase();
		b = b.toLowerCase();

		let short = Math.min(a.length, b.length);
		let output = 0;

		for (let i = 0; i < short; i++) {
			let as = CZECH_ALPHABET.indexOf(a[i]);
			let bs = CZECH_ALPHABET.indexOf(b[i]);

			if (as < bs) {
				return -1;
			}
			else if (as > bs) {
				return 1;
			}
		}

		return output;
	}

	/**
	 * Replace translated text by object. This functions is implementation of message format object replace inside the string.
	 *
	 * @param  {String} translate
	 * @param  {Object} [replace] Replace all {} in the string
	 * @return {String}
	 * @memberof $i18n
	 * @private
	 */
	_transReplace(translate, replace) {
		translate = translate || "";
		replace = replace || {};

		// message format delimeters
		let replaceParts = $common.match(translate, this._conf.leftDelimeter, this._conf.rightDelimeter);

		if (replaceParts.length) {
			let finalReplace = {};

			replaceParts.forEach(part => {
				let parts = part.split(",");

				if (!parts.length) return;

				// first is variable name
				let name = parts.shift().trim();
				let multiPartsObj = {};
				let multiParts = parts.join(" ").match(/[a-zA-Z0-9_]+{[^}]*}/g);

				if (multiParts) {
					multiParts.forEach(mpart => {
						let mpartSplits = mpart.match(/([a-zA-Z0-9_]+){([^}]*)/);

						multiPartsObj[mpartSplits[1].trim()] = mpartSplits[2].trim();
					});
				}

				let replaceValue = name in replace ? replace[name] : "";

				if (typeof replaceValue === "number" && Object.keys(multiPartsObj).length) {
					let multiKey;

					switch (replaceValue) {
						case 1:
							multiKey = "one";
							break;

						case 2:
						case 3:
						case 4:
							multiKey = "few";
							break;

						default:
							multiKey = "other";
					}

					replaceValue = multiKey in multiPartsObj ? multiPartsObj[multiKey] : "";
				}

				finalReplace[this._conf.leftDelimeter + part + this._conf.rightDelimeter] = replaceValue;
			});

			Object.keys(finalReplace).forEach(key => {
				translate = this._replaceAll(translate, key, finalReplace[key]);
			});
		}

		return translate;
	}

	/**
	 * Add a new language from the structured file - this function parses one lang from the data object.
	 * It si recursive.
	 *
	 * @param {Object} curObj Current data object - read
	 * @param {Object} langObj Current lang object - write
	 * @param {Function} setFn Callback function for set a value
	 * @param {String} langKey Current language key
	 * @memberof $i18n
	 * @method _getLanguage
	 */
	_getLanguage(curObj, langObj, setFn, langKey) {
		if ($common.isObject(curObj)) {
			Object.keys(curObj).forEach(curKey => {
				let value = curObj[curKey];

				if (typeof value === "string" && curKey == langKey) {
					if (setFn) {
						setFn(value);
					}
					else {
						langObj[curKey] = value;
					}
				}
				else if ($common.isObject(value)) {
					if (!(curKey in langObj)) {
						langObj[curKey] = {};
					}

					let newSetFn = value => {
						langObj[curKey] = value;
					};

					this._getLanguage(curObj[curKey], langObj[curKey], newSetFn, langKey);
				}
			});
		}

		return langObj;
	}

	/**
	 * Replace all occurences inside string.
	 * 
	 * @param  {String} source Source string
	 * @param  {String} search Lookup phrase
	 * @param  {String} replacement Replace phrase
	 * @return {String}
	 */
	_replaceAll(source, search, replacement) {
		return source.split(search).join(replacement);
	}
}
