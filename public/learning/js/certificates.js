async function displayCertificates() {
  const certificatesContainer = document.querySelector(".certificates-list");

  try {
    const certificates = await api.getCurrentUserCertificates();

    if (certificates.length === 0) {
      certificatesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-certificate fa-3x"></i>
                    <h3>No Certificates Yet</h3>
                    <p>Complete courses to earn certificates</p>
                    <a href="dashboard.html" class="primary-button">Browse Courses</a>
                </div>
            `;
      return;
    }

    certificatesContainer.innerHTML = certificates
      .map(
        (cert) => `
            <div class="certificate-card">
                <div class="certificate-content">
                    <div class="certificate-header">
                        <i class="fas fa-award"></i>
                        <h3>Certificate of Completion</h3>
                    </div>
                    <div class="certificate-details">
                        <h4>${cert.courseTitle}</h4>
                        <p>Awarded to: ${cert.recipientName}</p>
                        <p>Issue Date: ${new Date(cert.issueDate).toLocaleDateString()}</p>
                        <p>Certificate ID: ${cert.certificateNumber}</p>
                        <p>Issued by: ${cert.issuedBy}</p>
                    </div>
                    <div class="certificate-actions">
                        <button class="primary-button" onclick="downloadCertificate('${cert.certificateNumber}')">
                            <i class="fas fa-download"></i> Download PDF
                        </button>
                        <button class="primary-button" onclick="shareCertificate('${cert.certificateNumber}')">
                            <i class="fas fa-share"></i> Share
                        </button>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Failed to load certificates:", error);
    certificatesContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load certificates. Please try again later.</p>
            </div>
        `;
  }
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
        <i class="fas ${type === "error" ? "fa-exclamation-circle" : "fa-info-circle"}"></i>
        <span>${message}</span>
    `;

  // Create or get notification container
  let container = document.querySelector(".notification-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "notification-container";
    document.body.appendChild(container);
  }

  container.appendChild(notification);

  // Remove notification after delay
  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function downloadCertificate(certificateId) {
  showNotification("Download functionality coming soon!", "info");
}

function shareCertificate(certificateId) {
  showNotification("Share functionality coming soon!", "info");
}

document.addEventListener("DOMContentLoaded", displayCertificates);
