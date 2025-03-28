// Get the form element
const form = document.getElementById("registerForm");
const pictureListEndpoint = "../../api/images/user";
let picList = [];

// get redirect link from url:
const urlParams = new URLSearchParams(window.location.search);
const redirectLink = urlParams.get("redirectURL");
const defaultRedirectLink = "/login/";

// Add 'submit' event handler
form.addEventListener("submit", (event) => {
  event.preventDefault();

  // sendData();
});

let alertElement = document.querySelector(".alert");
const showMessage = (message, isError = false) => {
  alertElement.innerHTML = message;
  alertElement.classList.remove("alert-error", "alert-success");
  if (isError) {
    alertElement.classList.add("alert-error");
  } else {
    alertElement.classList.add("alert-success");
  }
  var newMessageElement = alertElement.cloneNode(true);
  alertElement.parentNode.replaceChild(newMessageElement, alertElement);
  alertElement = newMessageElement;
};

function sendData() {
  let birthDate = document.querySelector(".datepicker").value;
  try {
    birthDate = getISODateStringWithTimezoneOffsetFromString(birthDate);
  } catch (ex) {
    // TODO:INVOKE_BUG: nothing is done in case of invalid birth date
  }
  const userData = {
    firstname: document.querySelector(".firstname").value,
    lastname: document.querySelector(".lastname").value,
    email: document.querySelector(".email").value,
    password: document.querySelector(".password").value,
    birthDate,
    avatar: `.\\data\\users\\${document.querySelector(".avatar").value}`,
  };

  const captchaInput = document.querySelector(".captcha-input");

  const captchaData = {};
  let captchaAsBase64 = undefined;
  if (captchaInput !== null) {
    captchaData.uuid = captchaInput.getAttribute("uuid");
    captchaData.result = captchaInput.value;
    captchaAsBase64 = jsonToBase64(captchaData);
  }

  fetch("/api/users", {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      captcha: captchaAsBase64,
    },
    body: JSON.stringify(userData),
  }).then((response) => {
    response.json().then((data) => {
      if (response.status === 201) {
        var button = document.querySelector("#registerButton");
        button.disabled = true;
        button.classList.add("disabled");

        showMessage("User created", false);
        setTimeout(function () {
          window.location.href = redirectLink ?? defaultRedirectLink;
        }, 3000);
      } else {
        showMessage(`User not created! ${data.error?.message}`, true);
        if (response.headers.get("captcha") !== null) {
          try {
            Function(`generateCaptcha();`)();
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Error while trying to generate captcha.", e);
          }
        }
      }
    });
    return response;
  });
}

function presentPicture() {
  let userPicture = document.querySelector(".userPicture");
  userPicture.src = `.\\data\\users\\${document.querySelector(".avatar").value}`;
}

async function getPictureList() {
  picList = await Promise.all([pictureListEndpoint].map((url) => fetch(url).then((r) => r.json())));
  picList = picList[0];
  picList.sort(function () {
    return 0.5 - Math.random();
  });
  for (let element of picList) {
    var opt = document.createElement("option");
    opt.value = element;
    opt.innerHTML = element; // whatever property it has

    document.querySelector(".avatar").appendChild(opt);
  }
  presentPicture();
}

getPictureList();

checkIfFeatureEnabled("strict_surname_validation").then((isEnabled) => {
  const surnameInput = document.querySelector("#lastname");

  if (surnameInput === null) {
    return;
  }

  if (isEnabled) {
    surnameInput.setAttribute("octavalidate", "R,SURNAME_V2");
  } else {
    surnameInput.setAttribute("octavalidate", "R,SURNAME");
  }
});

// attach event listener
document.querySelector("#registerForm").addEventListener("submit", function (e) {
  // create new instance of octavalidate
  let formVal = new octaValidate("registerForm");
  formVal.customRule("DATE", /^\d{4}-\d{2}-\d{2}$/, "Date must be in format YYYY-MM-DD");

  // const surnameRegexp = /^[A-Z]{1}[a-zA-Z-]{0,}[a-z]{1}$/;
  const surnameRegexp = /^[a-zA-Z\s]{1,}$/;
  formVal.customRule("SURNAME", surnameRegexp, "Please enter only letter.");

  // const surnameRegexp = /^[A-Z]{1}[a-zA-Z-]{0,}[a-z]{1}$/;
  const surnameRegexp_v2 = /^[A-Z]{1}[a-zA-Z\s-]{1,}$/;
  formVal.customRule(
    "SURNAME_V2",
    surnameRegexp_v2,
    "Please enter only letter or hyphen. Must start with capital letter"
  );
  e.preventDefault();
  //invoke the validate method
  if (formVal.validate() === true) {
    //validation successful
    sendData();
  } else {
    //validation failed
  }
});
