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
        <tr>
          <th>Course</th>
          <th style="text-align:right">Enrolled</th>
          <th style="text-align:right">Revenue</th>
          <th style="text-align:center">Rating</th>
        </tr>
        ${topCourses
          .map(
            (course) => `
          <tr>
            <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${course.title}</td>
            <td style="text-align:right" class="enrollments">${course.enrollments}</td>
            <td style="text-align:right" class="revenue">$${course.revenue.toFixed(2)}</td>
            <td style="text-align:center" class="rating">${course.rating.toFixed(1)} ★</td>
          </tr>
        `
          )
          .join("")}
      </table>
    `;
  }

  const recentReviewsTable = document.getElementById("recentReviewsTable");
  if (recentReviewsTable) {
    recentReviewsTable.innerHTML = `
      <table class="analytics-table">
        <thead>
          <tr>
            <th>Course & Review</th>
            <th style="width: 100px; text-align: center">Rating</th>
          </tr>
        </thead>
        <tbody>
          ${recentReviews
            .map(
              (review) => `
            <tr>
              <td>
                <span class="review-title">${review.courseTitle}</span>
                <p class="review-comment">${review.comment}</p>
                <span class="review-date">${new Date(review.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}</span>
              </td>
              <td style="text-align: center">
                <span class="review-rating ${getRatingClass(review.rating)}">
                  ${review.rating.toFixed(1)} ★
                </span>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  }
}

function getRatingClass(rating) {
  if (rating >= 4) return "high";
  if (rating >= 3) return "medium";
  return "low";
}

let enrollmentChart = null;
let revenueChart = null;

function updateCharts(chartData) {
  // Clean up existing charts
  if (enrollmentChart) {
    enrollmentChart.destroy();
    enrollmentChart = null;
  }
  if (revenueChart) {
    revenueChart.destroy();
    revenueChart = null;
  }

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
    },
  };

  if (chartData?.enrollments) {
    const enrollmentCtx = document.getElementById("enrollmentChart");
    if (enrollmentCtx) {
      enrollmentChart = new Chart(enrollmentCtx, {
        type: "line",
        data: {
          labels: chartData.enrollments.map((d) => d.date),
          datasets: [
            {
              label: "New Enrollments",
              data: chartData.enrollments.map((d) => d.count),
              borderColor: "#4f46e5",
              backgroundColor: "#4f46e510",
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          ...commonOptions,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              mode: "index",
              intersect: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0,
              },
            },
            x: {
              grid: {
                display: false,
              },
            },
          },
        },
      });
    }
  }

  if (chartData?.revenue) {
    const revenueCtx = document.getElementById("revenueChart");
    if (revenueCtx) {
      revenueChart = new Chart(revenueCtx, {
        type: "bar",
        data: {
          labels: chartData.revenue.map((d) => d.date),
          datasets: [
            {
              label: "Revenue",
              data: chartData.revenue.map((d) => d.amount),
              backgroundColor: "#10b981",
              borderRadius: 4,
            },
          ],
        },
        options: {
          ...commonOptions,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              mode: "index",
              intersect: false,
              callbacks: {
                label: function (context) {
                  return `$${context.raw.toFixed(2)}`;
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  return "$" + value.toFixed(2);
                },
              },
            },
            x: {
              grid: {
                display: false,
              },
            },
          },
        },
      });
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

function convertToCSV(data) {
  const metrics = [
    ["Metrics", "Value", "Trend"],
    ["Total Enrollments", data.metrics.enrollments.total, data.metrics.enrollments.trend + "%"],
    ["Total Revenue", "$" + data.metrics.revenue.total.toFixed(2), data.metrics.revenue.trend + "%"],
    ["Completion Rate", data.metrics.completion.rate + "%", data.metrics.completion.trend + "%"],
    ["Average Rating", data.metrics.rating.average.toFixed(1), data.metrics.rating.trend + "%"],
  ];

  const topCourses = [
    ["Top Courses", "Enrollments", "Revenue", "Rating"],
    ...data.tables.topCourses.map((course) => [
      course.title,
      course.enrollments,
      "$" + course.revenue.toFixed(2),
      course.rating.toFixed(1),
    ]),
  ];

  const recentReviews = [
    ["Recent Reviews", "Course", "Rating", "Date", "Comment"],
    ...data.tables.recentReviews.map((review) => [
      review.courseTitle,
      review.rating,
      new Date(review.date).toLocaleDateString(),
      review.comment.replace(/,/g, ";"), // Replace commas to avoid CSV conflicts
    ]),
  ];

  const csvContent = [
    "Analytics Report",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    ...metrics.map((row) => row.join(",")),
    "",
    ...topCourses.map((row) => row.join(",")),
    "",
    ...recentReviews.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}

function convertMetricsToCSV(metrics) {
  const rows = [
    ["Metrics", "Value", "Trend"],
    ["Total Enrollments", metrics.enrollments.total, metrics.enrollments.trend + "%"],
    ["Total Revenue", "$" + metrics.revenue.total.toFixed(2), metrics.revenue.trend + "%"],
    ["Completion Rate", metrics.completion.rate + "%", metrics.completion.trend + "%"],
    ["Average Rating", metrics.rating.average.toFixed(1), metrics.rating.trend + "%"],
  ];
  return rows.map((row) => row.join(",")).join("\n");
}

function convertCoursesToCSV(courses) {
  const rows = [
    ["Course Title", "Enrollments", "Revenue", "Rating"],
    ...courses.map((course) => [
      course.title,
      course.enrollments,
      "$" + course.revenue.toFixed(2),
      course.rating.toFixed(1),
    ]),
  ];
  return rows.map((row) => row.join(",")).join("\n");
}

function convertReviewsToCSV(reviews) {
  const rows = [
    ["Course", "Rating", "Date", "Comment"],
    ...reviews.map((review) => [
      review.courseTitle,
      review.rating,
      new Date(review.date).toLocaleDateString(),
      `"${review.comment.replace(/"/g, '""')}"`, // Properly escape quotes for CSV
    ]),
  ];
  return rows.map((row) => row.join(",")).join("\n");
}

function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

document.addEventListener("DOMContentLoaded", () => {
  loadCourseFilter();
  loadAnalytics();

  const courseFilter = document.getElementById("courseFilter");
  const timeFilter = document.getElementById("timeFilter");

  if (courseFilter) {
    courseFilter.addEventListener("change", loadAnalytics);
  }

  if (timeFilter) {
    timeFilter.addEventListener("change", loadAnalytics);
  }

  const downloadFullCSV = document.getElementById("downloadFullCSV");
  const downloadMetricsCSV = document.getElementById("downloadMetricsCSV");
  const downloadCoursesCSV = document.getElementById("downloadCoursesCSV");
  const downloadReviewsCSV = document.getElementById("downloadReviewsCSV");

  async function getAnalyticsData() {
    const response = await api.getInstructorAnalytics(courseFilter.value, timeFilter.value);
    if (!response.success || !response.data) {
      throw new Error("Invalid response format");
    }
    return response.data;
  }

  if (downloadFullCSV) {
    downloadFullCSV.addEventListener("click", async () => {
      try {
        const data = await getAnalyticsData();
        const csvContent = convertToCSV(data);
        downloadCSV(csvContent, `full-analytics-report-${new Date().toISOString().split("T")[0]}.csv`);
      } catch (error) {
        showNotification("Failed to download analytics data", "error");
      }
    });
  }

  if (downloadMetricsCSV) {
    downloadMetricsCSV.addEventListener("click", async () => {
      try {
        const data = await getAnalyticsData();
        const csvContent = convertMetricsToCSV(data.metrics);
        downloadCSV(csvContent, `metrics-${new Date().toISOString().split("T")[0]}.csv`);
      } catch (error) {
        showNotification("Failed to download metrics data", "error");
      }
    });
  }

  if (downloadCoursesCSV) {
    downloadCoursesCSV.addEventListener("click", async () => {
      try {
        const data = await getAnalyticsData();
        const csvContent = convertCoursesToCSV(data.tables.topCourses);
        downloadCSV(csvContent, `top-courses-${new Date().toISOString().split("T")[0]}.csv`);
      } catch (error) {
        showNotification("Failed to download courses data", "error");
      }
    });
  }

  if (downloadReviewsCSV) {
    downloadReviewsCSV.addEventListener("click", async () => {
      try {
        const data = await getAnalyticsData();
        const csvContent = convertReviewsToCSV(data.tables.recentReviews);
        downloadCSV(csvContent, `recent-reviews-${new Date().toISOString().split("T")[0]}.csv`);
      } catch (error) {
        showNotification("Failed to download reviews data", "error");
      }
    });
  }
});
