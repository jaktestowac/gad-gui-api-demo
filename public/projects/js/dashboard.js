let simpleSuccessBox = "simpleSuccessBox";
let simpleErrorBox = "simpleErrorBox";
let simpleInfoBox = "simpleInfoBox";

if (!isAuthenticated()) {
  const dashboardInfo = document.getElementById("dashboard-info");
  setBoxMessage(
    dashboardInfo,
    `You are not authenticated<br/>
    Please <a href="/login" class="btn btn-primary">login</a> or <a href="/register.html" class="btn btn-primary">register</a>`,
    simpleInfoBox
  );
}
