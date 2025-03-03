class InstructorProfile {
  constructor() {
    this.urlParams = new URLSearchParams(window.location.search);
    this.instructorId = parseInt(this.urlParams.get("id"));
    this.initialize();
  }

  async initialize() {
    if (!this.instructorId) {
      this.showError("Invalid instructor ID");
      return;
    }

    try {
      const instructor = await api.getInstructorById(this.instructorId);
      if (!instructor) {
        this.showError("Instructor not found");
        return;
      }

      if (instructor.error) {
        this.showError(instructor.error?.message || "Failed to load instructor profile");
        return;
      }

      await Promise.all([
        this.renderInstructorHeader(instructor),
        this.loadInstructorStats(),
        this.loadInstructorCourses(),
      ]);
    } catch (error) {
      console.error("Failed to load instructor profile:", error);
      this.showError("Failed to load instructor profile");
    }
  }

  showError(message) {
    const container = document.querySelector(".instructor-profile");
    container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle fa-3x" style="color: #ef4444;"></i>
                <h3>Error</h3>
                <p>${message}</p>
                <a href="dashboard.html" class="primary-button">
                    <i class="fas fa-home"></i> Return to Dashboard
                </a>
            </div>
        `;
  }

  async loadInstructorProfile() {
    try {
      const instructor = await api.getInstructorById(this.instructorId);
      this.renderInstructorHeader(instructor);
    } catch (error) {
      console.error("Failed to load instructor details:", error);
      throw error;
    }
  }

  async loadInstructorStats() {
    try {
      const stats = await api.getInstructorStatsByInstructorId(this.instructorId);
      this.renderInstructorStats(stats);
    } catch (error) {
      console.error("Failed to load instructor stats:", error);
      throw error;
    }
  }

  async loadInstructorCourses() {
    try {
      const courses = await api.getInstructorCoursesByInstructorId(this.instructorId);
      this.renderInstructorCourses(courses);
    } catch (error) {
      console.error("Failed to load instructor courses:", error);
      throw error;
    }
  }

  renderInstructorHeader(instructor) {
    const header = document.getElementById("instructorHeader");
    header.innerHTML = `
            <img src="${instructor.avatar}" alt="${instructor.firstName} ${instructor.lastName}" class="instructor-avatar">
            <div class="instructor-info">
                <h1>${instructor.firstName} ${instructor.lastName}</h1>
                <div class="instructor-meta">
                    <span><i class="fas fa-chalkboard-teacher"></i> Instructor</span>
                </div>
            </div>
        `;
  }

  renderInstructorStats(stats) {
    const statsGrid = document.getElementById("statsGrid");
    statsGrid.innerHTML = `
            <div class="stat-card">
                <h3>Total Courses</h3>
                <div class="stat-value">${stats.totalCourses || 0}</div>
            </div>
            <div class="stat-card">
                <h3>Total Students</h3>
                <div class="stat-value">${stats.totalStudents || 0}</div>
            </div>
            <div class="stat-card">
                <h3>Average Rating</h3>
                <div class="stat-value">${stats.averageRating?.toFixed(1) || 0}</div>
            </div>
        `;
  }

  renderInstructorCourses(courses) {
    const coursesList = document.getElementById("coursesList");

    if (!courses.length) {
      coursesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book fa-3x"></i>
                    <h3>No Courses Yet</h3>
                    <p>This instructor hasn't published any courses yet.</p>
                </div>
            `;
      return;
    }

    coursesList.innerHTML = courses
      .map(
        (course) => `
            <div class="course-card">
                <div align="center" class="course-thumbnail">
                    <img src="${course.thumbnail}" alt="${course.title}">
                </div>
                <div class="course-info">
                    <div align="center">
                        <h3>${course.title}</h3>
                    </div>
                    <p>${course.description}</p>
                    <div class="course-stats">
                        <span><i class="fas fa-users"></i> ${course.students} students</span>
                        <span><i class="fas fa-star"></i> ${course.rating.toFixed(1)}</span>
                        <span><i class="fas fa-clock"></i> ${course.duration}</span>
                        <span><i class="fas fa-tag"></i> $${course.price.toFixed(2)}</span>
                    </div>
                    <a href="course-details.html?id=${course.id}" class="primary-button">
                        View Course
                    </a>
                </div>
            </div>
        `
      )
      .join("");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new InstructorProfile();
});
