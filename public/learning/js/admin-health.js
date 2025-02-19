let healthCheckInterval;
let refreshCountdown;
let requestsChart, errorRateChart;
const REFRESH_INTERVAL = 15;
const MAX_DATA_POINTS = 60;

async function initHealthDashboard() {
  if (!(await checkAdminAccess())) {
    window.location.href = "welcome.html";
    return;
  }

  setupCharts();
  await updateDashboard();
  setupRefreshTimer();

  document.getElementById("refreshButton").addEventListener("click", () => {
    updateDashboard();
    resetRefreshTimer();
  });
}

async function checkAdminAccess() {
  const user = await api.getCurrentUser();
  return user?.role === "admin";
}

function setupRefreshTimer() {
  healthCheckInterval = setInterval(updateDashboard, REFRESH_INTERVAL * 1000);
  resetRefreshTimer();
}

function resetRefreshTimer() {
  if (refreshCountdown) clearInterval(refreshCountdown);
  let timeLeft = REFRESH_INTERVAL;

  refreshCountdown = setInterval(() => {
    timeLeft--;
    document.getElementById("refreshTimer").textContent = `(${timeLeft}s)`;
    if (timeLeft <= 0) timeLeft = REFRESH_INTERVAL;
  }, 1000);
}

async function updateDashboard() {
  try {
    const [health, metrics] = await Promise.all([api.getHealthStatus(), api.getApiMetrics()]);

    if (!metrics) {
      console.warn("Received empty metrics data");
      return;
    }

    updateStatusCards(health, metrics);
    updateEndpointTable(metrics);
    updateCharts(metrics);
  } catch (error) {
    console.error("Failed to update dashboard:", error);
  }
}

function updateStatusCards(health, metrics) {
  const systemStatus = document.getElementById("systemStatus");
  systemStatus.textContent = health?.status || "unknown";
  systemStatus.className = `status-value status-${health?.status || "error"}`;

  const uptime = document.getElementById("uptime");
  uptime.textContent = formatUptime(metrics?.uptime || 0);

  const memoryUsage = document.getElementById("memoryUsage");
  if (metrics?.memory) {
    const usedMemory = (metrics.memory.heapUsed / 1024 / 1024).toFixed(2);
    const totalMemory = (metrics.memory.heapTotal / 1024 / 1024).toFixed(2);
    memoryUsage.textContent = `${usedMemory}MB / ${totalMemory}MB`;
  } else {
    memoryUsage.textContent = "Not available";
  }

  const totalRequests = document.getElementById("totalRequests");
  totalRequests.textContent = (metrics?.totalRequests || 0).toLocaleString();

  const requestsPerMinute = document.getElementById("requestsPerMinute");
  const latestRequests = metrics?.requestsPerMinute?.data[0]?.value || 0;
  requestsPerMinute.textContent = latestRequests;

  if (latestRequests > 1000) {
    requestsPerMinute.classList.add("status-warning");
  } else {
    requestsPerMinute.classList.remove("status-warning");
  }
}

function updateEndpointTable(metrics) {
  const tbody = document.getElementById("endpointTableBody");
  tbody.innerHTML = "";

  Object.entries(metrics.endpoints)
    .sort((a, b) => b[1] - a[1])
    .forEach(([endpoint, count]) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>${endpoint}</td>
                <td>${count}</td>
                <td>${calculateLastHourRequests(endpoint)}</td>
                <td><span class="status-healthy">Active</span></td>
            `;
      tbody.appendChild(tr);
    });
}

function setupCharts() {
  const requestsCtx = document.getElementById("requestsChart")?.getContext("2d");
  const errorCtx = document.getElementById("errorRateChart")?.getContext("2d");

  if (!requestsCtx || !errorCtx) {
    console.error("Chart canvas elements not found");
    return;
  }

  if (requestsChart) requestsChart.destroy();
  if (errorRateChart) errorRateChart.destroy();

  const commonChartOptions = {
    responsive: true,
    animation: {
      duration: 750,
      easing: "easeInOutQuart",
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 6,
          maxRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
    },
    parsing: {
      xAxisKey: "x",
      yAxisKey: "y",
    },
    plugins: {
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          title: (context) => {
            const dataPoint = context[0];
            const currentTime = new Date();
            const pointTime = new Date(dataPoint.raw.timestamp);
            const secondsAgo = Math.floor((currentTime - pointTime) / 1000);

            if (secondsAgo === 0) {
              return `${dataPoint.raw.x} (Just now)`;
            } else if (secondsAgo === 1) {
              return `${dataPoint.raw.x} (1 second ago)`;
            } else {
              return `${dataPoint.raw.x} (${secondsAgo} seconds ago)`;
            }
          },
          label: (context) => {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += Number(context.parsed.y).toFixed(1);
            }
            return label;
          },
        },
      },
      legend: {
        display: true,
        position: "top",
      },
    },
    interaction: {
      intersect: false,
      mode: "nearest",
    },
    elements: {
      point: {
        radius: 2,
        hoverRadius: 4,
      },
      line: {
        tension: 0.3,
      },
    },
  };

  requestsChart = new Chart(requestsCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Requests per Minute",
          data: [],
          borderColor: "#4CAF50",
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          fill: true,
          borderWidth: 2,
        },
      ],
    },
    options: {
      ...commonChartOptions,
      scales: {
        ...commonChartOptions.scales,
        y: {
          ...commonChartOptions.scales.y,
          title: {
            display: true,
            text: "Requests/Minute",
          },
        },
      },
    },
  });

  errorRateChart = new Chart(errorCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Error Rate (%)",
          data: [],
          borderColor: "#F44336",
          backgroundColor: "rgba(244, 67, 54, 0.1)",
          fill: true,
          borderWidth: 2,
        },
      ],
    },
    options: {
      ...commonChartOptions,
      scales: {
        ...commonChartOptions.scales,
        y: {
          ...commonChartOptions.scales.y,
          max: 100,
          title: {
            display: true,
            text: "Error Rate (%)",
          },
        },
      },
    },
  });
}

function updateCharts(metrics) {
  if (!requestsChart || !errorRateChart) {
    console.warn("Charts not initialized");
    return;
  }

  const now = new Date();
  const currentTimeLabel = now.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Clear and update requests chart
  requestsChart.data.labels = [];
  requestsChart.data.datasets[0].data = [];

  metrics.requestsPerMinute.data
    .sort((a, b) => a.timestamp - b.timestamp)
    .forEach((point) => {
      const pointTime = new Date(point.timestamp);
      const timeLabel = pointTime.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      requestsChart.data.labels.push(timeLabel);
      requestsChart.data.datasets[0].data.push({
        x: timeLabel,
        y: point.value,
        timestamp: point.timestamp,
      });
    });

  // Clear and update error rate chart
  errorRateChart.data.labels = [];
  errorRateChart.data.datasets[0].data = [];

  metrics.errorsPerMinute.data
    .sort((a, b) => a.timestamp - b.timestamp)
    .forEach((point) => {
      const pointTime = new Date(point.timestamp);
      const timeLabel = pointTime.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      errorRateChart.data.labels.push(timeLabel);
      errorRateChart.data.datasets[0].data.push({
        x: timeLabel,
        y: point.value,
        timestamp: point.timestamp,
      });
    });

  // Update both charts
  requestsChart.update("active");
  errorRateChart.update("active");
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${remainingSeconds}s`;
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
}

function calculateLastHourRequests(endpoint) {
  // This is a placeholder - in a real implementation,
  // we would track requests over time
  return "---";
}

document.addEventListener("DOMContentLoaded", initHealthDashboard);
window.addEventListener("unload", () => {
  if (healthCheckInterval) clearInterval(healthCheckInterval);
  if (refreshCountdown) clearInterval(refreshCountdown);
});
