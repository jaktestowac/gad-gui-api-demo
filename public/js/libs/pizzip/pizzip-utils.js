/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./es6/index.js":
/*!**********************!*\
  !*** ./es6/index.js ***!
  \**********************/
/***/ ((module) => {

eval("\n\nvar PizZipUtils = {};\n// just use the responseText with xhr1, response with xhr2.\n// The transformation doesn't throw away high-order byte (with responseText)\n// because PizZip handles that case. If not used with PizZip, you may need to\n// do it, see https://developer.mozilla.org/En/Using_XMLHttpRequest#Handling_binary_data\nPizZipUtils._getBinaryFromXHR = function (xhr) {\n  // for xhr.responseText, the 0xFF mask is applied by PizZip\n  return xhr.response || xhr.responseText;\n};\n\n// taken from jQuery\nfunction createStandardXHR() {\n  try {\n    return new window.XMLHttpRequest();\n  } catch (e) {}\n}\nfunction createActiveXHR() {\n  try {\n    return new window.ActiveXObject(\"Microsoft.XMLHTTP\");\n  } catch (e) {}\n}\n\n// Create the request object\nvar createXHR = window.ActiveXObject ?\n/* Microsoft failed to properly\n* implement the XMLHttpRequest in IE7 (can't request local files),\n* so we use the ActiveXObject when it is available\n* Additionally XMLHttpRequest can be disabled in IE7/IE8 so\n* we need a fallback.\n*/\nfunction () {\n  return createStandardXHR() || createActiveXHR();\n} :\n// For all other browsers, use the standard XMLHttpRequest object\ncreateStandardXHR;\nPizZipUtils.getBinaryContent = function (path, callback) {\n  /*\n   * Here is the tricky part : getting the data.\n   * In firefox/chrome/opera/... setting the mimeType to 'text/plain; charset=x-user-defined'\n   * is enough, the result is in the standard xhr.responseText.\n   * cf https://developer.mozilla.org/En/XMLHttpRequest/Using_XMLHttpRequest#Receiving_binary_data_in_older_browsers\n   * In IE <= 9, we must use (the IE only) attribute responseBody\n   * (for binary data, its content is different from responseText).\n   * In IE 10, the 'charset=x-user-defined' trick doesn't work, only the\n   * responseType will work :\n   * http://msdn.microsoft.com/en-us/library/ie/hh673569%28v=vs.85%29.aspx#Binary_Object_upload_and_download\n   *\n   * I'd like to use jQuery to avoid this XHR madness, but it doesn't support\n   * the responseType attribute : http://bugs.jquery.com/ticket/11461\n   */\n  try {\n    var xhr = createXHR();\n    xhr.open(\"GET\", path, true);\n\n    // recent browsers\n    if (\"responseType\" in xhr) {\n      xhr.responseType = \"arraybuffer\";\n    }\n\n    // older browser\n    if (xhr.overrideMimeType) {\n      xhr.overrideMimeType(\"text/plain; charset=x-user-defined\");\n    }\n    xhr.onreadystatechange = function (evt) {\n      var file, err;\n      // use `xhr` and not `this`... thanks IE\n      if (xhr.readyState === 4) {\n        if (xhr.status === 200 || xhr.status === 0) {\n          file = null;\n          err = null;\n          try {\n            file = PizZipUtils._getBinaryFromXHR(xhr);\n          } catch (e) {\n            err = new Error(e);\n          }\n          callback(err, file);\n        } else {\n          callback(new Error(\"Ajax error for \" + path + \" : \" + this.status + \" \" + this.statusText), null);\n        }\n      }\n    };\n    xhr.send();\n  } catch (e) {\n    callback(new Error(e), null);\n  }\n};\nmodule.exports = PizZipUtils;\n\n//# sourceURL=webpack://PizZipUtils/./es6/index.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./es6/index.js");
/******/ 	window.PizZipUtils = __webpack_exports__;
/******/ 	
/******/ })()
;