function renderLoadingState() {
  const courseList = document.getElementById("courseList");
  const loadingCards = Array(6)
    .fill()
    .map(
      () => `
        <div class="course-card">
            <div class="skeleton" style="height: 200px;"></div>
            <div class="course-info">
                <div class="skeleton" style="height: 24px; width: 80%; margin-bottom: 10px;"></div>
                <div class="skeleton" style="height: 16px; width: 60%; margin-bottom: 15px;"></div>
                <div class="skeleton" style="height: 16px; width: 40%; margin-bottom: 20px;"></div>
                <div class="skeleton" style="height: 40px; width: 100%;"></div>
            </div>
        </div>
    `
    )
    .join("");
  courseList.innerHTML = loadingCards;
}

async function renderCourses() {
  const courseList = document.getElementById("courseList");
  renderLoadingState();

  try {
    const courses = await api.getCourses();
    const enrolledCourses = isLoggedIn() ? await api.getEnrolledCourses() : [];
    const enrolledCourseIds = new Set(enrolledCourses.map((c) => c.id));

    courseList.innerHTML = courses
      .map(
        (course) => `
            <div class="course-card">
              <div align="center">
                  <a href="${isLoggedIn() ? "course-details.html" : "preview.html"}?id=${
          course.id
        }" class="course-link">
                      <img src="${course.thumbnail}" alt="${course.title}" loading="lazy">
                  </a>
                </div>
                <div class="course-info">
                    <div>
                        <h3>${course.title}</h3>
                        <p>${course.description}</p>
                        <div class="course-stats">
                            <span><i class="fas fa-user"></i> ${course.students} student(s)</span>
                            <span><i class="fas fa-clock"></i> ${course.duration}</span>
                            <span><i class="fas fa-star"></i> ${course.rating}</span>
                            <span><i class="fas fa-signal"></i> ${course.level}</span>
                        </div>
                    </div>
                    ${
                      isLoggedIn()
                        ? enrolledCourseIds.has(course.id)
                          ? `<a href="course-viewer.html?id=${course.id}" class="continue-button">
                              Continue Learning
                             </a>`
                          : `<button class="enroll-button" onclick="enrollCourse(${course.id})">
                              Enroll Now - $${course.price}
                             </button>`
                        : `<div class="preview-actions">
                            <a href="preview.html?id=${course.id}" class="preview-button">Preview Course</a>
                            <a href="login.html" class="login-button">Sign in to Enroll</a>
                           </div>`
                    }
                </div>
            </div>
        `
      )
      .join("");
  } catch (error) {
    courseList.innerHTML = "<p>Error loading courses. Please try again later.</p>";
    console.error("Failed to load courses:", error);
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
        window.location.href = `/learning/course-viewer.html?id=${courseId}`;
      }, 1000);
    }
  } catch (error) {
    button.innerHTML = "Enroll Now";
    button.disabled = false;
    alert("Failed to enroll. Please try again.");
  }
}

document.addEventListener("DOMContentLoaded", renderCourses);
