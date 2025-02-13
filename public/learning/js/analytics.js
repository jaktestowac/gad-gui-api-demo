async function loadAnalytics() {
  try {
    const courseFilter = document.getElementById("courseFilter");
    const timeFilter = document.getElementById("timeFilter");

    document.querySelectorAll(".metric-value").forEach((el) => {
      el.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    });

    const response = await api.getInstructorAnalytics(courseFilter.value, timeFilter.value);

    if (!response.success || !response.data) {
      throw new Error("Invalid response format");
    }

    const { metrics, tables, charts } = response.data;

    updateMetrics(metrics);

    updateTables(tables);

    updateCharts(charts);
  } catch (error) {
    console.error("Failed to load analytics:", error);
    showNotification(error.message || "Failed to load analytics data", "error");

    document.getElementById("totalEnrollments").textContent = "0";
    document.getElementById("totalRevenue").textContent = "$0.00";
    document.getElementById("completionRate").textContent = "0%";
    document.getElementById("averageRating").textContent = "0.0";
  }
}

function updateMetrics(metrics) {
  if (!metrics) return;

  document.getElementById("totalEnrollments").textContent = metrics.enrollments.total;
  updateTrendValue("enrollmentTrend", metrics.enrollments.trend);

  document.getElementById("totalRevenue").textContent = `$${metrics.revenue.total.toFixed(2)}`;
  updateTrendValue("revenueTrend", metrics.revenue.trend);

  document.getElementById("completionRate").textContent = `${metrics.completion.rate}%`;
  updateTrendValue("completionTrend", metrics.completion.trend);

  document.getElementById("averageRating").textContent = metrics.rating.average.toFixed(1);
  updateTrendValue("ratingTrend", metrics.rating.trend);
}

function updateTrendValue(elementId, value) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = `${value > 0 ? "+" : ""}${value}%`;
  element.className = value >= 0 ? "positive" : "negative";
}

function updateTables({ topCourses, recentReviews }) {
  const topCoursesTable = document.getElementById("topCoursesTable");
  if (topCoursesTable) {
    topCoursesTable.innerHTML = `
      <table class="analytics-table">
        <thead>
          <tr>
            <th>Course</th>
            <th>Enrollments</th>
            <th>Revenue</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          ${topCourses
            .map(
              (course) => `
            <tr>
              <td>${course.title}</td>
              <td>${course.enrollments}</td>
              <td>$${course.revenue.toFixed(2)}</td>
              <td>${course.rating.toFixed(1)}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  const recentReviewsTable = document.getElementById("recentReviewsTable");
  if (recentReviewsTable) {
    recentReviewsTable.innerHTML = `
      <table class="analytics-table">
        <thead>
          <tr>
            <th>Course</th>
            <th>Rating</th>
            <th>Comment</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${recentReviews
            .map(
              (review) => `
            <tr>
              <td>${review.courseTitle}</td>
              <td>${review.rating.toFixed(1)}</td>
              <td>${review.comment}</td>
              <td>${new Date(review.date).toLocaleDateString()}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  }
}

function updateCharts(chartData) {
  // Example using Chart.js:
  if (chartData?.enrollments) {
    const enrollmentCtx = document.getElementById("enrollmentChart");
    if (enrollmentCtx) {
      // Create enrollment trend chart
      // ... chart implementation
    }
  }

  if (chartData?.revenue) {
    const revenueCtx = document.getElementById("revenueChart");
    if (revenueCtx) {
      // Create revenue trend chart
      // ... chart implementation
    }
  }
}

async function loadCourseFilter() {
  try {
    const courses = await api.getInstructorCourses();
    const courseFilter = document.getElementById("courseFilter");

    if (courseFilter && courses?.length) {
      courses.forEach((course) => {
        const option = document.createElement("option");
        option.value = course.id;
        option.textContent = course.title;
        courseFilter.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Failed to load courses:", error);
    showNotification("Failed to load course list", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadCourseFilter();
  loadAnalytics();

  // Add event listeners for filters
  const courseFilter = document.getElementById("courseFilter");
  const timeFilter = document.getElementById("timeFilter");

  if (courseFilter) {
    courseFilter.addEventListener("change", loadAnalytics);
  }

  if (timeFilter) {
    timeFilter.addEventListener("change", loadAnalytics);
  }
});
