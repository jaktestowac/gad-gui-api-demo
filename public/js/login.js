const urlParams = new URLSearchParams(window.location.search);
const redirectURL = urlParams.get("redirectURL");
if (redirectURL) {
  document.getElementById("redirectURL").value = redirectURL;
}
