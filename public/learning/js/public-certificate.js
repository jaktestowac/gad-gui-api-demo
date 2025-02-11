async function displayPublicCertificate() {
  const params = new URLSearchParams(window.location.search);
  const certificateId = params.get("id");
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

document.addEventListener("DOMContentLoaded", displayPublicCertificate);
