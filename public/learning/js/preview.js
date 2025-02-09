document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const courseId = parseInt(params.get("id"));
  const lessonId = parseInt(params.get("lesson")) || 0;

  if (!courseId) {
    window.location.href = "dashboard.html";
    return;
  }

  try {
    const course = await api.getCourseById(courseId);
    if (!course) throw new Error("Course not found");

    const courseHeader = document.getElementById("courseHeader");
    courseHeader.innerHTML = `
            <h1>${course.title}</h1>
            <div class="course-meta">
                <span><i class="fas fa-user"></i> ${course.instructor}</span>
                <span><i class="fas fa-clock"></i> ${course.duration}</span>
                <span><i class="fas fa-signal"></i> ${course.level}</span>
                <span><i class="fas fa-users"></i> ${course.students} student(s)</span>
            </div>
            <p class="course-description">${course.description}</p>
        `;

    const lessons = await api.getLessons(courseId);
    const previewLessons = lessons.slice(0, 2);
    const previewContent = document.getElementById("previewContent");

    const currentLesson = previewLessons[lessonId];
    const lessonContent = currentLesson ? await renderLessonContent(currentLesson) : "";

    previewContent.innerHTML = `
            <div class="preview-info">
                <h2>Course Preview</h2>
                <p>Get a taste of this course with these free preview lessons</p>
            </div>
            <div class="lessons-container">
                <div class="lessons-sidebar">
                    ${previewLessons
                      .map(
                        (lesson, index) => `
                        <div class="lesson-item ${lessonId === index ? "active" : ""}" 
                             onclick="window.location.href='preview.html?id=${courseId}&lesson=${index}'">
                            <div class="lesson-info">
                                <span class="lesson-title">
                                    <i class="fas fa-${
                                      lesson.type === "video"
                                        ? "play-circle"
                                        : lesson.type === "reading"
                                        ? "book"
                                        : "question-circle"
                                    }"></i>
                                    ${lesson.title}
                                </span>
                                <span class="lesson-duration">${lesson.duration}</span>
                            </div>
                        </div>
                    `
                      )
                      .join("")}
                    <div class="locked-content">
                        <h3>🔒 ${lessons.length - 2} More Lessons Available</h3>
                        <p>Sign in to access the full course content</p>
                        <div class="cta-buttons">
                            <a href="login.html" class="primary-button">Sign In</a>
                            <a href="register.html" class="primary-button">Create Account</a>
                        </div>
                    </div>
                </div>
                <div class="lesson-content-area">
                    ${lessonContent}
                </div>
            </div>
        `;

    window.addEventListener("message", (event) => {
      const iframe = document.querySelector("iframe.custom-video-player");
      if (iframe && event.source === iframe.contentWindow) {
        if (event.data.type === "ready") {
          iframe.contentWindow.postMessage(
            {
              type: "initialize",
              data: {
                duration: currentLesson.duration,
                durationStr: currentLesson.duration,
              },
            },
            "*"
          );
        }
      }
    });
  } catch (error) {
    console.error("Error loading preview:", error);
    document.getElementById("previewContent").innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load course preview. Please try again later.</p>
            </div>
        `;
  }
});

let messageHandler = null;

function parseDuration(timeStr) {
  const [minutes, seconds] = timeStr.split(":").map(Number);
  return minutes * 60 + seconds;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

async function renderLessonContent(lesson) {
  if (messageHandler) {
    window.removeEventListener("message", messageHandler);
  }

  switch (lesson.type) {
    case "video":
      messageHandler = (event) => {
        const iframe = document.querySelector("iframe.custom-video-player");
        if (iframe && event.source === iframe.contentWindow) {
          if (event.data.type === "ready") {
            iframe.contentWindow.postMessage(
              {
                type: "initialize",
                data: {
                  duration: parseDuration(lesson.duration),
                  durationStr: lesson.duration,
                },
              },
              "*"
            );
          }
        }
      };

      window.addEventListener("message", messageHandler);

      return `
        <div>
          <iframe 
            src="/learning/video-player.html" 
            frameborder="0" 
            class="custom-video-player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          ></iframe>
          <div class="video-time-display" style="display:none;">${lesson.duration}</div>
          <h3>${lesson.title}</h3>
          <div align="center">
            <a href="login.html" class="primary-button">
              <i class="fas fa-lock"></i> Sign in to track progress
            </a>
          </div>
        </div>`;

    case "reading":
      return `
                <div class="lesson-content reading-content">
                    <h3>${lesson.title}</h3>
                    <div class="content-text">
                        ${lesson.content.text}
                    </div>
                    <div class="resources">
                        <h4>Additional Resources:</h4>
                        <ul>
                            ${lesson.content.resources
                              .map((resource) => `<li><i class="fas fa-file-alt"></i> ${resource}</li>`)
                              .join("")}
                        </ul>
                    </div>
                </div>`;

    default:
      return `
                <div class="lesson-content">
                    <h3>${lesson.title}</h3>
                    <p>Duration: ${lesson.duration}</p>
                    <div class="content-placeholder">
                        <p>Preview content not available for this lesson type.</p>
                    </div>
                </div>`;
  }
}
