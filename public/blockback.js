history.pushState(null, null, location.href);
window.onpopstate = function () {
  history.go(1);
};
