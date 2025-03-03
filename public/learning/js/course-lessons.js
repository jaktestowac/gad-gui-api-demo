async function checkInstructorAccess() {
  try {
    const user = await api.getCurrentUser();
    if (user?.role !== "instructor" && user?.role !== "admin") {
      window.location.href = "dashboard.html";
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to check instructor access:", error);
    window.location.href = "dashboard.html";
    return false;
  }
}

async function loadCourseLessons() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get("courseId");

    if (!courseId) {
      showNotification("Course ID is missing", "error");
      return;
    }

    const [course, lessons] = await Promise.all([api.getCourse(courseId), api.getCourseLessonsAsInstructor(courseId)]);

    document.querySelector(".panel-header h2").textContent = `Manage Lessons: ${course.title}`;

    renderLessonsList(lessons);
  } catch (error) {
    console.error("Failed to load lessons:", error);
    showNotification("Failed to load course lessons", "error");
  }
}

function renderLessonsList(lessons) {
  const lessonsContainer = document.getElementById("lessonsList");

  if (!lessons || lessons.length === 0) {
    lessonsContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-chalkboard-teacher fa-4x"></i>
        <h3>Ready to Add Lessons</h3>
        <p>This course has no lessons yet. Start building your course content!</p>
        <div class="empty-state-actions">
          <button class="primary-button" onclick="showAddLessonDialog()">
            <i class="fas fa-plus"></i> Add First Lesson
          </button>
        </div>
      </div>
    `;
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get("courseId");
  const displayedLessonId = parseInt(urlParams.get("lesson"));

  lessonsContainer.innerHTML = lessons
    .map(
      (lesson, index) => `
        <div class="lesson-card ${lesson.id === displayedLessonId ? "active" : ""}" data-id="${lesson.id}">
            <div class="lesson-info">
                <div class="lesson-number">${index + 1}</div>
                <div class="lesson-details">
                    <h3>${lesson.title}</h3>
                    <div class="lesson-meta">
                        <span class="lesson-type">
                            <i class="fas fa-${getLessonTypeIcon(lesson.type)}"></i> 
                            ${lesson.type}
                        </span>
                        ${
                          lesson.duration
                            ? `
                            <span class="lesson-duration">
                                <i class="fas fa-clock"></i> 
                                ${lesson.duration}
                            </span>
                        `
                            : ""
                        }
                    </div>
                </div>
            </div>
            <div class="lesson-actions">
                <button class="secondary-button" onclick="viewLesson(${courseId}, ${lesson.id})">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="secondary-button" onclick="editLesson(${courseId}, ${lesson.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="danger-button" onclick="deleteLesson(${courseId}, ${lesson.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `
    )
    .join("");
}

function getLessonTypeIcon(type) {
  const icons = {
    video: "video",
    quiz: "question-circle",
    reading: "book-reader",
    assignment: "tasks",
  };
  return icons[type] || "file-alt";
}

function showAddLessonDialog() {
  const dialog = document.createElement("div");
  dialog.className = "modal";
  dialog.innerHTML = `
        <div class="modal-content">
            <h3>Add New Lesson</h3>
            <form id="lessonForm">
                <div class="form-group">
                    <label for="lessonTitle">Title</label>
                    <input type="text" id="lessonTitle" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="lessonType">Type</label>
                        <select id="lessonType" required onchange="updateLessonFormFields(this.value)">
                            <option value="video">Video</option>
                            <option value="reading">Reading</option>
                            <option value="quiz">Quiz</option>
                            <option value="assignment">Assignment</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="lessonDuration">Duration</label>
                        <input type="text" id="lessonDuration" placeholder="HH:MM:SS" pattern="^([0-9]{2}):([0-5][0-9]):([0-5][0-9])$" value="00:00:00" required> 
                    </div>
                </div>
                <div id="dynamicLessonFields">
                    <!-- Dynamic fields will be inserted here -->
                </div>
                <div class="form-actions">
                    <button type="button" class="secondary-button" onclick="closeDialog()">Cancel</button>
                    <button type="submit" class="primary-button">Add Lesson</button>
                </div>
            </form>
        </div>
    `;

  document.body.appendChild(dialog);
  dialog.style.display = "block";

  const form = dialog.querySelector("#lessonForm");
  form.addEventListener("submit", handleAddLesson);

  updateLessonFormFields("video");
}

function updateLessonFormFields(lessonType) {
  const dynamicFieldsContainer = document.getElementById("dynamicLessonFields");
  let dynamicFields = "";

  switch (lessonType) {
    case "video":
      dynamicFields = `
                <div class="form-group">
                    <label for="lessonVideoUrl">Video URL</label>
                    <input type="url" id="lessonVideoUrl" required value="https://test.test.test/video1.mp4">
                </div>
                <div class="form-group">
                    <label for="lessonTranscript">Transcript</label>
                    <textarea id="lessonTranscript" rows="4" required></textarea>
                </div>
            `;
      break;
    case "reading":
      dynamicFields = `
                <div class="form-group">
                    <label for="lessonContent">Reading Content</label>
                    <textarea id="lessonContent" rows="8" required></textarea>
                </div>
                <div class="form-group">
                    <label for="lessonResources">Resources (separator: new line)</label>
                    <textarea id="lessonResources" rows="4"></textarea>
                </div>
            `;
      break;
    case "quiz":
      dynamicFields = `
                <div class="form-group">
                    <label for="lessonQuestions">Quiz Questions</label>
                    <textarea id="lessonQuestions" rows="8" placeholder="Enter questions in JSON format" required></textarea>
                </div>
                <div class="form-group">
                    <label for="lessonPassingScore">Passing Score (%)</label>
                    <input type="number" id="lessonPassingScore" min="0" max="100" value="70" required>
                </div>
            `;
      break;
    case "assignment":
      dynamicFields = `
                <div class="form-group">
                    <label for="lessonInstructions">Assignment Instructions</label>
                    <textarea id="lessonInstructions" rows="6" required></textarea>
                </div>
                <div class="form-group">
                    <label for="lessonRubric">Grading Rubric</label>
                    <textarea id="lessonRubric" rows="4"></textarea>
                </div>
                <div class="form-group">
                    <label for="lessonDueDate">Due Date (optional)</label>
                    <input type="date" id="lessonDueDate">
                </div>
            `;
      break;
  }

  dynamicFieldsContainer.innerHTML = dynamicFields;
  const lessonQuestions = dynamicFieldsContainer.querySelector("#lessonQuestions");
  if (lessonQuestions) {
    lessonQuestions.value = JSON.stringify(
      [
        {
          question: "What is 2 + 2?",
          options: ["3", "4", "5", "6"],
          correctAnswer: 1,
        },
        {
          question: "What is 10 - 5?",
          options: ["3", "4", "5", "6"],
          correctAnswer: 2,
        },
      ],
      null,
      2
    );
  }
}

async function handleAddLesson(event) {
  event.preventDefault();

  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get("courseId");
  const lessonType = document.getElementById("lessonType").value;

  const lessonData = {
    title: document.getElementById("lessonTitle").value,
    type: lessonType,
    duration: document.getElementById("lessonDuration").value,
    content: {}, // Initialize content object
  };

  // Add type-specific content
  switch (lessonType) {
    case "video":
      lessonData.content = {
        videoUrl: document.getElementById("lessonVideoUrl").value,
        transcript: document.getElementById("lessonTranscript").value,
      };
      break;
    case "reading":
      lessonData.content = {
        text: document.getElementById("lessonContent").value,
        resources: document.getElementById("lessonResources").value.split("\n").filter(Boolean),
      };
      break;
    case "quiz":
      try {
        lessonData.content = {
          questions: JSON.parse(document.getElementById("lessonQuestions").value),
          passingScore: parseInt(document.getElementById("lessonPassingScore").value),
        };
      } catch (e) {
        console.log(e);
        showNotification("Invalid quiz questions format", "error");
        return;
      }
      break;
    case "assignment":
      lessonData.content = {
        instructions: document.getElementById("lessonInstructions").value,
        rubric: document.getElementById("lessonRubric").value,
        dueDate: document.getElementById("lessonDueDate").value,
      };
      break;
  }

  try {
    const response = await api.addLesson(courseId, lessonData);
    if (response.success) {
      showNotification("Lesson added successfully", "success");
      closeDialog();
      loadCourseLessons();
    }
  } catch (error) {
    console.error("Failed to add lesson:", error);
    showNotification("Failed to add lesson", "error");
  }
}

async function editLesson(lessonId) {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get("courseId");
    const lesson = await api.getLessonAsInstructor(courseId, lessonId);

    const contentFields = {
      video: `
        <div class="form-group">
          <label for="editLessonVideoUrl">Video URL</label>
          <input type="url" id="editLessonVideoUrl" value="${
            lesson.content.videoUrl || ""
          }" placeholder="Enter video URL">
        </div>
        <div class="form-group">
          <label for="editLessonDescription">Description</label>
          <textarea id="editLessonDescription" rows="4">${lesson.content.transcript || ""}</textarea>
        </div>
      `,
      reading: `
        <div class="form-group">
          <label for="editLessonContent">Reading Content</label>
          <textarea id="editLessonContent" rows="8">${lesson.content.text || ""}</textarea>
        </div>
        <div class="form-group">
          <label for="editLessonResources">Resources</label>
          <textarea id="editLessonResources	" rows="4">${lesson.content.resources || ""}</textarea>
        </div>
      `,
      quiz: `
        <div class="form-group">
          <label for="editLessonQuestions">Quiz Questions</label>
          <textarea id="editLessonQuestions" rows="8" placeholder="Enter questions in JSON format">${
            lesson.content.questions ? JSON.stringify(lesson.content.questions, null, 2) : ""
          }</textarea>
        </div>
        <div class="form-group">
          <label for="editLessonPassingScore">Passing Score (%)</label>
          <input type="number" id="editLessonPassingScore" min="0" max="100" value="${lesson.passingScore || "70"}">
        </div>
      `,
      assignment: `
        <div class="form-group">
          <label for="editLessonInstructions">Assignment Instructions</label>
          <textarea id="editLessonInstructions" rows="6">${lesson.instructions || ""}</textarea>
        </div>
        <div class="form-group">
          <label for="editLessonRubric">Grading Rubric</label>
          <textarea id="editLessonRubric" rows="4">${lesson.rubric || ""}</textarea>
        </div>
        <div class="form-group">
          <label for="editLessonDueDate">Due Date (optional)</label>
          <input type="date" id="editLessonDueDate" value="${lesson.dueDate || ""}">
        </div>
      `,
    };

    const dialog = document.createElement("div");
    dialog.className = "modal";
    dialog.innerHTML = `
      <div class="modal-content">
        <h3>Edit Lesson</h3>
        <form id="editLessonForm">
          <div class="form-group">
            <label for="editLessonTitle">Title</label>
            <input type="text" id="editLessonTitle" value="${lesson.title}" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="editLessonType">Type</label>
              <select id="editLessonType" required onchange="updateContentFields(this.value)">
                <option value="video" ${lesson.type === "video" ? "selected" : ""}>Video</option>
                <option value="reading" ${lesson.type === "reading" ? "selected" : ""}>Reading</option>
                <option value="quiz" ${lesson.type === "quiz" ? "selected" : ""}>Quiz</option>
                <option value="assignment" ${lesson.type === "assignment" ? "selected" : ""}>Assignment</option>
              </select>
            </div>
            <div class="form-group">
              <label for="editLessonDuration">Duration</label>
              <input type="text" id="editLessonDuration" value="${lesson.duration || ""}" placeholder="HH:MM:SS">
            </div>
          </div>
          <div id="dynamicContentFields">
            ${contentFields[lesson.type]}
          </div>
          <div class="form-actions">
            <button type="button" class="secondary-button" onclick="closeDialog()">Cancel</button>
            <button type="submit" class="primary-button">Save Changes</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(dialog);
    dialog.style.display = "block";

    // Add content fields update handler
    window.updateContentFields = function (lessonType) {
      document.getElementById("dynamicContentFields").innerHTML = contentFields[lessonType];
    };

    const form = dialog.querySelector("#editLessonForm");
    form.addEventListener("submit", (e) => handleEditLesson(e, lessonId));
  } catch (error) {
    console.error("Failed to edit lesson:", error);
    showNotification("Failed to load lesson details", "error");
  }
}

function viewLesson(courseId, lessonId) {
  window.location.href = `course-viewer.html?courseId=${courseId}&lesson=${lessonId}`;
}

async function handleEditLesson(event, lessonId) {
  event.preventDefault();

  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get("courseId");
  const lessonType = document.getElementById("editLessonType").value;

  const lessonData = {
    title: document.getElementById("editLessonTitle").value,
    type: lessonType,
    duration: document.getElementById("editLessonDuration").value,
    content: {}, // Initialize content object
  };

  // Add type-specific content
  switch (lessonType) {
    case "video":
      lessonData.content = {
        videoUrl: document.getElementById("editLessonVideoUrl").value,
        transcript: document.getElementById("editLessonDescription").value,
      };
      break;
    case "reading":
      lessonData.content = {
        text: document.getElementById("editLessonContent").value,
        resources: document.getElementById("editLessonResources").value.split("\n").filter(Boolean),
      };
      break;
    case "quiz":
      try {
        lessonData.content = {
          questions: JSON.parse(document.getElementById("editLessonQuestions").value),
          passingScore: parseInt(document.getElementById("editLessonPassingScore").value),
        };
      } catch (e) {
        showNotification("Invalid quiz questions format", "error");
        return;
      }
      break;
    case "assignment":
      lessonData.content = {
        instructions: document.getElementById("editLessonInstructions").value,
        rubric: document.getElementById("editLessonRubric").value,
        dueDate: document.getElementById("editLessonDueDate").value,
      };
      break;
  }

  try {
    const response = await api.updateLesson(courseId, lessonId, lessonData);
    if (response.success) {
      showNotification("Lesson updated successfully", "success");
      closeDialog();
      loadCourseLessons();
    }
  } catch (error) {
    console.error("Failed to update lesson:", error);
    showNotification("Failed to update lesson", "error");
  }
}

async function deleteLesson(courseId, lessonId) {
  try {
    const confirmed = await confirmDialog.show({
      title: "Delete Lesson",
      message: "Are you sure you want to delete this lesson? This action cannot be undone.",
      confirmText: "Delete Lesson",
      cancelText: "Cancel",
      confirmButtonClass: "danger-button",
      icon: "fa-trash",
      showCloseButton: true,
    });

    if (!confirmed) {
      return;
    }

    const loadingNotification = showNotification("Deleting lesson...", "info", false);
    const response = await api.deleteLesson(courseId, lessonId);

    loadingNotification.remove();

    if (!response.success) {
      throw new Error(response.message || "Failed to delete lesson");
    }

    showNotification("Lesson deleted successfully", "success");
    await loadCourseLessons();
  } catch (error) {
    console.error("Error deleting lesson:", {
      courseId,
      lessonId,
      error: error.message,
      stack: error.stack,
    });

    showNotification(`Failed to delete lesson: ${error.message || "Unknown error"}`, "error");
  }
}

function closeDialog() {
  const dialog = document.querySelector(".modal");
  if (dialog) {
    dialog.remove();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  checkInstructorAccess();
  loadCourseLessons();

  const addLessonBtn = document.getElementById("addLessonBtn");
  if (addLessonBtn) {
    addLessonBtn.addEventListener("click", showAddLessonDialog);
  }

  // Close modal on outside click
  window.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal")) {
      closeDialog();
    }
  });
});
