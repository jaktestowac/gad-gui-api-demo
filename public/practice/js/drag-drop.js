let browsebutton = document.getElementById("browsebutton");
let input = document.getElementById("dragdropfile");
const dropArea = document.getElementById("dropzone");
const dragText = document.getElementById("dragdropheader");
let file;
let fileContent;

function refreshDragAndDrop() {
  dragText.innerHTML = "Drag & Drop";
}

const attachEventHandlers = () => {
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
      container.innerHTML = `<div class="simpleErrorBox">⚠️ Invalid file type! Must be JSON</div>`;
      document.querySelector("#uploadBtn").disabled = true;
      dropArea.classList.remove("active");
    }
  }

  document.querySelector("#uploadBtn").onclick = () => {
    handleCreate();
    refreshDragAndDrop();
    document.querySelector("#uploadBtn").disabled = true;
    const container = document.querySelector("#infoContainer");
    container.innerHTML = ``;
  };
};

function handleCreate() {
  const resultsElement = document.getElementById("results-container");

  const trimmedContent = fileContent.length > 256 ? fileContent.substring(0, 256) + "..." : fileContent;
  resultsElement.innerHTML = `File uploaded! <br/><br/>${trimmedContent}`;
}
