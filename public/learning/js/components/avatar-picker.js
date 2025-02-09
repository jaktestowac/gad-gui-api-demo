class AvatarPicker {
  constructor(containerId, onSelect) {
    this.container = document.getElementById(containerId);
    this.onSelect = onSelect;
    this.selectedAvatar = null;
    this.avatars = [];
    this.avatarList = []; // Store the full list of avatars
  }

  async getPictureList() {
    const picList = await Promise.all(
      ["/api/images/user"].map((url) => fetch(url, { headers: formatHeaders() }).then((r) => r.json()))
    );
    return picList[0];
  }

  async loadAvatars() {
    try {
      const data = await this.getPictureList();
      if (Array.isArray(data)) {
        this.avatarList = data;
        this.selectRandomAvatar();
      } else {
        console.error("Invalid avatar data format:", data);
        this.selectedAvatar = "/data/icons/user.png";
        this.render();
      }
    } catch (error) {
      console.error("Failed to load avatars:", error);
      this.selectedAvatar = "/data/icons/user.png";
      this.render();
    }
  }

  selectRandomAvatar() {
    const randomIndex = Math.floor(Math.random() * this.avatarList.length);
    this.selectedAvatar = `..\\data\\users\\${this.avatarList[randomIndex]}`;
    this.onSelect(this.selectedAvatar);
    this.render();
  }

  render() {
    this.container.innerHTML = `
            <div class="avatar-display">
                <img src="${this.selectedAvatar}" alt="Avatar" class="avatar-image">
                <button type="button" class="randomize-avatar-btn">
                    <i class="fas fa-random"></i>
                    New Avatar
                </button>
                <input type="hidden" name="avatar" value="${this.selectedAvatar}">
            </div>
        `;

    // Add click handler for randomize button
    this.container.querySelector(".randomize-avatar-btn").addEventListener("click", () => {
      this.selectRandomAvatar();
    });
  }

  getSelectedAvatar() {
    return this.selectedAvatar;
  }
}

window.AvatarPicker = AvatarPicker;
