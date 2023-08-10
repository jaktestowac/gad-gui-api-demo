const downloadXlsx = (filename, data) => {
  var workbook = XLSX.utils.book_new(),
    worksheet = XLSX.utils.aoa_to_sheet(data);
  workbook.SheetNames.push("UserData");
  workbook.Sheets["UserData"] = worksheet;
  XLSX.writeFile(workbook, filename);
};

const download = (filename, data) => {
  let text = "NO DATA";
  if (filename.includes("csv")) {
    text = jsonToCSV(data);
  } else if (filename.includes("json")) {
    text = JSON.stringify(data, null, 4);
  }

  var element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

function generatePDF(filename, elementId) {
  const element = document.getElementById(elementId);
  var opt = {
    margin: 1,
    filename: filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 1 },
    jsPDF: { unit: "mm", format: "a3", orientation: "portrait" },
  };
  // Docs: https://github.com/eKoopmans/html2pdf.js
  html2pdf().set(opt).from(element).save();
}
