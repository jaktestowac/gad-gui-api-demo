// Get the form element
const form = document.getElementById("registerForm");
const pictureListEndpoint = "../../api/images/user";
let picList = [];

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
  let birthdate = document.querySelector(".datepicker").value;
  try {
    birthdate = `${new Date(birthdate).toISOString()}`.split(".")[0] + "Z";
  } catch (ex) {
    // TODO:INVOKE_BUG: nothing is done in case of invalid birth date
  }
  const userData = {
    firstname: document.querySelector(".firstname").value,
    lastname: document.querySelector(".lastname").value,
    email: document.querySelector(".email").value,
    password: document.querySelector(".password").value,
    birthdate,
    avatar: `.\\data\\users\\${document.querySelector(".avatar").value}`,
  };

  fetch("/api/users", {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
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
          window.location.href = "/login/";
        }, 3000);
      } else {
        showMessage(`User not created! ${data.error?.message}`, true);
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

//create new instance of octavalidate
let formVal = new octaValidate("registerForm");
formVal.customRule("DATE", /^\d{4}-\d{2}-\d{2}$/, "Date must be in format YYYY-MM-DD");
//attach event listener
document.querySelector("#registerForm").addEventListener("submit", function (e) {
  e.preventDefault();
  //invoke the validate method
  if (formVal.validate() === true) {
    //validation successful
    sendData();
  } else {
    //validation failed
  }
});
