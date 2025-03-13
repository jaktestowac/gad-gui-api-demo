class NotificationService {
  constructor() {
    this.createContainer();
  }

  createContainer() {
    this.container = document.createElement("div");
    this.container.className = "notification-container";
    document.body.appendChild(this.container);
  }

  show(message, type = "error") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
            <i class="fas ${type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}"></i>
            <span>${message}</span>
        `;

    this.container.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("fade-out");
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
}

window.notifications = new NotificationService();
