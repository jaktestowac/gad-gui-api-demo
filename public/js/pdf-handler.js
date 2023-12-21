function generateChartPDF(filename) {
  generatePDF(filename, "tableChart");
}

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
