class VideoPlayer {
  constructor() {
    this.duration = 0;
    this.currentTime = 0;
    this.isPlaying = false;
    this.timer = null;

    this.initializeElements();
    this.setupEventListeners();
    this.listenForParentMessages();

    window.parent.postMessage({ type: "ready" }, "*");
  }

  initializeElements() {
    this.player = document.querySelector(".custom-video-player");
    this.playBtn = this.player.querySelector(".play-btn");
    this.progress = this.player.querySelector(".video-progress-inner");
    this.timeDisplay = this.player.querySelector(".video-time");
    this.videoMessage = this.player.querySelector(".video-message");
    this.videoScreen = this.player.querySelector(".video-screen");
  }

  setupEventListeners() {
    this.videoScreen.addEventListener("click", () => this.togglePlayback());
    this.playBtn.addEventListener("click", () => this.togglePlayback());

    this.player.querySelector(".video-progress").addEventListener("click", (e) => {
      const rect = e.target.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      this.seekTo(pos);
    });
  }

  listenForParentMessages() {
    window.addEventListener("message", (event) => {
      const { type, data } = event.data;
      switch (type) {
        case "initialize":
          this.duration = parseInt(data.duration) || 0;
          this.durationStr = data.durationStr;
          this.currentTime = 0;
          this.updateProgress();
          break;
      }
    });
  }

  togglePlayback() {
    if (!this.isPlaying) {
      this.play();
    } else {
      this.pause();
    }
    window.parent.postMessage({ type: "playbackChanged", isPlaying: this.isPlaying }, "*");
  }

  play() {
    this.isPlaying = true;
    this.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    this.videoMessage.classList.add("playing");
    this.startTimer();
  }

  pause() {
    this.isPlaying = false;
    this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
    this.videoMessage.classList.remove("playing");
    this.stopTimer();
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.currentTime = Math.min(this.currentTime + 1, this.duration);
      this.updateProgress();

      if (this.currentTime >= this.duration) {
        this.stop();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  stop() {
    this.pause();
    this.playBtn.innerHTML = '<i class="fas fa-redo"></i>';
  }

  seekTo(position) {
    this.currentTime = Math.floor(position * this.duration);
    this.updateProgress();
    window.parent.postMessage(
      {
        type: "seeked",
        currentTime: this.currentTime,
        duration: this.duration,
      },
      "*"
    );
  }

  updateProgress() {
    const percent = (this.currentTime / this.duration) * 100;
    this.progress.style.width = `${percent}%`;

    this.timeDisplay.textContent = `${this.formatTime(this.currentTime)} / ${this.durationStr}`;

    window.parent.postMessage(
      {
        type: "timeUpdate",
        currentTime: this.currentTime,
        duration: this.duration,
      },
      "*"
    );
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
}

const player = new VideoPlayer();
