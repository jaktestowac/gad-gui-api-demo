class VideoPlayer {
  constructor() {
    this.duration = 0;
    this.currentTime = 0;
    this.isPlaying = false;
    this.timer = null;
    this.playbackSpeed = 1;

    this.activeAnimations = {
      timeouts: new Set(),
      promises: new Set(),
      frames: new Set(),
    };

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

    const codeSnippets = [
      [
        { text: "function learnCoding() {", type: "function" },
        { text: "  const skills = ['HTML', 'CSS', 'JavaScript'];", type: "variable" },
        { text: "  // Start learning journey", type: "comment" },
        { text: "  for (let i = 0; i < skills.length; i++) {", type: "control" },
        { text: "    practice(skills[i]);", type: "call" },
        { text: "  }", type: "control" },
        { text: "}", type: "function" },
      ],
      [
        { text: "async function testPage() {", type: "function" },
        { text: "  const browser = await playwright.launch();", type: "variable" },
        { text: "  const page = await browser.newPage();", type: "variable" },
        { text: "  await page.goto('https://example.com');", type: "call" },
        { text: "  await expect(page).toHaveTitle(/Example/);", type: "assertion" },
        { text: "  await browser.close();", type: "call" },
        { text: "}", type: "function" },
      ],
      [
        { text: "const App = () => {", type: "function" },
        { text: "  const [data, setData] = useState([]);", type: "variable" },
        { text: "  useEffect(() => {", type: "hook" },
        { text: "    fetchData().then(setData);", type: "call" },
        { text: "  }, []);", type: "hook" },
        { text: "  return <List items={data} />;", type: "jsx" },
        { text: "};", type: "function" },
      ],
      [
        { text: "test.describe('List component', () => {", type: "function" },
        { text: "  test('list items', async ({ page }) => {", type: "function" },
        { text: "    expect(page.getByRole('list')).toBeVisible();", type: "assertion" },
        { text: "    expect(page.getByTestId('list-item')).toBeVisible();", type: "assertion" },
        { text: "  });", type: "function" },
        { text: "});", type: "function" },
      ],
      [
        { text: "// Owls are not what they seem", type: "comment" },
        { text: "", type: "empty" },
        { text: "const owl = {", type: "variable" },
        { text: "  name: 'Hoot',", type: "variable" },
        { text: "  age: 5,", type: "variable" },
        { text: "  color: 'brown',", type: "variable" },
        { text: "};", type: "variable" },
        { text: "", type: "empty" },
        { text: "console.log(owl.name);", type: "call" },
      ],
      [
        { text: "import { test, expect } from '@playwright/test';", type: "import" },
        { text: "", type: "empty" },
        { text: "test.describe('Articles - Viewer Role', () => {", type: "function" },
        { text: "  test('User can view articles', async ({ page }) => {", type: "function" },
        { text: "    // Arrange", type: "comment" },
        { text: "    await page.goto('/articles.html');", type: "call" },
        { text: "", type: "empty" },
        { text: "    // Assert - 6 articles are displayed", type: "comment" },
        { text: "    await expect(page.locator('.card-wrapper')).toHaveCount(6);", type: "assertion" },
        { text: "", type: "empty" },
        { text: "    // Act - Click on the first article", type: "comment" },
        { text: "    await page.locator('.card-wrapper').nth(0).click();", type: "call" },
        { text: "", type: "empty" },
        { text: "    // Assert - Article title and body are visible", type: "comment" },
        { text: "    await expect(page.getByTestId('article-title')).toBeVisible();", type: "assertion" },
        { text: "    await expect(page.getByTestId('article-body')).toBeVisible();", type: "assertion" },
        { text: "  });", type: "function" },
        { text: "});", type: "function" },
      ],
    ];

    const animationHtml = `
      <div class="video-animation">
        <div class="video-overlay">
          <i class="fas fa-play play-icon" aria-label="Play video" title="Play video"></i>
        </div>
        <div class="code-window">
          <div class="code-header">
            <div class="window-button close"></div>
            <div class="window-button minimize"></div>
            <div class="window-button maximize"></div>
          </div>
          <div class="code-content" id="codeContent"></div>
          <div class="status-bar">
            <span class="file-type">JavaScript</span>
            <div class="typing-indicator">
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
            </div>
          </div>
          
        </div>
      </div>
    `;

    const waveAnimation = this.videoMessage.querySelector(".wave-animation");
    if (waveAnimation) {
      waveAnimation.innerHTML = animationHtml;
      this.setupCodeAnimation(codeSnippets);
    }

    setTimeout(() => {
      const codeLines = document.querySelectorAll(".code-line");
      codeLines.forEach((line, index) => {
        line.style.animationDelay = `${index * 0.3}s`;
      });
    }, 100);
  }

  setupEventListeners() {
    this.videoScreen.addEventListener("click", () => this.togglePlayback());
    this.playBtn.addEventListener("click", () => this.togglePlayback());

    this.player.querySelector(".video-progress").addEventListener("click", async (e) => {
      const rect = e.target.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      this.seekTo(pos);

      // After seeking, update the code animation to a random state
      if (this.isPlaying) {
        this.stopCodeAnimation();
        await this.clearCodeContent();
        this.startCodeAnimation();
      }
    });

    document.querySelectorAll(".speed-control").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const speed = parseFloat(e.target.dataset.speed);
        this.setPlaybackSpeed(speed);

        document.querySelectorAll(".speed-control").forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
      });
    });
  }

  async clearCodeContent() {
    if (this.codeContent) {
      this.codeContent.innerHTML = "";
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  listenForParentMessages() {
    window.addEventListener("message", (event) => {
      const { type, data } = event.data;
      switch (type) {
        case "initialize": {
          this.duration = parseInt(data.duration) || 0;
          this.currentTime = 0;
          this.updateProgress();
          break;
        }
      }
    });
  }

  togglePlayback() {
    if (this.currentTime >= this.duration) {
      this.currentTime = 0;
      this.updateProgress();
      this.play();
    } else if (!this.isPlaying) {
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
    this.videoScreen.style.background = "#282c34"; // Change to code editor background
    document.querySelector(".video-overlay").classList.remove("visible");
    this.startTimer();
    this.startCodeAnimation();
  }

  pause() {
    this.isPlaying = false;
    this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
    this.videoScreen.style.background = "#282c34"; // Keep dark background for code visibility
    document.querySelector(".video-overlay").classList.add("visible");

    // Stop timer but keep animations state
    this.stopTimer();
    this.stopCodeAnimation();

    // Remove clearAnimations() call to keep current code visible
    // this.clearAnimations();

    // No need to reset animation state or file type
  }

  setPlaybackSpeed(speed) {
    this.playbackSpeed = speed;

    // Clear existing timer and start a new one with updated speed
    if (this.isPlaying) {
      this.stopTimer();
      this.startTimer();
    }
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.currentTime = Math.min(this.currentTime + 1 * this.playbackSpeed, this.duration);
      this.updateProgress();

      if (this.currentTime >= this.duration) {
        this.stop();
      }
    }, 1000 / this.playbackSpeed);
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

    this.timeDisplay.textContent = `${this.formatTime(this.currentTime)} / ${this.formatTime(this.duration)}`;

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
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  setupCodeAnimation(codeSnippets) {
    this.codeSnippets = codeSnippets;
    this.currentSnippetIndex = 0;
    this.codeContent = document.getElementById("codeContent");
    this.fileTypes = ["JavaScript", "Playwright", "React"];
    this.isAnimating = false;
  }

  async startCodeAnimation() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.animateNextSnippet();
  }

  stopCodeAnimation() {
    this.isAnimating = false;
  }

  clearAnimations() {
    // Clear all timeouts
    this.activeAnimations.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.activeAnimations.timeouts.clear();

    // Clear all animation frames
    this.activeAnimations.frames.forEach((frame) => cancelAnimationFrame(frame));
    this.activeAnimations.frames.clear();

    // Cancel all promises
    this.activeAnimations.promises.forEach((promise) => promise.reject());
    this.activeAnimations.promises.clear();

    // Clear content
    if (this.codeContent) {
      this.codeContent.innerHTML = "";
    }
  }

  async animateNextSnippet() {
    if (!this.isPlaying || !this.isAnimating) return;

    const frame = requestAnimationFrame(async () => {
      this.activeAnimations.frames.add(frame);

      // Pick a random snippet instead of sequential
      this.currentSnippetIndex = Math.floor(Math.random() * this.codeSnippets.length);
      const snippet = this.codeSnippets[this.currentSnippetIndex];
      document.querySelector(".file-type").textContent = this.fileTypes[this.currentSnippetIndex];

      await this.typeCode(snippet);

      if (this.isAnimating) {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(resolve, 2000);
          this.activeAnimations.timeouts.add(timeout);
        });
      }

      if (this.isAnimating) {
        // Don't increment index since we're picking randomly
        this.animateNextSnippet();
      }

      this.activeAnimations.frames.delete(frame);
    });
  }

  async typeCode(snippet) {
    if (!this.codeContent) return;
    this.codeContent.innerHTML = "";

    for (let i = 0; i < snippet.length; i++) {
      if (!this.isAnimating) break;

      const line = snippet[i];
      const lineEl = document.createElement("div");
      lineEl.className = "code-line";

      const lineNum = document.createElement("span");
      lineNum.className = "line-number";
      lineNum.textContent = (i + 1).toString();
      lineEl.appendChild(lineNum);

      const codeContainer = document.createElement("span");
      lineEl.appendChild(codeContainer);
      this.codeContent.appendChild(lineEl);

      let currentText = "";
      for (const char of line.text) {
        if (!this.isAnimating) break;

        try {
          await new Promise((resolve, reject) => {
            // Apply playback speed to typing animation (25ms base typing speed)
            const timeout = setTimeout(() => resolve(), 25 / this.playbackSpeed);

            // Track the promise and timeout
            const promise = {
              resolve,
              reject: () => {
                clearTimeout(timeout);
                reject(new Error("Animation cancelled"));
              },
            };

            this.activeAnimations.timeouts.add(timeout);
            this.activeAnimations.promises.add(promise);

            // Cleanup function
            promise.cleanup = () => {
              clearTimeout(timeout);
              this.activeAnimations.timeouts.delete(timeout);
              this.activeAnimations.promises.delete(promise);
            };
          });
        } catch (error) {
          if (error.message === "Animation cancelled") {
            break;
          }
          throw error;
        }

        if (!this.isAnimating) break;
        currentText += char;
        codeContainer.innerHTML = this.highlightCode(currentText);
      }

      if (!this.isAnimating) break;

      // Track line delay promise with playback speed
      try {
        await new Promise((resolve, reject) => {
          // Apply playback speed to line delay (100ms base delay)
          const timeout = setTimeout(resolve, 100 / this.playbackSpeed);
          const promise = {
            resolve,
            reject: () => {
              clearTimeout(timeout);
              reject(new Error("Animation cancelled"));
            },
          };
          this.activeAnimations.timeouts.add(timeout);
          this.activeAnimations.promises.add(promise);
        });
      } catch (error) {
        if (error.message === "Animation cancelled") {
          break;
        }
        throw error;
      }
    }
  }

  highlightCode(text) {
    let currentToken = "";
    let inString = false;
    let inComment = false;
    let stringChar = "";
    let result = "";

    const keywords = ["function", "const", "let", "var", "return", "if", "else", "for", "while", "async", "await"];

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // Handle strings
      if ((char === '"' || char === "'" || char === "`") && !inComment) {
        if (inString && char === stringChar) {
          // End of string
          result += `${char}</span>`;
          inString = false;
          currentToken = "";
        } else if (!inString) {
          // Start of string
          result += `<span class="string">${char}`;
          inString = true;
          stringChar = char;
        } else {
          // Inside another type of string
          result += char;
        }
        continue;
      }

      // Handle comments
      if (char === "/" && text[i + 1] === "/" && !inString && !inComment) {
        result += '<span class="comment">//';
        i++; // Skip next character
        inComment = true;
        continue;
      }

      if (inString || inComment) {
        result += char;
        continue;
      }

      // Handle regular tokens
      if (/[a-zA-Z_$]/.test(char)) {
        currentToken += char;
      } else {
        // End of token - check if it's a keyword
        if (currentToken) {
          if (keywords.includes(currentToken)) {
            result += `<span class="keyword">${currentToken}</span>`;
          } else if (text[i] === "(") {
            result += `<span class="function">${currentToken}</span>`;
          } else {
            result += currentToken;
          }
          currentToken = "";
        }

        // Handle operators
        if (/[+\-*/%=<>!&|]/.test(char)) {
          result += `<span class="operator">${char}</span>`;
        } else if (/\d/.test(char)) {
          result += `<span class="number">${char}</span>`;
        } else {
          result += char;
        }
      }
    }

    // Handle any remaining token
    if (currentToken) {
      if (keywords.includes(currentToken)) {
        result += `<span class="keyword">${currentToken}</span>`;
      } else {
        result += currentToken;
      }
    }

    // Close any open comment span
    if (inComment) {
      result += "</span>";
    }

    return result;
  }
}

const player = new VideoPlayer();
