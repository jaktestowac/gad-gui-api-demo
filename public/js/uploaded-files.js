const uploadedFilesEndpoint = "../../api/uploads";

const intervalValue = 20000;
const table = document.getElementById("fileTable");

async function getUploadedFiles() {
  const url = `${uploadedFilesEndpoint}`;
  const files = await fetch(url, { headers: formatHeaders() }).then((r) => r.json());
  const filesData = files;
  return filesData;
}

function populateTable(data) {
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
  getUploadedFiles()
    .then((filesData) => {
      console.log("Obtained:", filesData.length);
      if (filesData.length === undefined) {
        filesData = [];
      }
      filesData.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
      populateTable(filesData);
    })
    .catch((err) => {
      console.log("Error", err);
    });
}

setInterval(makeRequest, intervalValue);

makeRequest();
