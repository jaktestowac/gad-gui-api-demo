const FILE_TYPE = "application/json";
let fileContent = "";
const articlesEndpoint = "../../api/articles";
const sampleArticleJson = {
  title: "MY_TITLE",
  body: "MY_BODY",
  date: "2022-05-20T05:38:12Z",
  image: ".\\data\\images\\256\\chuttersnap-9cCeS9Sg6nU-unsplash.jpg",
};
const infoContainer = document.querySelector("#infoContainer");
let browsebutton = document.getElementById("browsebutton");
let input = document.getElementById("dragdropfile");
const dropArea = document.getElementById("dropzone");
const dragText = document.getElementById("dragdropheader");
let file;

const handleCreate = () => {
  const today = new Date();
  const date = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}T${pad(
    today.getHours()
  )}:${pad(today.getMinutes())}:${pad(today.getSeconds())}Z`;

  try {
    fileContent = JSON.parse(fileContent);
  } catch (e) {
    fileContent = {};
  }
  fileContent.date = date;
  fileContent.id = undefined;
  fileContent.user_id = getId();
  issueArticleRequest(fileContent);
};

const issueArticleRequest = (data) => {
  // create data on the server:
  fetch(articlesEndpoint, {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      response.json().then((data) => {
        document.querySelector("#uploadBtn").disabled = true;
        const container = document.querySelector("#infoContainer");
        if (response.status === 201) {
          container.innerHTML = `Article created! <br/>Read it <strong><a href="../article.html?id=${data.id}">here</a></strong>!`;
        } else {
          container.innerHTML = `Article was not created! ${data.error?.message}`;
        }
      });
      return response;
    })
    .then((response) => {
      if (response.error !== undefined) {
        const container = document.querySelector("#infoContainer");
        container.innerHTML = `Article was not created! ${response.error.message}`;
      }
      document.querySelector("#uploadBtn").disabled = true;
    });
};

const showResponse = (response) => {
  if (response.status === 201) {
    showMessage("Article was created", false);
  } else {
    showMessage("Article was not created", true);
  }
};

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

function pad(num, size = 2) {
  num = num.toString();
  while (num.length < size) num = "0" + num;
  return num;
}

function refreshDragAndDrop() {
  dragText.innerHTML = "Drag & Drop";
}

const attachEventHandlers = (user_id) => {
  document.querySelector("#btnDownloadSampleJson").onclick = () => {
    download("sample_article.json", sampleArticleJson);
  };

  if (user_id === undefined) {
    return;
  }

  browsebutton.onclick = () => {
    input.click();
  };

  input.addEventListener("change", function () {
    refreshDragAndDrop();
    file = this.files[0];
    dropArea.classList.add("active");
    handleFile(file);
  });
  dropArea.addEventListener("dragover", (event) => {
    refreshDragAndDrop();
    event.preventDefault();
    dropArea.classList.add("active");
    dragText.innerHTML = "Release to Upload";
  });
  dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("active");
    refreshDragAndDrop();
  });
  dropArea.addEventListener("drop", (event) => {
    refreshDragAndDrop();
    event.preventDefault();
    file = event.dataTransfer.files[0];
    handleFile(file);
  });

  function handleFile(file) {
    let fileType = file.type;
    let validExtensions = ["application/json"];
    if (validExtensions.includes(fileType)) {
      dragText.innerHTML = "File ready";
      let fileReader = new FileReader();

      fileReader.readAsDataURL(file);
      const container = document.querySelector("#infoContainer");
      container.innerHTML = `File "${file.name}" ready`;
      file.text().then((data) => {
        fileContent = data;
      });
      document.querySelector("#uploadBtn").disabled = false;
    } else {
      const container = document.querySelector("#infoContainer");
      container.innerHTML = `<div class="warning-msg">⚠️ Invalid file type! Must be ${FILE_TYPE}</div>`;
      document.querySelector("#uploadBtn").disabled = true;
      dropArea.classList.remove("active");
    }
  }

  document.querySelector("#uploadBtn").onclick = () => {
    handleCreate();
  };
};

attachEventHandlers(getId());
