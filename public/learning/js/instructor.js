async function checkInstructorAccess() {
  const user = await api.getCurrentUser();
  if (user?.role !== "instructor" && user?.role !== "admin") {
    window.location.href = "dashboard.html";
  }
}

async function loadInstructorDashboard() {
  try {
    const stats = await api.getInstructorStats();

    document.getElementById("courseCount").textContent = stats?.totalCourses || 0;
    document.getElementById("studentCount").textContent = stats?.totalStudents || 0;
    document.getElementById("avgRating").textContent = stats?.averageRating ? stats.averageRating.toFixed(1) : "0.0";
    document.getElementById("totalRevenue").textContent = `$${(stats?.totalRevenue || 0).toFixed(2)}`;

    const courses = await api.getInstructorCourses();
    renderInstructorCourses(courses);
  } catch (error) {
    console.error("Failed to load instructor dashboard:", error);
    document.getElementById("courseCount").textContent = "0";
    document.getElementById("studentCount").textContent = "0";
    document.getElementById("avgRating").textContent = "0.0";
    document.getElementById("totalRevenue").textContent = "$0.00";

    showNotification("Failed to load dashboard data. Please try again later.", "error");
  }
}

function handleViewChange(view) {
  localStorage.setItem("instructorViewPreference", view);

  const container = document.getElementById("instructorCourses");
  const buttons = document.querySelectorAll(".view-btn");

  buttons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  container.classList.remove("instructor-course-grid", "instructor-course-list");
  container.classList.add(view === "list" ? "instructor-course-list" : "instructor-course-grid");
}

function renderInstructorCourses(courses) {
  const coursesContainer = document.getElementById("instructorCourses");
  const currentView = localStorage.getItem("instructorViewPreference") || "grid";

  if (courses.length === 0) {
    coursesContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-book fa-3x"></i>
        <h3>No Courses Yet</h3>
        <p>Start creating your first course!</p>
      </div>
    `;
    return;
  }

  coursesContainer.innerHTML = courses
    .map(
      (course) => `
    <div class="course-card">
      <div class="course-header">
        <h3>${course.title}</h3>
        <p>${course.description}</p>
      </div>
      <div class="course-stats">
        <span><i class="fas fa-users"></i> ${course.students || 0} students</span>
        <span><i class="fas fa-star"></i> ${course.rating || 0} rating</span>
        <span><i class="fas fa-dollar-sign"></i> ${course.price}</span>
      </div>
      <div class="course-actions">
        <button onclick="editCourse(${course.id})" class="secondary-button">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button onclick="manageLessons(${course.id})" class="primary-button">
          <i class="fas fa-list"></i> Lessons
        </button>
      </div>
    </div>
  `
    )
    .join("");

  handleViewChange(currentView);
}

function showCreateCourseModal() {
  document.getElementById("courseModal").style.display = "block";
}

function closeModal() {
  document.getElementById("courseModal").style.display = "none";
}

async function handleCreateCourse(event) {
  event.preventDefault();

  const courseData = {
    title: document.getElementById("courseTitle").value,
    description: document.getElementById("courseDescription").value,
    price: parseFloat(document.getElementById("coursePrice").value),
    level: document.getElementById("courseLevel").value,
    tags: document
      .getElementById("courseTags")
      .value.split(",")
      .map((tag) => tag.trim()),
  };

  try {
    const response = await api.createCourse(courseData);
    if (!response.success) {
      throw new Error(response.message || "Failed to create course");
    }
    closeModal();
    showNotification("Course created successfully", "success");
    loadInstructorDashboard();
  } catch (error) {
    console.error("Failed to create course:", error);
    showNotification("Failed to create course", "error");
  }
}

function manageLessons(courseId) {
  sessionStorage.setItem("currentCourseId", courseId);
  window.location.href = `course-lessons.html?id=${courseId}`;
}

function editCourse(courseId) {
  sessionStorage.setItem("editCourseId", courseId);
  window.location.href = `edit-course.html?id=${courseId}`;
}

document.addEventListener("DOMContentLoaded", () => {
  checkInstructorAccess();
  loadInstructorDashboard();

  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      handleViewChange(btn.dataset.view);
    });
  });

  document.getElementById("createCourseBtn").addEventListener("click", showCreateCourseModal);
  document.getElementById("courseForm").addEventListener("submit", handleCreateCourse);

  window.onclick = function (event) {
    const modal = document.getElementById("courseModal");
    if (event.target === modal) {
      closeModal();
    }
  };
});
