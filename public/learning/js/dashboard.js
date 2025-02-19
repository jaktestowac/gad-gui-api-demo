let allCourses = [];
let enrolledCourseIds = new Set();
let selectedTags = new Set();

async function loadCourses() {
  try {
    renderLoadingState();
    const [courses, enrolledCourses] = await Promise.all([
      api.getCourses(),
      isLoggedIn() ? api.getEnrolledCourses() : [],
    ]);

    allCourses = courses;
    enrolledCourseIds = new Set(enrolledCourses.map((c) => c.courseId));

    // Initialize tags
    initializeTags(courses);
    filterAndDisplayCourses();
  } catch (error) {
    console.error("Failed to load courses:", error);
  }
}

function initializeTags(courses) {
  const tagsList = document.getElementById("tagsList");
  const allTags = new Set();

  courses.forEach((course) => {
    course.tags.forEach((tag) => allTags.add(tag));
  });

  tagsList.innerHTML = Array.from(allTags)
    .sort()
    .map(
      (tag) => `
          <div class="tag-filter" data-tag="${tag}">
              ${tag}
          </div>
      `
    )
    .join("");

  // Add click handlers for tags
  tagsList.querySelectorAll(".tag-filter").forEach((tagElement) => {
    tagElement.addEventListener("click", () => {
      const tag = tagElement.dataset.tag;
      if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
        tagElement.classList.remove("active");
      } else {
        selectedTags.add(tag);
        tagElement.classList.add("active");
      }

      const clearButton = document.getElementById("clearTags");
      clearButton.style.display = selectedTags.size > 0 ? "block" : "none";

      filterAndDisplayCourses(document.getElementById("courseSearch").value);
    });
  });

  // Add clear tags handler
  document.getElementById("clearTags").addEventListener("click", () => {
    selectedTags.clear();
    document.querySelectorAll(".tag-filter").forEach((tag) => tag.classList.remove("active"));
    document.getElementById("clearTags").style.display = "none";
    filterAndDisplayCourses(document.getElementById("courseSearch").value);
  });
}

function filterAndDisplayCourses(searchTerm = "") {
  const courseList = document.getElementById("courseList");
  const filteredCourses = allCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTags = selectedTags.size === 0 || course.tags.some((tag) => selectedTags.has(tag));

    return matchesSearch && matchesTags;
  });

  if (filteredCourses.length === 0) {
    courseList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search fa-3x"></i>
                <h3>No courses found</h3>
                <p>Try adjusting your search or filters to find what you're looking for.</p>
            </div>
        `;
    return;
  }

  courseList.innerHTML = filteredCourses
    .map(
      (course) => `
        <div class="course-card">
            <div align="center" class="course-thumbnail" >
                <a href="${isLoggedIn() ? "course-details.html" : "preview.html"}?id=${course.id}" class="course-link">
                    <img src="${course.thumbnail}" alt="${course.title}" loading="lazy">
                </a>
            </div>
            <div class="course-info">
                <div>
                    <h3>${course.title}</h3>
                    <p>${course.description}</p>
                    <div class="course-tags">
                        ${course.tags
                          .map(
                            (tag) => `
                            <span class="course-tag">${tag}</span>
                        `
                          )
                          .join("")}
                    </div>
                    <div class="course-stats">
                        <span><i class="fas fa-user"></i> ${course.students} student(s)</span>
                        <span><i class="fas fa-clock"></i> ${course.duration}</span>
                        <span><i class="fas fa-star"></i> ${course.rating}</span>
                        <span><i class="fas fa-signal"></i> ${course.level}</span>
                    </div>
                </div>
                ${
                  isLoggedIn()
                    ? getCourseActions(course, enrolledCourseIds.has(course.id))
                    : `<div class="preview-actions">
                        <a href="preview.html?id=${course.id}" class="preview-button" id="preview-button-${course.id}" aria-label="Preview Course" title="Preview Course">Preview Course</a>
                        <a href="login.html" class="login-button" aria-label="Sign in to Enroll" title="Sign in to Enroll">Sign in to Enroll</a>
                       </div>`
                }
            </div>
        </div>
    `
    )
    .join("");
}

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

function getCourseActions(course, isEnrolled) {
  const userId = api.getUserIdFromCookie();
  const isInstructor = course.instructorId == userId;

  if (isInstructor) {
    return `<a href="course-lessons.html?courseId=${course.id}" class="manage-button">
              <i class="fas fa-cog"></i> Manage Course
            </a> 
            <a href="course-viewer.html?courseId=${course.id}" class="manage-button">
              <i class="fas fa-eye"></i> View Course
            </a>`;
  }

  if (isEnrolled) {
    return `<a href="course-viewer.html?id=${course.id}" class="continue-button" id="continue-button-${course.id}">
              Continue Learning
            </a>`;
  }

  return `<button class="enroll-button" onclick="enrollCourse(${course.id})" id="enroll-button-${course.id}">
            Enroll Now - $${course.price}
          </button>`;
}

async function renderCourses(courses = allCourses) {
  const courseList = document.getElementById("courseList");

  try {
    const enrolledCourses = isLoggedIn() ? await api.getEnrolledCourses() : [];
    enrolledCourseIds = new Set(enrolledCourses.map((c) => c.courseId));

    courseList.innerHTML = courses
      .map(
        (course) => `
        <div class="course-card">
            <div align="center" class="course-thumbnail">
                <a href="${isLoggedIn() ? "course-details.html" : "preview.html"}?id=${course.id}" class="course-link">
                    <img src="${course.thumbnail}" alt="${course.title}" loading="lazy">
                </a>
            </div>
            <div class="course-info">
                <div>
                    <div align="center">
                        <h3>${course.title}</h3>
                    </div>
                    <p>${course.description}</p>
                    <div class="course-tags">
                        ${course.tags
                          .map(
                            (tag) => `
                            <span class="course-tag">${tag}</span>
                        `
                          )
                          .join("")}
                    </div>
                    <div class="course-stats">
                        <span><i class="fas fa-user"></i> ${course.students} student(s)</span>
                        <span><i class="fas fa-clock"></i> ${course.duration}</span>
                        <span><i class="fas fa-star"></i> ${course.rating}</span>
                        <span><i class="fas fa-signal"></i> ${course.level}</span>
                    </div>
                </div>
                ${
                  isLoggedIn()
                    ? getCourseActions(course, enrolledCourseIds.has(course.id))
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
    const userId = api.getUserIdFromCookie();
    const userFunds = await api.getUserFunds(userId);
    const course = allCourses.find((c) => c.id === courseId);

    if (userFunds < course.price) {
      showNotification("Insufficient funds to enroll in this course", "error");
      button.innerHTML = `Enroll Now - $${course.price}`;
      button.disabled = false;
      return;
    }

    const result = await api.enrollCourse(courseId);
    if (result.success) {
      button.innerHTML = '<i class="fas fa-check"></i> Enrolled';
      button.style.background = "#10b981";
      showNotification("Enrolled successfully! Redirecting to course...", "success");
      setTimeout(() => {
        window.location.href = `/learning/course-viewer.html?id=${courseId}`;
      }, 1000);
    }
  } catch (error) {
    button.innerHTML = `Enroll Now - $${allCourses.find((c) => c.id === courseId).price}`;
    button.disabled = false;

    if (error.error === "instructor_enrollment_error") {
      showNotification("Instructors cannot enroll in their own courses", "error");
    } else {
      showNotification(error.message || "Failed to enroll. Please try again.", "error");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadCourses();

  const searchInput = document.getElementById("courseSearch");
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        filterAndDisplayCourses(e.target.value);
      }, 500);
    });
  }
});
