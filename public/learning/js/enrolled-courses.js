function renderLoadingState() {
  const courseList = document.getElementById("enrolledCoursesList");
  courseList.innerHTML = Array(3)
    .fill()
    .map(
      () => `
      <div class="course-card skeleton">
          <div class="skeleton-text" style="height: 150px; margin-bottom: 15px;"></div>
          <div class="course-info">
              <div>
                  <div class="skeleton-text title"></div>
                  <div class="skeleton-text"></div>
                  <div class="skeleton-text"></div>
                  <div class="course-stats">
                      ${Array(3)
                        .fill()
                        .map(
                          () => `
                          <div class="skeleton-text" style="width: 80px; height: 12px;"></div>
                      `
                        )
                        .join("")}
                  </div>
              </div>
              <div class="progress-section">
                  <div class="skeleton-text short"></div>
                  <div class="progress-bar">
                      <div class="skeleton-text" style="height: 8px; margin: 0;"></div>
                  </div>
              </div>
          </div>
      </div>
  `
    )
    .join("");
}

async function renderEnrolledCourses() {
  renderLoadingState();
  const courseList = document.getElementById("enrolledCoursesList");

  try {
    const enrolledCourses = await api.getEnrolledCourses();

    if (enrolledCourses.length === 0) {
      courseList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-books fa-3x"></i>
                    <h3>No Enrolled Courses</h3>
                    <p>Browse our courses and start learning today!</p>
                    <a href="dashboard.html" class="primary-button">Browse Courses</a>
                </div>
            `;
      return;
    }

    const enrolledCoursesWithProgress = await Promise.all(
      enrolledCourses.map(async (enrolledCourse) => {
        const lessons = await api.getCourseLessons(enrolledCourse.courseId);
        const completedLessons = lessons.filter((lesson) => lesson.completed).length;
        const totalLessons = lessons.length;
        const progress = Math.round((completedLessons / totalLessons) * 100) || 0;

        return {
          ...enrolledCourse,
          progress,
          completedLessons,
          totalLessons,
        };
      })
    );

    courseList.innerHTML = enrolledCoursesWithProgress
      .map(
        (course) => `
            <div class="course-card">
                <div align="center">
                  <img src="${course.thumbnail}" alt="${course.title}">
                </div>
                <div class="course-info">
                    <div>
                        <h3>${course.title}</h3>
                        <p>${course.description}</p>
                        <div class="course-stats">
                            <span><i class="fas fa-book"></i> ${course.completedLessons}/${
          course.totalLessons
        } lessons</span>
                            <span><i class="fas fa-clock"></i> ${course.duration}</span>
                            <span><i class="fas fa-calendar"></i> Enrolled: ${new Date(
                              course.enrollmentDate
                            ).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div class="progress-section">
                        <div class="progress-info">
                            <span class="progress-percentage">${course.progress}% Complete</span>
                            <span class="lessons-remaining">
                                ${course.totalLessons - course.completedLessons} lessons remaining
                            </span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${course.progress}%"></div>
                        </div>
                        <a href="course-viewer.html?id=${course.courseId}" class="continue-button">
                            ${course.progress === 100 ? "Review Course" : "Continue Learning"}
                        </a>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Failed to load enrolled courses:", error);
    courseList.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>Failed to load enrolled courses. Please try again later.</p>
        </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", renderEnrolledCourses);
