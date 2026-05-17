(function () {
  "use strict";

  // Minimal common helpers placeholder to avoid 404s.
  var GT = (window.GT = window.GT || {});

  GT.log = function () {
    // no-op logger to keep compatibility with pages that expect it
    if (window.console && window.console.log) {
      // keep commented to avoid noisy logs in tests
      // console.log.apply(console, arguments);
    }
  };

  GT.onReady = function (fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  };
})();
