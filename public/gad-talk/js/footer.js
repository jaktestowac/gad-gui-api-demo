(function () {
  try {
    var y = new Date().getFullYear();
    var els = document.querySelectorAll(".gt-year");
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = y;
    }
  } catch (e) {
    // ignore
  }
})();
