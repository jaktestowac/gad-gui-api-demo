const uploadedFilesEndpoint = "../../api/files/uploaded";
const uploadedPublicFilesEndpoint = "../../api/files/uploaded/public";

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

function populateTable(table, data) {
  while (table.rows.length > 1) {
    table.deleteRow(1);
  }
  data.forEach((item) => {
    const row = table.insertRow();

    const nameCell = row.insertCell(0);
    nameCell.textContent = item.name;
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
      populateTable(publicTable, filesData);
    })
    .catch((err) => {
      console.log("Error", err);
    });
}

setInterval(makeRequest, intervalValue);

makeRequest();
