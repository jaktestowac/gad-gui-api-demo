let browsebutton = document.getElementById("browsebutton");
let input = document.getElementById("dragdropfile");
const dropArea = document.getElementById("dropzone");
const dragText = document.getElementById("dragdropheader");
let files = [];
let fileContents = [];

function refreshDragAndDrop() {
  dragText.innerHTML = files.length > 0 ? `${files.length} image(s) ready` : "Drag & Drop";
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
    dropArea.style.borderColor = "#3498db";
    dropArea.style.backgroundColor = "rgba(52, 152, 219, 0.1)";
    dragText.innerHTML = "Release to Upload";
  }

  function unhighlight(e) {
    dropArea.classList.remove("highlight");
    dropArea.style.borderColor = "";
    dropArea.style.backgroundColor = "";
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
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    const container = document.querySelector("#previewContainer");

    if (validTypes.includes(file.type)) {
      files.push(file);

      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = () => {
        const previewDiv = document.createElement("div");
        previewDiv.className = "preview-item-v3";
        previewDiv.innerHTML = `
          <img src="${reader.result}" alt="${file.name}" class="preview-image-v3"/>
          <div class="preview-info-v3">
            <span>${file.name}</span>
            <button class="remove-file-v3" data-filename="${file.name}">×</button>
          </div>
        `;
        container.appendChild(previewDiv);
        fileContents.push({ name: file.name, content: reader.result });
        document.querySelector("#uploadBtn").disabled = false;
      };
    } else {
      const errorDiv = document.createElement("div");
      errorDiv.className = "simpleErrorBox";
      errorDiv.innerHTML = `⚠️ Invalid file type for "${file.name}"! Must be JPG, PNG, or GIF`;
      container.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 3000);
    }
  }

  document.querySelector("#previewContainer").addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-file-v3")) {
      const filename = e.target.dataset.filename;
      files = files.filter((f) => f.name !== filename);
      fileContents = fileContents.filter((f) => f.name !== filename);
      e.target.closest(".preview-item-v3").remove();
      refreshDragAndDrop();
      document.querySelector("#uploadBtn").disabled = files.length === 0;
    }
  });

  document.querySelector("#uploadBtn").onclick = () => {
    handleCreate();
    refreshDragAndDrop();
    document.querySelector("#uploadBtn").disabled = true;
    document.querySelector("#previewContainer").innerHTML = "";
    files = [];
    fileContents = [];
  };
};

function handleCreate() {
  const resultsElement = document.getElementById("results-container");

  fileContents.forEach((file) => {
    const existingImage = Array.from(resultsElement.querySelectorAll(".image-caption-v3")).find(
      (caption) => caption.textContent === file.name
    );

    if (!existingImage) {
      const imgContainer = document.createElement("div");
      imgContainer.className = "result-image-container-v3";
      imgContainer.innerHTML = `
        <img src="${file.content}" alt="${file.name}" class="result-image-v3"/>
        <div class="image-caption-v3">${file.name}</div>
      `;
      resultsElement.appendChild(imgContainer);
    }
  });
}
