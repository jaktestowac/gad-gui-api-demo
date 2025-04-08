let browsebutton = document.getElementById("browsebutton");
let input = document.getElementById("dragdropfile");
const dropArea = document.getElementById("dropzone");
const dragText = document.getElementById("dragdropheader");
let files = [];
let fileContents = [];

function refreshDragAndDrop() {
  dragText.innerHTML = files.length > 0 ? `${files.length} file(s) ready` : "Drag & Drop";
  dropArea.classList.toggle("has-files", files.length > 0);
}

const attachEventHandlers = () => {
  browsebutton.onclick = () => {
    input.click();
  };

  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropArea.addEventListener(eventName, highlight, false);
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, unhighlight, false);
  });

  dropArea.addEventListener("drop", handleDrop, false);

  input.addEventListener("change", function () {
    handleFiles(Array.from(this.files));
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight(e) {
    dropArea.classList.add("highlight");
    dragText.innerHTML = "Release to Upload";
  }

  function unhighlight(e) {
    dropArea.classList.remove("highlight");
    refreshDragAndDrop();
  }

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const newFiles = Array.from(dt.files);
    handleFiles(newFiles);
  }

  function handleFiles(newFiles) {
    newFiles.forEach((file) => {
      if (!files.find((f) => f.name === file.name)) {
        handleFile(file);
      }
    });
    refreshDragAndDrop();
  }

  function handleFile(file) {
    let fileType = file.type;
    let validExtensions = ["application/json"];
    const container = document.querySelector("#filesContainer");

    if (validExtensions.includes(fileType)) {
      files.push(file);

      const fileDiv = document.createElement("div");
      fileDiv.className = "file-item-v2";
      fileDiv.innerHTML = `
        <span>${file.name}</span>
        <button class="remove-file-v2" data-filename="${file.name}">×</button>
      `;
      container.appendChild(fileDiv);

      file.text().then((data) => {
        fileContents.push({ name: file.name, content: data });
        document.querySelector("#uploadBtn").disabled = false;
      });
    } else {
      const errorDiv = document.createElement("div");
      errorDiv.className = "simpleErrorBox";
      errorDiv.innerHTML = `⚠️ Invalid file type for "${file.name}"! Must be JSON`;
      container.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 3000);
    }
  }

  document.querySelector("#filesContainer").addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-file-v2")) {
      const filename = e.target.dataset.filename;
      files = files.filter((f) => f.name !== filename);
      fileContents = fileContents.filter((f) => f.name !== filename);
      e.target.parentElement.remove();
      refreshDragAndDrop();
      document.querySelector("#uploadBtn").disabled = files.length === 0;
    }
  });

  document.querySelector("#uploadBtn").onclick = () => {
    handleCreate();
    refreshDragAndDrop();
    document.querySelector("#uploadBtn").disabled = true;
    const container = document.querySelector("#filesContainer");
    container.innerHTML = "";
    files = [];
    fileContents = [];
  };
};

function handleCreate() {
  const resultsElement = document.getElementById("results-container");
  let result = "Files uploaded!<br/><br/>";

  fileContents.forEach((file) => {
    const trimmedContent = file.content.length > 128 ? file.content.substring(0, 128) + "..." : file.content;
    result += `${file.name}:<br/>${trimmedContent}<br/><br/>`;
  });

  resultsElement.innerHTML = result;
}
