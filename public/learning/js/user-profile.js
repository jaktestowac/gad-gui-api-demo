async function loadPublicProfile() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("id");

    if (!userId) {
      window.location.href = "dashboard.html";
      return;
    }

    const userData = await api.getPublicUserProfile(userId);
    if (userData.message) {
      notifications.show("User profile not found or is private", "error");
      setTimeout(() => (window.location.href = "dashboard.html"), 2000);
      return;
    }

    // Add page header
    document.title = `${userData.firstName} ${userData.lastName} - Public Profile`;
    document.querySelector(".main-header").textContent = "Public User Profile";

    // Update basic profile info
    document.getElementById("userProfileAvatar").src = userData.avatar || "/data/icons/user.png";
    document.getElementById("userProfileName").textContent = `${userData.firstName} ${userData.lastName}`;
    document.getElementById("userProfileRole").textContent = userData.role;
    document.getElementById("joinDate").textContent = `Member since: ${new Date(
      userData.joinDate
    ).toLocaleDateString()}`;

    // Update stats
    document.getElementById("enrollmentCount").textContent = userData.enrollments?.length || 0;
    document.getElementById("certificateCount").textContent = userData.certificates?.length || 0;
    document.getElementById("reviewCount").textContent = userData.ratings?.length || 0;
    document.getElementById("avgRating").textContent = calculateAverageRating(userData.ratings);

    // Render detailed sections
    renderEnrolledCourses(userData.enrollments);
    renderCertificates(userData.certificates);
    renderRatings(userData.ratings);
  } catch (error) {
    console.error("Failed to load public profile:", error);
    notifications.show("Failed to load user profile", "error");
  }
}

function renderEnrolledCourses(enrollments) {
  const grid = document.getElementById("enrolledCoursesGrid");
  if (!enrollments?.length) {
    grid.innerHTML = '<p class="empty-state">No enrolled courses yet</p>';
    return;
  }

  grid.innerHTML = enrollments
    .map(
      (course) => `
    <div class="enrolled-course-card">
      <a href="course-details.html?id=${course.courseId}" class="course-link">
        <h4>${course.courseTitle}</h4>
        <div class="progress-info">
          <div class="progress-bar">
            <div class="progress" style="width: ${course.progress}%"></div>
          </div>
          <span>${course.progress}% Complete</span>
        </div>
      </a>
    </div>
  `
    )
    .join("");
}

function renderCertificates(certificates) {
  const grid = document.getElementById("certificatesGrid");
  if (!certificates?.length) {
    grid.innerHTML = '<p class="empty-state">No certificates earned yet</p>';
    return;
  }

  grid.innerHTML = certificates
    .map(
      (cert) => `
    <div class="certificate-card">
      <a href="course-details.html?id=${cert.courseId}" class="course-link">
        <h4>${cert.courseTitle}</h4>
        <p><i class="fas fa-calendar-alt"></i> Issued: ${new Date(cert.issueDate).toLocaleDateString()}</p>
      </a>
    </div>
  `
    )
    .join("");
}

function renderRatings(ratings) {
  const list = document.getElementById("ratingsList");
  if (!ratings?.length) {
    list.innerHTML = '<p class="empty-state">No course reviews yet</p>';
    return;
  }

  list.innerHTML = ratings
    .map(
      (rating) => `
    <div class="rating-item">
      <a href="course-details.html?id=${rating.courseId}" class="course-link">
        <div class="rating-course-title">${rating.courseTitle}</div>
        <div class="rating-stars">
          ${generateStars(rating.rating)}
        </div>
      </a>
    </div>
  `
    )
    .join("");
}

function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - Math.ceil(rating);

  return [
    ...Array(fullStars).fill('<i class="fas fa-star"></i>'),
    hasHalfStar ? '<i class="fas fa-star-half-alt"></i>' : "",
    ...Array(emptyStars).fill('<i class="far fa-star"></i>'),
  ].join("");
}

function calculateAverageRating(ratings) {
  if (!ratings?.length) return "0.0";
  const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  return avg.toFixed(1);
}

function setupReturnButton() {
  const returnButton = document.getElementById("returnButton");
  returnButton.addEventListener("click", () => {
    if (document.referrer && document.referrer.includes(window.location.host)) {
      history.back();
    } else {
      window.location.href = "courses.html";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadPublicProfile();
  setupReturnButton();
});

document.addEventListener("DOMContentLoaded", () => {
  const returnButton = document.getElementById("returnButton");
  if (returnButton) {
    returnButton.addEventListener("click", () => {
      if (document.referrer && document.referrer.includes(window.location.host)) {
        history.back();
      } else {
        window.location.href = "/learning/dashboard.html";
      }
    });
  }
});
