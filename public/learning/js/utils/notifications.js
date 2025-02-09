function showNotification(message, type = "info") {
  const container = document.querySelector(".notification-container") || createNotificationContainer();

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
        <i class="fas ${type === "error" ? "fa-exclamation-circle" : "fa-check-circle"}"></i>
        <span>${message}</span>
    `;

  container.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => {
      notification.remove();
      if (container.children.length === 0) {
        container.remove();
      }
    }, 300);
  }, 3000);
}

function createNotificationContainer() {
  const container = document.createElement("div");
  container.className = "notification-container";
  document.body.appendChild(container);
  return container;
}

window.notifications = { show: showNotification };
