function getCookieUserName() {
  let firstname = undefined;
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith("firstname=")) {
      firstname = cookie.split("=")[1];
    }
  }
  return firstname;
}

let firstname = getCookieUserName();

const loginBtnElement = document.querySelector("#loginBtn");
const logoutBtnElement = document.querySelector("#logoutBtn");
const registerBtnElement = document.querySelector("#registerBtn");

if (firstname !== undefined && firstname.length > 0) {
  loginBtnElement.innerHTML = "My account";
  logoutBtnElement.innerHTML = "Logout";
  logoutBtnElement.style.visibility = "visible";
  logoutBtnElement.style.padding = "12px 16px";
  registerBtnElement.innerHTML = "";
  registerBtnElement.style.visibility = "hidden";
  registerBtnElement.style.padding = "0px 0px";
} else {
  loginBtnElement.innerHTML = "Login";
  logoutBtnElement.innerHTML = "";
  logoutBtnElement.style.visibility = "hidden";
  logoutBtnElement.style.padding = "0px 0px";
}

const usernameElement = document.querySelector("#username");
if (firstname !== undefined && firstname.length > 0) {
  usernameElement.innerHTML = `Hello ${firstname}!`;
} else {
  usernameElement.innerHTML = "";
}
