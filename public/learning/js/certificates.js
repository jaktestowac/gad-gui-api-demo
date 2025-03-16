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
            <div class="certificate-card" id="${cert.uuid}">
                <div class="certificate-content">
                    <div class="certificate-header">
                        <i class="fas fa-award"></i>
                        <h3>Certificate of Completion</h3>
                    </div>
                    <div class="certificate-details">
                        <h4>${cert.courseTitle}</h4>
                        <p><i class="fas fa-user"></i> ${cert.recipientName}</p>
                        <p><i class="fas fa-calendar"></i> ${new Date(cert.issueDate).toLocaleDateString()}</p>
                        <p><i class="fas fa-hashtag"></i> ${cert.certificateNumber}</p>
                        <p><i class="fas fa-chalkboard-teacher"></i> &nbsp; ${cert.issuedBy}</p>
                    </div>
                    <div class="certificate-actions">
                        <button class="primary-button" onclick="viewFullCertificate('${cert.uuid}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="primary-button" onclick="shareCertificate('${cert.uuid}')">
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

  let container = document.querySelector(".notification-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "notification-container";
    document.body.appendChild(container);
  }

  container.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

async function shareCertificate(certificateUuid) {
  try {
    const shareLink = `${window.location.origin}/learning/public-certificate.html?id=${certificateUuid}`;
    await navigator.clipboard.writeText(shareLink);
    showNotification("Share link copied to clipboard!", "success");
  } catch (error) {
    showNotification("Failed to generate share link", "error");
  }
}

function viewFullCertificate(certificateUuid) {
  const modal = document.getElementById("certificateModal");
  const frame = document.getElementById("certificateFrame");
  frame.src = `public-certificate.html?id=${certificateUuid}&view=account`;
  modal.style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = document.getElementById("certificateModal");
  const frame = document.getElementById("certificateFrame");
  modal.style.display = "none";
  frame.src = "";
  document.body.style.overflow = "auto";
}

document.addEventListener("click", (event) => {
  const modal = document.getElementById("certificateModal");
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

document.addEventListener("DOMContentLoaded", displayCertificates);
