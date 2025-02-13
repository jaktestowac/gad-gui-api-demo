class CourseViewer {
  constructor() {
    // Support both ?id= and ?courseId= URL parameters
    const params = new URLSearchParams(window.location.search);
    this.courseId = parseInt(params.get("id") || params.get("courseId"));
    this.courseName = document.getElementById("courseName");
    this.lessonList = document.getElementById("lessonList");
    this.videoPlayer = document.getElementById("videoPlayer");
    this.lessonMaterials = document.getElementById("lessonMaterials");
    this.quizContainer = document.getElementById("quizContainer");
    this.currentLesson = null;

    if (!this.courseId) {
      window.location.href = "/learning/enrolled-courses.html";
      return;
    }

    this.initialize();
    this.addRatingSection();
    this.loadCourseRatings();
  }

  async initialize() {
    try {
      // Check enrollment first
      const enrollments = await api.getUserEnrollments(api.getUserIdFromCookie());
      const isEnrolled = enrollments.some((e) => e.courseId === this.courseId);
      const instructorCourses = await api.getInstructorCourses();
      const isCourseInstructor = instructorCourses.error? false : instructorCourses.some((c) => c.id === this.courseId);

      if (!isEnrolled && !isCourseInstructor) {
        notifications.show("You are not enrolled in this course", "error");
        setTimeout(() => {
          window.location.href = "/learning/enrolled-courses.html";
        }, 1000);
        return;
      }

      const courses = await api.getCourses();
      const course = courses.find((c) => c.id === this.courseId);

      if (!course) {
        throw new Error("Course not found");
      }

      const lessons = await api.getCourseLessons(this.courseId);

      this.courseName.textContent = course.title;
      this.lessons = lessons;
      this.renderLessonList(lessons);

      // If lessons exist, load the first one
      if (lessons && lessons.length > 0) {
        await this.loadLesson(lessons[0]);
      }
    } catch (error) {
      this.showError(error.message || "Failed to load course content");
    }
  }

  renderLessonList(lessons) {
    this.lessonList.innerHTML = lessons
      .map((lesson) => {
        const safeLesson = {
          id: lesson.id,
          type: lesson.type,
          title: lesson.title,
        };

        return `
                    <div class="lesson-item ${lesson.completed ? "completed" : ""}" 
                         onclick='courseViewer.loadLesson(${JSON.stringify(safeLesson)})'
                         data-lesson-id="${lesson.id}">
                        <i class="fas ${this.getLessonIcon(lesson.type)}"></i>
                        <div class="lesson-info">
                            <span class="lesson-title">${lesson.title}</span>
                            <span class="lesson-duration">
                                ${
                                  lesson.type === "quiz"
                                    ? `${lesson.content?.questions?.length} questions`
                                    : lesson.duration
                                }
                            </span>
                        </div>
                        <i class="fas ${lesson.completed ? "fa-check-circle" : "fa-circle"}"></i>
                    </div>
                `;
      })
      .join("");
  }

  getLessonIcon(type) {
    switch (type) {
      case "video":
        return "fa-play-circle";
      case "reading":
        return "fa-book";
      case "quiz":
        return "fa-question-circle";
      default:
        return "fa-file";
    }
  }

  async loadLesson(lessonInfo) {
    const lessonItems = document.querySelectorAll(".lesson-item");
    lessonItems.forEach((item) => item.classList.remove("loading"));
    const clickedItem = document.querySelector(`[data-lesson-id="${lessonInfo.id}"]`);
    if (clickedItem) clickedItem.classList.add("loading");

    const lessonContent = document.querySelector(".lesson-content");
    lessonContent.classList.add("loading");

    this.videoPlayer.innerHTML = "";
    this.lessonMaterials.innerHTML = "";
    this.quizContainer.innerHTML = "";

    try {
      const lessons = await api.getCourseLessons(this.courseId);
      const fullLesson = lessons.find((l) => l.id === lessonInfo.id);

      if (!fullLesson) {
        throw new Error("Lesson not found");
      }

      const content = await api.getLessonContent(this.courseId, fullLesson.id);

      lessonContent.classList.remove("loading");
      if (clickedItem) clickedItem.classList.remove("loading");

      switch (fullLesson.type) {
        case "video":
          this.renderVideo(fullLesson, content);
          break;
        case "reading":
          this.renderReading(fullLesson, content);
          break;
        case "quiz":
          this.renderQuiz(fullLesson, content);
          break;
      }
    } catch (error) {
      console.error("Failed to load lesson:", error);
      this.showError("Failed to load lesson content.");

      lessonContent.classList.remove("loading");
      if (clickedItem) clickedItem.classList.remove("loading");
    }
  }

  parseDuration(timeStr) {
    // timeStr can be in the format "mm:ss" or "hh:mm:ss"
    const parts = timeStr.split(":");
    if (parts.length === 3) {
      const [hours, minutes, seconds] = parts.map(Number);
      return hours * 3600 + minutes * 60 + seconds;
    } else {
      const [minutes, seconds] = timeStr.split(":").map(Number);
      return minutes * 60 + seconds;
    }
  }

  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  renderVideo(lesson, content) {
    this.currentLesson = lesson;
    this.videoPlayer.innerHTML = `
      <div>
        <iframe 
          src="/learning/video-player.html" 
          frameborder="0" 
          class="custom-video-player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
        ></iframe>
        <div class="video-time-display" style="display:none;">${lesson.duration}</div>
        <h3>${lesson.title}</h3>
        <p class="transcript">${content?.transcript}</p>
        <div align="center">${
          lesson.completed
            ? '<div class="completion-badge"><i class="fas fa-check-circle"></i> Completed</div>'
            : `<button class="primary-button" 
                      onclick="courseViewer.markComplete(this)" data-testid="mark-complete"
                      data-lesson-id="${lesson.id}">
                  Mark as Complete
               </button>`
        }</div>
      </div>
    `;

    const iframe = this.videoPlayer.querySelector("iframe");
    const timeDisplay = this.videoPlayer.querySelector(".video-time-display");

    iframe.onload = () => {
      iframe.contentWindow.postMessage(
        {
          type: "initialize",
          data: {
            duration: this.parseDuration(lesson.duration),
            durationStr: lesson.duration,
          },
        },
        "*"
      );
    };

    window.addEventListener("message", (event) => {
      const { type, currentTime, duration } = event.data;
      if (type === "timeUpdate") {
        timeDisplay.textContent = `${this.formatTime(currentTime)} / ${lesson.duration}`;
      }
    });
  }

  renderReading(lesson, content) {
    this.currentLesson = lesson;
    this.lessonMaterials.innerHTML = `
            <div class="reading-material">
                <h3>${lesson.title}</h3>
                <div class="content">
                    ${content?.text}
                </div>
                <div class="resources">
                    <h4>Additional Resources:</h4>
                    <ul>
                        ${content?.resources.map((r) => `<li>${r}</li>`).join("")}
                    </ul>
                </div>
                <div align="center">${
                  lesson.completed
                    ? '<div class="completion-badge"><i class="fas fa-check-circle"></i> Completed</div>'
                    : `<button class="primary-button" 
                              onclick="courseViewer.markComplete(this)"
                              data-lesson-id="${lesson.id}">
                          Mark as Complete
                       </button>`
                }</div>
            </div>
        `;
  }

  renderQuiz(lesson, content) {
    this.currentLesson = lesson;
    this.quizContainer.innerHTML = `
            <div class="quiz-section">
                <h3>${lesson.title}</h3>
                <p>Number of questions: ${content.questions.length}</p>
                <div align="center">${
                  lesson.completed
                    ? '<div class="completion-badge"><i class="fas fa-check-circle"></i> Quiz Completed</div>'
                    : `<button class="primary-button" onclick="courseViewer.startQuiz(${lesson.id})">
                        Start Quiz
                       </button>`
                }</div>
            </div>
        `;
  }

  async startQuiz(lessonId) {
    const quizContainer = document.getElementById("quizContainer");
    const content = await api.getLessonContent(this.courseId, lessonId);

    const questions = content.questions
      .map(
        (q, index) => `
        <div class="quiz-question">
            <h4>Question ${index + 1}</h4>
            <p>${q.question}</p>
            <div class="quiz-options">
                ${q.options
                  .map(
                    (option, optIndex) => `
                    <label class="quiz-option">
                        <input type="radio" name="q${index}" value="${optIndex}">
                        <span>${option}</span>
                    </label>
                `
                  )
                  .join("")}
            </div>
        </div>
    `
      )
      .join("");

    quizContainer.innerHTML = `
        <div class="quiz-container">
            <h3>${this.currentLesson.title}</h3>
            <form id="quizForm" onsubmit="courseViewer.submitQuiz(event)">
                ${questions}
                <button type="submit" class="primary-button" data-testid="submit-quiz" id="submitQuiz">
                    Submit Quiz
                </button>
            </form>
        </div>
    `;
  }

  async submitQuiz(event) {
    event.preventDefault();
    const form = event.target;
    const answers = Array.from(form.elements)
      .filter((el) => el.type === "radio" && el.checked)
      .map((el) => ({
        questionIndex: parseInt(el.name.replace("q", "")),
        answer: parseInt(el.value),
      }));

    try {
      const content = await api.getLessonContent(this.courseId, this.currentLesson.id);

      let correctAnswers = 0;
      answers.forEach(({ questionIndex, answer }) => {
        if (content.questions[questionIndex].correct === answer) {
          correctAnswers++;
        }
      });

      const score = Math.round((correctAnswers / content.questions.length) * 100);
      const passed = score >= 70;

      const quizContainer = document.getElementById("quizContainer");
      quizContainer.innerHTML = `
        <div class="quiz-result ${passed ? "passed" : "failed"}">
            <i class="fas ${passed ? "fa-check-circle" : "fa-times-circle"}"></i>
            <h3>${passed ? "Congratulations!" : "Try Again"}</h3>
            <p>Your score: ${score}%</p>
            <p>Correct answers: ${correctAnswers} out of ${content.questions.length}</p>
            <p>${passed ? "You have successfully completed this quiz!" : "You need 70% or higher to pass."}</p>
            ${
              !passed
                ? `
                <button class="primary-button" onclick="courseViewer.startQuiz(${this.currentLesson.id})">
                    Retry Quiz
                </button>
            `
                : ""
            }
        </div>
    `;

      if (passed) {
        const lessonItem = document.querySelector(`[data-lesson-id="${this.currentLesson.id}"]`);
        if (lessonItem) {
          lessonItem.classList.add("completed");
          lessonItem.querySelector("i:last-child").classList.replace("fa-circle", "fa-check-circle");
        }
        const button = document.getElementById("submitQuiz");
        this.markComplete(button);
      }
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      alert("Failed to submit quiz. Please try again.");
    }
  }

  async markComplete(button) {
    if (!this.currentLesson) return;

    let originalText = "Mark as Complete";
    if (button !== null) {
      button.disabled = true;
      originalText = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Marking complete...';
    }

    try {
      await api.markLessonComplete(this.courseId, this.currentLesson.id);
      notifications.show("Lesson completed successfully!");

      if (button !== null) {
        button.innerHTML = '<i class="fas fa-check-circle"></i> Completed';
        button.classList.add("completed");
      }

      const lessonItem = document.querySelector(`[data-lesson-id="${this.currentLesson.id}"]`);
      if (lessonItem) {
        lessonItem.classList.add("completed");
        lessonItem.querySelector("i:last-child").classList.replace("fa-circle", "fa-check-circle");
      }

      this.currentLesson.completed = true;

      const progress = await api.getCourseProgress(this.courseId);
      if (progress === 100) {
        try {
          const certificate = await api.generateCertificate(this.courseId);
          if (certificate.success) {
            notifications.show("🎉 Congratulations! You've completed the course and earned a certificate!", "success");
            this.showCongratulations();
          }
        } catch (certError) {
          console.error("Failed to generate certificate:", certError);
        }
      }

      const lessons = await api.getCourseLessons(this.courseId);
      const currentIndex = lessons.findIndex((l) => l.id === this.currentLesson.id);
      const nextLesson = lessons[currentIndex + 1];
      if (nextLesson) {
        setTimeout(() => {
          this.loadLesson(nextLesson);
        }, 1000);
      }
    } catch (error) {
      console.error("Failed to mark lesson as complete:", error);
      if (button !== null) button.innerHTML = originalText;
      this.showErrorToast("Failed to update progress");
    }

    button.disabled = false;
  }

  showCongratulations() {
    const modal = document.createElement("div");
    modal.className = "completion-modal";
    modal.innerHTML = `
      <div class="completion-content">
        <i class="fas fa-graduation-cap"></i>
        <h2>Congratulations!</h2>
        <p>You've completed the course! Your certificate has been generated.</p>
        <a href="/learning/certificates.html" class="primary-button view-certificate">
          <i class="fas fa-award"></i> View Certificate
        </a>
      </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add("show"), 100);
    setTimeout(() => {
      modal.classList.remove("show");
      setTimeout(() => modal.remove(), 300);
    }, 5000);
  }

  showErrorToast(message) {
    const errorMessage = document.createElement("div");
    errorMessage.className = "error-toast";
    errorMessage.innerHTML = `
      <i class="fas fa-exclamation-circle"></i>
      ${message}
    `;
    document.body.appendChild(errorMessage);
    setTimeout(() => errorMessage.remove(), 3000);
  }

  getCurrentLesson() {
    return {
      id: 1,
    };
  }

  showError(message) {
    this.lessonList.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        `;
  }

  addRatingSection() {
    const ratingSection = document.createElement("div");
    ratingSection.className = "rating-section";
    ratingSection.innerHTML = `
      <div class="rating-container">
        <h3>Rate this course</h3>
        <div class="stars">
          ${Array(5)
            .fill()
            .map((_, i) => `<i class="far fa-star" data-rating="${i + 1}"></i>`)
            .join("")}
        </div>
        <textarea placeholder="Add a comment (optional)" class="rating-comment"></textarea>
        <button class="primary-button submit-rating">Submit Rating</button>
      </div>
    `;

    document.querySelector(".lesson-content").appendChild(ratingSection);

    // Add rating event handlers
    const stars = ratingSection.querySelectorAll(".stars i");
    stars.forEach((star) => {
      star.addEventListener("mouseover", () => this.highlightStars(stars, star.dataset.rating));
      star.addEventListener("mouseleave", () => this.highlightStars(stars, this.currentRating || 0));
      star.addEventListener("click", () => this.setRating(stars, star.dataset.rating));
    });

    ratingSection.querySelector(".submit-rating").addEventListener("click", () => this.submitRating());
  }

  highlightStars(stars, rating) {
    stars.forEach((star, index) => {
      star.className = index < rating ? "fas fa-star" : "far fa-star";
    });
  }

  setRating(stars, rating) {
    this.currentRating = rating;
    this.highlightStars(stars, rating);
  }

  async submitRating() {
    if (!this.currentRating) {
      notifications.show("Please select a rating", "error");
      return;
    }

    try {
      const comment = document.querySelector(".rating-comment").value;
      await api.rateCourse(this.courseId, this.currentRating, comment);
      notifications.show("Thank you for your rating!", "success");

      document.querySelector(".rating-section").classList.add("submitted");
    } catch (error) {
      console.error("Failed to submit rating:", error);
      notifications.show("Failed to submit rating", "error");
    }
  }

  async loadCourseRatings() {
    try {
      const ratings = await api.getCourseRatings(this.courseId);
      const ratingSection = document.createElement("div");
      ratingSection.className = "course-ratings-section";

      const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length || 0;

      ratingSection.innerHTML = `
        <div class="ratings-header">
          <h3>Course Ratings</h3>
          <div class="average-rating">
            <span class="rating-value">${avgRating.toFixed(1)}</span>
            <div class="stars">
              ${this.getStarRating(avgRating)}
            </div>
            <span class="rating-count">(${ratings.length} ratings)</span>
          </div>
        </div>
        <div class="ratings-list">
          ${ratings
            .map(
              (rating) => `
            <div class="rating-item">
              <div class="rating-user">
                <img src="${rating.userInfo.avatar}" alt="User avatar" class="user-avatar">
                <span class="user-name">${rating.userInfo.name}</span>
              </div>
              <div class="rating-content">
                <div class="stars">
                  ${this.getStarRating(rating.rating)}
                </div>
                ${rating.comment ? `<p class="rating-comment">${rating.comment}</p>` : ""}
                <span class="rating-date">${new Date(rating.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `;

      const existingRatingSection = document.querySelector(".rating-section");
      if (existingRatingSection) {
        existingRatingSection.parentNode.insertBefore(ratingSection, existingRatingSection);
      }
    } catch (error) {
      console.error("Failed to load course ratings:", error);
    }
  }

  getStarRating(rating) {
    return Array(5)
      .fill()
      .map(
        (_, i) => `
      <i class="fa${i < rating ? "s" : "r"} fa-star"></i>
    `
      )
      .join("");
  }
}

let courseViewer;
document.addEventListener("DOMContentLoaded", () => {
  courseViewer = new CourseViewer();
});
