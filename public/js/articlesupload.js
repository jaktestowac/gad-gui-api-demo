const FILE_TYPE = "application/json";
let fileContent = "";
const articlesEndpoint = "../../api/articles";
const articlesUploadEndpoint = "../../api/articles/upload";
const sampleArticleJson = {
  title: "MY_TITLE",
  body: "MY_BODY",
  date: "2022-05-20T05:38:12Z",
  image: ".\\data\\images\\256\\chuttersnap-9cCeS9Sg6nU-unsplash.jpg",
};

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

const attachEventHandlers = (user_id) => {
  document.querySelector("#btnDownloadSampleJson").onclick = () => {
    download("sample_article.json", sampleArticleJson);
  };

  if (user_id === undefined) {
    return;
  }
  var dropzone = document.getElementById("dropzone");

  if (dropzone) {
    dropzone.ondrop = function (e) {
      e.preventDefault();
      this.className = "dropzone";
    };

    dropzone.ondragover = function () {
      this.className = "dropzone dragover";
      return false;
    };

    dropzone.ondragleave = function () {
      this.className = "dropzone";
    };

    dropzone.ondrop = function (event) {
      const [item] = event.dataTransfer.items;
      const itemData = item.getAsFile();
      itemData.text().then((data) => {
        if (itemData.type === FILE_TYPE) {
          const container = document.querySelector("#infoContainer");
          container.innerHTML = `File "${itemData.name}" ready`;
          fileContent = data;
          document.querySelector("#uploadBtn").disabled = false;
        } else {
          const container = document.querySelector("#infoContainer");
          container.innerHTML = `Invalid file type! Must be ${FILE_TYPE}`;
          document.querySelector("#uploadBtn").disabled = true;
        }
      });
    };

    document.querySelector("#uploadBtn").onclick = () => {
      handleCreate();
    };
    event.preventDefault();
    this.className = "dropzone";
  }
};

attachEventHandlers(getId());

function uploadFile() {
  const fileInput = document.getElementById("jsonFile");
  const file = fileInput.files[0];
  if (file && file.type === "application/json") {
    const formData = new FormData();
    formData.append("jsonFile", file);

    fetch(articlesUploadEndpoint, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: getBearerToken(),
        userid: getId(),
      },
    })
      .then((response) => {
        if (response.ok) {
          const container = document.querySelector("#infoContainer");
          container.innerHTML = "JSON file uploaded successfully!";
          response.json().then((json) => {
            const container = document.querySelector("#infoContainer");
            container.innerHTML = `JSON file uploaded successfully!. <br/><a href="/article.html?id=${json?.id}" >
            <button id="btnArticle" data-testid="article" class="button-primary" style="margin:2px;">Visit uploaded article</button>
          </a>`;
          });
        } else {
          const container = document.querySelector("#infoContainer");
          container.innerHTML = "JSON file upload failed.";
          response.json().then((json) => {
            const container = document.querySelector("#infoContainer");
            container.innerHTML = `JSON file upload failed. <br/>${json?.error?.message}`;
          });
        }
      })
      .catch((error) => {
        console.error("Error uploading JSON file:", error);
        const container = document.querySelector("#infoContainer");
        container.innerHTML = "JSON file upload failed.";
      });
  } else {
    const container = document.querySelector("#infoContainer");
    container.innerHTML = "Please select a valid JSON file.";
  }
}
