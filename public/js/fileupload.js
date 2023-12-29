const articlesUploadEndpoint = "../../api/files/articles/upload";
const sampleArticleJson = {
  title: "MY_TITLE",
  body: "MY_BODY",
  date: "2022-05-20T05:38:12Z",
  image: ".\\data\\images\\256\\chuttersnap-9cCeS9Sg6nU-unsplash.jpg",
};
const infoContainer = document.querySelector("#infoContainer");
const publicCheckbox = document.querySelector(".public-checkbox");

function uploadFile() {
  const fileInput = document.getElementById("jsonFile");
  const file = fileInput.files[0];

  if (file && file.type === "application/json") {
    const container = document.querySelector("#infoContainer");
    container.innerHTML = "";
    const formData = new FormData();
    formData.append("jsonFile", file);
    fetch(articlesUploadEndpoint, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: getBearerToken(),
        userid: getId(),
        isPublic: publicCheckbox.checked,
      },
    })
      .then((response) => {
        if (response.ok) {
          const container = document.querySelector("#infoContainer");
          container.innerHTML = "JSON file uploaded successfully!";
          response.json().then((json) => {
            if (json?.id) {
              const container = document.querySelector("#infoContainer");
              container.innerHTML = `JSON file uploaded successfully!. <br/><a href="/article.html?id=${json?.id}" >
                <button id="btnArticle" data-testid="article" class="button-primary" style="margin:2px;">Visit uploaded article</button>
              </a>`;
            }
          });
        } else {
          const container = document.querySelector("#infoContainer");
          container.innerHTML = "<div class='error-msg'>JSON file upload failed.</div>";
          response.json().then((json) => {
            const container = document.querySelector("#infoContainer");
            container.innerHTML = `<div class="error-msg">JSON file upload failed. <br/>${json?.error?.message}</div>`;
          });
        }
      })
      .catch((error) => {
        console.error("Error uploading JSON file:", error);
        const container = document.querySelector("#infoContainer");
        container.innerHTML = '<div class="error-msg">JSON file upload failed.</div>';
      });

    fileInput.value = "";
  } else {
    const container = document.querySelector("#infoContainer");
    container.innerHTML = '<div class="warning-msg">⚠️ Please select a valid JSON file.</div>';
  }
}

function loadIframe(filelist) {
  if (filelist?.toLowerCase() === "true") {
    const iframe = document.getElementById("uploadedFilesIframe");
    iframe.setAttribute("src", `./partial-uploadedfiles.html`);
  }
}

const attachEventHandlers = (user_id) => {
  document.querySelector("#btnDownloadSampleJson").onclick = () => {
    download("sample_article.json", sampleArticleJson);
  };
};

attachEventHandlers(getId());
const filelist = getParams()["filelist"];
loadIframe(filelist);

checkIfFeatureEnabled("feature_files").then((isEnabled) => {
  if (!isEnabled) {
    const container = document.querySelector("#warning");
    container.innerHTML = "<div class='warning-msg'><b>⚠️ This feature is not enabled ⚠️</b><br/><br/></div>";
    const uploadBtn = document.querySelector("#uploadBtn2");
    uploadBtn.disabled = true;
  }
});
