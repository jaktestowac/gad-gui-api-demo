const uploadedFilesEndpoint = "../../api/files/articles/uploaded";
const uploadedPublicFilesEndpoint = "../../api/files/articles/uploaded/public";
const downloadPublicFilesEndpoint = "../../api/files/articles/download/";

const intervalValue = 20000;
const userTable = document.getElementById("userFileTable");
const publicTable = document.getElementById("publicFileTable");

async function getUserUploadedFiles() {
  const url = `${uploadedFilesEndpoint}?userId=${getId()}`;
  const files = await fetch(url, { headers: formatHeaders() }).then((r) => r.json());
  const filesData = files;
  return filesData;
}

async function getPublicUploadedFiles() {
  const url = `${uploadedPublicFilesEndpoint}`;
  const files = await fetch(url, { headers: formatHeaders() }).then((r) => r.json());
  const filesData = files;
  return filesData;
}

async function downloadFile(fileName) {
  const url = `${downloadPublicFilesEndpoint}${fileName}`;
  const fileRawData = await fetch(url, { headers: formatHeaders() }).then((r) => r.json());
  const filesData = JSON.stringify(fileRawData, null, 2);
  download(fileName, filesData);
}

const download = (filename, data) => {
  var element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(data));
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

function populateTable(table, data, addDownloadLink) {
  while (table.rows.length > 1) {
    table.deleteRow(1);
  }
  data.forEach((item) => {
    const row = table.insertRow();

    const nameCell = row.insertCell(0);
    nameCell.textContent = item.name;

    if (addDownloadLink) {
      // var link = `<div class="fileDownloadLink" onclick="downloadFile('${item.name}')" >${item.name}</div>`;
      // nameCell.innerHTML = link;
      nameCell.innerHTML = item.name;
    } else {
      nameCell.innerHTML = item.name;
    }
    nameCell.style.textAlign = "center";
    nameCell.style.fontSize = "14px";

    const sizeCell = row.insertCell(1);
    sizeCell.textContent = item.size;
    sizeCell.style.textAlign = "center";
    sizeCell.style.fontSize = "14px";

    const dateCell = row.insertCell(2);
    const lastModified = new Date(item.lastModified);
    dateCell.textContent = lastModified.toISOString();
    dateCell.style.textAlign = "center";
    dateCell.style.fontSize = "14px";
    if (addDownloadLink) {
      const downloadCell = row.insertCell(3);
      downloadCell.textContent = item.size;
      downloadCell.style.textAlign = "center";
      downloadCell.style.fontSize = "14px";
      downloadCell.innerHTML = `<div class="fileDownloadLink" onclick="downloadFile('${item.name}')" >📥</div>`;
    }
  });
}

async function makeRequest() {
  getUserUploadedFiles()
    .then((filesData) => {
      console.log("Obtained:", filesData.length);
      if (filesData.length === undefined) {
        filesData = [];
      }
      filesData.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
      populateTable(userTable, filesData);
    })
    .catch((err) => {
      console.log("Error", err);
    });
  getPublicUploadedFiles()
    .then((filesData) => {
      console.log("Obtained:", filesData.length);
      if (filesData.length === undefined) {
        filesData = [];
      }
      filesData.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
      populateTable(publicTable, filesData, true);
    })
    .catch((err) => {
      console.log("Error", err);
    });
}

setInterval(makeRequest, intervalValue);

makeRequest();
