function renderLoadingState() {
  const courseContent = document.getElementById("courseContent");
  courseContent.innerHTML = `
        <div class="course-header skeleton">
            <div class="skeleton-text" style="height: 200px;"></div>
            <div class="course-info-skeleton">
                <div class="skeleton-text title"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text"></div>
                <div class="course-stats">
                    ${Array(4)
                      .fill()
                      .map(
                        () => `
                        <div class="skeleton-text short"></div>
                    `
                      )
                      .join("")}
                </div>
            </div>
        </div>
    `;
}

async function renderCourseDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = parseInt(urlParams.get("id"));

  if (!courseId) {
    window.location.href = "dashboard.html";
    return;
  }

  renderLoadingState();
  const courseContent = document.getElementById("courseContent");

  try {
    const [course, enrollment] = await Promise.all([api.getCourseById(courseId), api.getEnrolledCourses()]);

    if (!course) {
      throw new Error("Course not found");
    }

    const isEnrolled = enrollment.some((e) => e.courseId === courseId);
    const lessonCount = (await api.getCourseLessonsTitles(courseId)).length;
    const userId = api.getUserIdFromCookie();
    const isInstructor = course.instructorId == userId;

    courseContent.innerHTML = `
            <div class="course-header">
                <div align="center" id="courseHeaderImage">
                  <img src="${course.thumbnail}" alt="${course.title}" class="course-banner">
                </div>
                <div class="course-info">
                    <div align="center">
                      <h1>${course.title}</h1>
                    </div>
                    <p class="course-description">${course.description}</p>
                    <div class="course-meta">
                        <span><i class="fas fa-user"></i> Instructor: ${course.instructor}</span>
                        <span><i class="fas fa-signal"></i> Level: ${course.level}</span>
                        <span><i class="fas fa-clock"></i> Duration: ${course.duration}</span>
                        <span><i class="fas fa-book"></i> ${lessonCount} lessons</span>
                    </div>
                    <div class="course-stats">
                        <span><i class="fas fa-users"></i> ${course.students} student(s) enrolled</span>
                        <span><i class="fas fa-star"></i> ${course.rating} rating</span>
                    </div>
                    ${
                      isInstructor
                        ? `
                        <div class="instructor-actions">
                            <a href="course-lessons.html?courseId=${courseId}" class="manage-button">
                                <i class="fas fa-cog"></i> Manage Course
                            </a> 
                            <a href="course-viewer.html?courseId=${courseId}" class="manage-button">
                                <i class="fas fa-eye"></i> View Course
                            </a>
                        </div>
                        `
                        : isEnrolled
                        ? `
                        <a href="course-viewer.html?id=${courseId}" class="primary-button">
                            Continue Learning
                        </a>
                        `
                        : `
                        <button onclick="enrollCourse(${courseId})" class="enroll-button">
                            Enroll Now - $${course.price}
                        </button>
                        `
                    }
                </div>
            </div>
            <div class="course-sections">
                <h2>What You'll Learn</h2>
                <div class="learning-objectives">
                    <ul>
                        ${course.learningObjectives.map((objective) => `<li>${objective}</li>`).join("")}
                    </ul>
                </div>
                <h2>Prerequisites</h2>
                <div class="prerequisites">
                    ${
                      course.prerequisites.length
                        ? `
                        <ul>
                            ${course.prerequisites.map((p) => `<li>${p}</li>`).join("")}
                        </ul>
                    `
                        : "<p>No prerequisites required</p>"
                    }
                </div>
            </div>
        `;
  } catch (error) {
    console.error("Failed to load course details:", error);
    courseContent.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load course details. Please try again later.</p>
                <a href="dashboard.html" class="primary-button">Return to Dashboard</a>
            </div>
        `;
  }
}

async function enrollCourse(courseId) {
  const button = event.target;
  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enrolling...';

  try {
    const result = await api.enrollCourse(courseId);
    if (result.success) {
      button.innerHTML = '<i class="fas fa-check"></i> Enrolled';
      button.style.background = "#10b981";
      setTimeout(() => {
        window.location.href = `course-viewer.html?id=${courseId}`;
      }, 1000);
    }
  } catch (error) {
    button.innerHTML = "Enroll Now";
    button.disabled = false;
    alert("Failed to enroll. Please try again.");
  }
}

class CourseDetails {
  constructor() {
    this.courseId = parseInt(new URLSearchParams(window.location.search).get("id"));
    this.initialize();
  }

  async initialize() {
    if (!this.courseId) {
      window.location.href = "/learning/courses.html";
      return;
    }

    await this.loadCourseRatings();
  }

  getStarRating(rating) {
    return Array(5)
      .fill()
      .map((_, i) => `<i class="fa${i < rating ? "s" : "r"} fa-star"></i>`)
      .join("");
  }

  async loadCourseRatings() {
    const ratingsSection = document.getElementById("courseRatings");

    try {
      const ratings = await api.getCourseRatings(this.courseId);
      const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length || 0;

      const ratingHeader = ratingsSection.querySelector(".average-rating");
      ratingHeader.innerHTML = `
                <span class="rating-value">${avgRating.toFixed(1)}</span>
                <div class="stars">
                    ${this.getStarRating(avgRating)}
                </div>
                <span class="rating-count">(${ratings.length} ratings)</span>
            `;

      const ratingsList = ratingsSection.querySelector(".ratings-list");
      ratingsList.innerHTML = ratings
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
        .join("");

      // Show/hide ratings section based on whether there are ratings
      ratingsSection.style.display = ratings.length ? "block" : "none";
    } catch (error) {
      console.error("Failed to load course ratings:", error);
      ratingsSection.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load ratings</p>
                </div>
            `;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new CourseDetails();
});
document.addEventListener("DOMContentLoaded", renderCourseDetails);
