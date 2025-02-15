async function displayPublicCertificate() {
  const params = new URLSearchParams(window.location.search);
  const certificateId = params.get("id");
  const viewType = params.get("view");
  const container = document.getElementById("certificateContainer");

  if (!certificateId) {
    container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>No certificate ID provided.</p>
            </div>
        `;
    return;
  }

  if (viewType === "account") {
    document.querySelector("#back-button").style.display = "none";
  } else {
    document.querySelector("#get-pdf").style.display = "none";
  }

  try {
    const cert = await api.getPublicCertificate(certificateId);
    container.innerHTML = `
        <div class="certificate-card">
            <div class="certificate-content">
                
                <div class="certificate-header">
                    <i class="fas fa-award"></i>
                    <h3 class="certificate-title">Certificate of Completion</h3>
                    <p class="certificate-subtitle">This is to certify that</p>
                </div>
                
                <div class="certificate-details">
                    <p class="recipient">${cert.recipientName}</p>
                    <p>has successfully completed</p>
                    <h4>${cert.courseTitle}</h4>
                    
                    <div class="cert-meta-container">
                        <span class="cert-meta">
                            <i class="fas fa-signal"></i> ${cert.courseLevel}
                        </span>
                        <span class="cert-meta">
                            <i class="fas fa-clock"></i> ${cert.courseDuration}
                        </span>
                    </div>
                    
                    <div class="certificate-footer">
                        <p class="certificate-date">
                            <i class="fas fa-calendar-alt"></i> 
                            Issued on ${new Date(cert.issueDate).toLocaleDateString()}
                        </p>
                        <div class="signature">
                            <div class="signature-line"></div>
                            <p>${cert.issuedBy}</p>
                            <small>${cert.issuerTitle}</small>
                        </div>
                        <p class="certificate-id">
                            <small>Certificate ID: ${cert.certificateNumber}</small>
                        </p>
                    </div>
                </div>
                
                <div class="cert-seal">
                    <div class="cert-seal-rays"></div>
                </div>
            </div>
        </div>
    `;
    // Generate QR code
    const qrCodeContainer = document.getElementById("qrCodeContainer");

    const textForQR = `${window.location.origin}/public/certificate?id=${certificateId}`;

    const qrCode = new QRCode(qrCodeContainer, {
      text: textForQR,
      width: 256,
      height: 256,
    });
  } catch (error) {
    container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Certificate Not Found</h3>
                <p>The certificate you are looking for could not be found or has expired.</p>
            </div>
        `;
  }
}

async function downloadCertificate() {
  const certificateElement = document.querySelector(".certificate-card");
  if (!certificateElement) {
    showNotification("Certificate not found", "error");
    return;
  }

  try {
    const canvas = await html2canvas(certificateElement.querySelector(".certificate-content"), {
      scale: 4,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    const certificateId = new URLSearchParams(window.location.search).get("id");
    pdf.save(`GAD_Certificate_${certificateId}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF");
  }
}

document.addEventListener("DOMContentLoaded", displayPublicCertificate);
