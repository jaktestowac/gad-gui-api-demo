let allCourses = [];
let enrolledCourseIds = new Set();
let selectedTags = new Set();
let selectedLevels = new Set();
let currentTagSort = "alphabetical";
let currentSortMethod = "default";

const INITIAL_TAGS_TO_SHOW = 8;

function formatTagText(tag) {
  return tag.length > 16 ? tag.substring(0, 13) + "..." : tag;
}

async function loadCourses() {
  try {
    renderLoadingState();
    const [courses, enrolledCourses] = await Promise.all([
      api.getCourses(),
      isLoggedIn() ? api.getEnrolledCourses() : [],
    ]);

    allCourses = courses;
    enrolledCourseIds = new Set(enrolledCourses.map((c) => c.courseId));

    // Initialize filters
    initializeTags(courses);
    initializeLevels(courses);
    filterAndDisplayCourses();
  } catch (error) {
    console.error("Failed to load courses:", error);
  }
}

function getTagPopularity(tag, courses) {
  return courses.reduce((count, course) => {
    return count + (course.tags.includes(tag) ? 1 : 0);
  }, 0);
}

function sortTags(tags, courses, sortType) {
  if (sortType === "popularity") {
    return Array.from(tags).sort((a, b) => {
      const popularityA = getTagPopularity(a, courses);
      const popularityB = getTagPopularity(b, courses);
      return popularityB - popularityA || a.localeCompare(b);
    });
  }
  return Array.from(tags).sort();
}

function initializeTags(courses) {
  const tagsList = document.getElementById("tagsList");
  const allTags = new Set();

  courses.forEach((course) => {
    course.tags.forEach((tag) => allTags.add(tag));
  });

  document.querySelector(".tags-header").innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <h3><i class="fas fa-tags"></i> Filter by Tags</h3>
      <select id="tagSort" class="tag-sort-select">
        <option value="alphabetical">A-Z</option>
        <option value="popularity">Most Popular</option>
      </select>
    </div>
    <button id="clearTags" class="clear-tags-btn" style="display: none;">
      <i class="fas fa-times"></i> Clear
    </button>
  `;

  function renderTags(sortType) {
    const sortedTags = sortTags(allTags, courses, sortType);

    tagsList.innerHTML = `
      <div class="visible-tags">
        ${sortedTags
          .slice(0, INITIAL_TAGS_TO_SHOW)
          .map(
            (tag) => `
          <div class="tag-filter ${selectedTags.has(tag) ? "active" : ""}" data-tag="${tag}" title="${tag}">
              ${formatTagText(tag)}
              ${sortType === "popularity" ? `<span class="tag-count">(${getTagPopularity(tag, courses)})</span>` : ""}
          </div>
        `
          )
          .join("")}
      </div>
      <div class="hidden-tags" style="display: none;">
        ${sortedTags
          .slice(INITIAL_TAGS_TO_SHOW)
          .map(
            (tag) => `
          <div class="tag-filter ${selectedTags.has(tag) ? "active" : ""}" data-tag="${tag}" title="${tag}">
              ${formatTagText(tag)}
              ${sortType === "popularity" ? `<span class="tag-count">(${getTagPopularity(tag, courses)})</span>` : ""}
          </div>
        `
          )
          .join("")}
      </div>
      ${
        sortedTags.length > INITIAL_TAGS_TO_SHOW
          ? `<button class="show-more-tags">
             Show More <i class="fas fa-chevron-down"></i>
             </button>`
          : ""
      }
    `;

    addTagEventListeners();
  }

  function addTagEventListeners() {
    const showMoreButton = tagsList.querySelector(".show-more-tags");
    if (showMoreButton) {
      showMoreButton.addEventListener("click", () => {
        const hiddenTags = tagsList.querySelector(".hidden-tags");
        const isExpanded = hiddenTags.style.display !== "none";

        hiddenTags.style.display = isExpanded ? "none" : "flex";
        showMoreButton.innerHTML = isExpanded
          ? 'Show More <i class="fas fa-chevron-down"></i>'
          : 'Show Less <i class="fas fa-chevron-up"></i>';
      });
    }

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
  }

  document.getElementById("tagSort").addEventListener("change", (e) => {
    currentTagSort = e.target.value;
    renderTags(currentTagSort);
  });

  renderTags(currentTagSort);

  document.getElementById("clearTags").addEventListener("click", () => {
    selectedTags.clear();
    document.querySelectorAll(".tag-filter").forEach((tag) => tag.classList.remove("active"));
    document.getElementById("clearTags").style.display = "none";
    filterAndDisplayCourses(document.getElementById("courseSearch").value);
  });
}

function initializeLevels(courses) {
  const levelsList = document.getElementById("levelsList");
  const allLevels = new Set(courses.map((course) => course.level));

  levelsList.innerHTML = Array.from(allLevels)
    .sort()
    .map(
      (level) => `
          <div class="level-filter" data-level="${level}">
              <i class="fas fa-signal"></i>
              ${level}
          </div>
      `
    )
    .join("");

  levelsList.querySelectorAll(".level-filter").forEach((levelElement) => {
    levelElement.addEventListener("click", () => {
      const level = levelElement.dataset.level;
      if (selectedLevels.has(level)) {
        selectedLevels.delete(level);
        levelElement.classList.remove("active");
      } else {
        selectedLevels.add(level);
        levelElement.classList.add("active");
      }

      const clearButton = document.getElementById("clearLevels");
      clearButton.style.display = selectedLevels.size > 0 ? "block" : "none";

      filterAndDisplayCourses(document.getElementById("courseSearch").value);
    });
  });

  document.getElementById("clearLevels").addEventListener("click", () => {
    selectedLevels.clear();
    document.querySelectorAll(".level-filter").forEach((level) => level.classList.remove("active"));
    document.getElementById("clearLevels").style.display = "none";
    filterAndDisplayCourses(document.getElementById("courseSearch").value);
  });
}

function sortCourses(courses) {
  const sortedCourses = [...courses];

  switch (currentSortMethod) {
    case "duration":
      return sortedCourses.sort((a, b) => {
        const timeA = parseDuration(a.duration);
        const timeB = parseDuration(b.duration);
        return timeB - timeA;
      });
    case "students":
      return sortedCourses.sort((a, b) => b.students - a.students);
    case "rating":
      return sortedCourses.sort((a, b) => b.rating - a.rating);
    default:
      return sortedCourses;
  }
}

function parseDuration(duration) {
  const match = duration.match(/(\d+)/);
  return match ? parseInt(match[0]) : 0;
}

function filterAndDisplayCourses(searchTerm = "") {
  const courseList = document.getElementById("courseList");
  let filteredCourses = allCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTags = selectedTags.size === 0 || course.tags.some((tag) => selectedTags.has(tag));
    const matchesLevels = selectedLevels.size === 0 || selectedLevels.has(course.level);

    return matchesSearch && matchesTags && matchesLevels;
  });

  filteredCourses = sortCourses(filteredCourses);

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
        <div class="course-card ${course.price === 0 ? "free-course" : ""}">
            <div align="center" class="course-thumbnail">
                <a href="${isLoggedIn() ? "course-details.html" : "preview.html"}?id=${course.id}" class="course-link">
                    <img src="${course.thumbnail}" alt="${course.title}" loading="lazy">
                </a>
            </div>
            <div class="course-info">
                <div>
                    <h3>${course.title}</h3>
                    ${
                      course.price === 0
                        ? '<div class="free-course-tag"><i class="fas fa-gift"></i> Free Course</div>'
                        : `<div class="price-tag">$${course.price}</div>`
                    }
                    <p>${course.description}</p>
                    <div class="course-tags">
                        ${course.tags
                          .map(
                            (tag) => `
                            <span class="course-tag" title="${tag}">${formatTagText(tag)}</span>
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

  const enrollButtonText =
    course.price === 0 ? '<i class="fas fa-gift"></i> Enroll Free' : `Enroll Now - $${course.price}`;
  return `<button class="enroll-button" onclick="enrollCourse(${course.id})" id="enroll-button-${course.id}">
            ${enrollButtonText}
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
    const course = allCourses.find((c) => c.id === courseId);

    if (course.price > 0) {
      const userFunds = await api.getUserFunds(userId);
      if (userFunds < course.price) {
        showNotification("Insufficient funds to enroll in this course", "error");
        button.innerHTML = `Enroll Now - $${course.price}`;
        button.disabled = false;
        return;
      }
    }

    const result = await api.enrollCourse(courseId);
    if (result.success) {
      button.innerHTML = '<i class="fas fa-check"></i> Enrolled';
      button.style.background = "#10b981";
      showNotification("Enrolled successfully! Redirecting to course...", "success");
      setTimeout(() => {
        window.location.href = `course-viewer.html?id=${courseId}`;
      }, 1000);
    }
  } catch (error) {
    const course = allCourses.find((c) => c.id === courseId);
    const buttonText = course.price === 0 ? "Enroll Now - Free" : `Enroll Now - $${course.price}`;
    button.innerHTML = buttonText;
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

  const sortSelect = document.getElementById("courseSort");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSortMethod = e.target.value;
      filterAndDisplayCourses(document.getElementById("courseSearch").value);
    });
  }
});
