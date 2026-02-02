/**
 * GadTalk Charts
 * Renders analytics charts for user profiles
 */

const gadTalkCharts = (function () {
  const COLORS = ["#1d9bf0", "#f91880", "#00ba7c", "#ffd400", "#8b5cf6", "#f97316", "#38bdf8", "#22c55e"];
  let currentUserId = null;
  let currentRangeDays = 90;
  const chartDataStore = {}; // Store data for export/table features

  function $(id) {
    return document.getElementById(id);
  }

  function init() {
    const rangeSelect = $("analytics-range");
    const rangeLabel = $("analytics-range-label");
    const refreshBtn = $("analytics-refresh");
    if (rangeSelect) {
      currentRangeDays = parseInt(rangeSelect.value, 10) || currentRangeDays;
      if (rangeLabel) rangeLabel.textContent = currentRangeDays;
      rangeSelect.addEventListener("change", () => {
        currentRangeDays = parseInt(rangeSelect.value, 10) || 90;
        if (rangeLabel) rangeLabel.textContent = currentRangeDays;
        if (currentUserId) {
          loadUserCharts(currentUserId);
        }
      });
    }
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        if (currentUserId) loadUserCharts(currentUserId);
      });
    }
    setupExportButtons();
    setupTableToggles();
  }

  function setEmpty(container, message = "No data yet") {
    if (!container) return;
    container.innerHTML = `<div class="gt-chart-empty gt-text-secondary">${message}</div>`;
  }

  function showSkeleton(chartId) {
    const skeleton = $(`skeleton-${chartId}`);
    const body = $(
      `chart-${
        chartId === "activity"
          ? "activity-heatmap"
          : chartId === "hashtags"
          ? "hashtag-donut"
          : chartId === "engagement"
          ? "engagement-line"
          : "follower-growth"
      }`
    );
    if (skeleton && body) {
      skeleton.classList.remove("gt-hidden");
      skeleton.classList.add("show");
      body.style.display = "none";
    }
  }

  function hideSkeleton(chartId) {
    const skeleton = $(`skeleton-${chartId}`);
    const body = $(
      `chart-${
        chartId === "activity"
          ? "activity-heatmap"
          : chartId === "hashtags"
          ? "hashtag-donut"
          : chartId === "engagement"
          ? "engagement-line"
          : "follower-growth"
      }`
    );
    if (skeleton && body) {
      skeleton.classList.add("gt-hidden");
      skeleton.classList.remove("show");
      body.style.display = "";
    }
  }

  function buildSkeletonHeatmap() {
    const skeleton = document.createElement("div");
    skeleton.className = "gt-skeleton-heatmap";
    for (let i = 0; i < 70; i++) {
      const item = document.createElement("div");
      item.className = "gt-skeleton-item";
      skeleton.appendChild(item);
    }
    return skeleton;
  }

  function buildSkeletonDonut() {
    const skeleton = document.createElement("div");
    skeleton.className = "gt-skeleton-donut";
    const circle = document.createElement("div");
    circle.className = "gt-skeleton-circle";
    skeleton.appendChild(circle);
    return skeleton;
  }

  function buildSkeletonLine() {
    const skeleton = document.createElement("div");
    skeleton.className = "gt-skeleton-line";
    for (let i = 0; i < 5; i++) {
      const bar = document.createElement("div");
      bar.className = "gt-skeleton-bar";
      skeleton.appendChild(bar);
    }
    return skeleton;
  }

  function initSkeletons() {
    const skeletonActivity = $("skeleton-activity");
    const skeletonHashtags = $("skeleton-hashtags");
    const skeletonEngagement = $("skeleton-engagement");
    const skeletonFollowers = $("skeleton-followers");

    if (skeletonActivity && !skeletonActivity.firstChild) {
      skeletonActivity.appendChild(buildSkeletonHeatmap());
    }
    if (skeletonHashtags && !skeletonHashtags.firstChild) {
      skeletonHashtags.appendChild(buildSkeletonDonut());
    }
    if (skeletonEngagement && !skeletonEngagement.firstChild) {
      skeletonEngagement.appendChild(buildSkeletonLine());
    }
    if (skeletonFollowers && !skeletonFollowers.firstChild) {
      skeletonFollowers.appendChild(buildSkeletonLine());
    }
  }

  function setupExportButtons() {
    document.querySelectorAll(".gt-chart-export-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const chartId = btn.dataset.chart;
        exportChart(chartId);
      });
    });
  }

  function setupTableToggles() {
    document.querySelectorAll(".gt-chart-table-toggle").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const chartId = btn.dataset.chart;
        const tableEl = $(`table-${chartId}`);
        if (tableEl) {
          tableEl.classList.toggle("gt-hidden");
        }
      });
    });
  }

  function exportChart(chartId) {
    const data = chartDataStore[chartId];
    if (!data) {
      alert("No data available for export");
      return;
    }
    exportAsPNG(chartId);
  }

  async function exportAsPNG(chartId) {
    try {
      const container = $(
        `chart-${
          chartId === "activity"
            ? "activity-heatmap"
            : chartId === "hashtags"
            ? "hashtag-donut"
            : chartId === "engagement"
            ? "engagement-line"
            : "follower-growth"
        }`
      );

      if (!container) {
        alert("Chart container not found");
        return;
      }

      // Load html2canvas dynamically if not already loaded
      if (!window.html2canvas) {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        script.onload = () => {
          captureChartAsPNG(container, chartId);
        };
        script.onerror = () => {
          alert("Failed to load PNG export library");
        };
        document.head.appendChild(script);
      } else {
        captureChartAsPNG(container, chartId);
      }
    } catch (error) {
      alert("Failed to export PNG: " + error.message);
    }
  }

  async function captureChartAsPNG(container, chartId) {
    try {
      const canvas = await window.html2canvas(container, { backgroundColor: "#16181c" });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `analytics-${chartId}-${new Date().toISOString().slice(0, 10)}.png`;
      link.click();
    } catch (error) {
      alert("Failed to capture chart: " + error.message);
    }
  }

  function renderDataTable(chartId, data) {
    const tableEl = $(`table-${chartId}`);
    if (!tableEl) return;

    let html = "<table>";

    if (chartId === "activity" && data.heatmapData) {
      html += "<thead><tr><th>Date</th><th>Posts</th></tr></thead><tbody>";
      data.heatmapData.forEach((entry) => {
        html += `<tr><td>${entry.date}</td><td>${entry.count}</td></tr>`;
      });
    } else if (chartId === "engagement" && data.timelineData) {
      html += "<thead><tr><th>Date</th><th>Likes</th><th>Replies</th><th>Reposts</th></tr></thead><tbody>";
      data.timelineData.dates.forEach((date, idx) => {
        html += `<tr><td>${date}</td><td>${data.timelineData.likes[idx]}</td><td>${data.timelineData.replies[idx]}</td><td>${data.timelineData.reposts[idx]}</td></tr>`;
      });
    } else if (chartId === "followers" && data.growthData) {
      html += "<thead><tr><th>Week</th><th>Followers</th></tr></thead><tbody>";
      data.growthData.dates.forEach((date, idx) => {
        html += `<tr><td>${date}</td><td>${data.growthData.counts[idx]}</td></tr>`;
      });
    } else if (chartId === "hashtags" && data.hashtagData) {
      html += "<thead><tr><th>Hashtag</th><th>Count</th><th>Percent</th></tr></thead><tbody>";
      data.hashtagData.forEach((tag) => {
        html += `<tr><td>#${tag.tag}</td><td>${tag.count}</td><td>${tag.percent}%</td></tr>`;
      });
    }

    html += "</tbody></table>";
    tableEl.innerHTML = html;
  }

  function getHeatmapLevel(count, maxCount) {
    if (!count || maxCount <= 0) return 0;
    const step = Math.max(1, Math.ceil(maxCount / 4));
    return Math.min(4, Math.floor((count - 1) / step) + 1);
  }

  function renderHeatmap(container, heatmap) {
    if (!container) return;
    if (!heatmap || !Array.isArray(heatmap.data) || heatmap.data.length === 0) {
      return setEmpty(container, "No activity yet");
    }

    const maxCount = heatmap.maxCount || 0;
    const grid = document.createElement("div");
    grid.className = "gt-heatmap-grid";

    heatmap.data.forEach((entry) => {
      const cell = document.createElement("div");
      const level = getHeatmapLevel(entry.count, maxCount);
      cell.className = `gt-heatmap-cell gt-heatmap-level-${level}`;
      cell.title = `${entry.date}: ${entry.count} gad${entry.count === 1 ? "" : "s"}`;
      grid.appendChild(cell);
    });

    const legend = document.createElement("div");
    legend.className = "gt-heatmap-legend";
    legend.innerHTML = `
      <span class="gt-text-secondary gt-text-sm">Less</span>
      <span class="gt-heatmap-swatch gt-heatmap-level-0"></span>
      <span class="gt-heatmap-swatch gt-heatmap-level-1"></span>
      <span class="gt-heatmap-swatch gt-heatmap-level-2"></span>
      <span class="gt-heatmap-swatch gt-heatmap-level-3"></span>
      <span class="gt-heatmap-swatch gt-heatmap-level-4"></span>
      <span class="gt-text-secondary gt-text-sm">More</span>
    `;

    container.innerHTML = "";
    container.appendChild(grid);
    container.appendChild(legend);
    hideSkeleton("activity");

    // Store for export/table
    chartDataStore.activity = { heatmapData: heatmap.data };
    renderDataTable("activity", chartDataStore.activity);
  }

  function createSvgElement(tag) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
  }

  function renderLineChart(container, labels, seriesList, options = {}) {
    if (!container) return;
    if (!labels || labels.length === 0 || !seriesList || seriesList.length === 0) {
      return setEmpty(container, "No data yet");
    }

    const width = options.width || 640;
    const height = options.height || 220;
    const padding = 32;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;
    const totalPoints = labels.length;

    const allValues = seriesList.flatMap((series) => series.data);
    const maxValue = Math.max(1, ...allValues);

    const svg = createSvgElement("svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.classList.add("gt-chart-svg");

    const axis = createSvgElement("line");
    axis.setAttribute("x1", padding);
    axis.setAttribute("y1", height - padding);
    axis.setAttribute("x2", width - padding);
    axis.setAttribute("y2", height - padding);
    axis.setAttribute("stroke", "#2f3336");
    axis.setAttribute("stroke-width", "1");
    svg.appendChild(axis);

    for (let i = 0; i < 4; i += 1) {
      const y = padding + (innerHeight / 3) * i;
      const gridLine = createSvgElement("line");
      gridLine.setAttribute("x1", padding);
      gridLine.setAttribute("x2", width - padding);
      gridLine.setAttribute("y1", y);
      gridLine.setAttribute("y2", y);
      gridLine.setAttribute("stroke", "#202327");
      gridLine.setAttribute("stroke-width", "1");
      svg.appendChild(gridLine);
    }

    seriesList.forEach((series, idx) => {
      if (!series.data || series.data.length === 0) return;
      const path = createSvgElement("path");
      const color = series.color || COLORS[idx % COLORS.length];

      const points = series.data.map((value, i) => {
        const x = padding + (innerWidth / Math.max(1, totalPoints - 1)) * i;
        const y = padding + innerHeight - (value / maxValue) * innerHeight;
        return [x, y];
      });

      const d = points.map((point, i) => `${i === 0 ? "M" : "L"}${point[0]} ${point[1]}`).join(" ");

      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", color);
      path.setAttribute("stroke-width", "2");
      svg.appendChild(path);

      const lastPoint = points[points.length - 1];
      if (lastPoint) {
        const dot = createSvgElement("circle");
        dot.setAttribute("cx", lastPoint[0]);
        dot.setAttribute("cy", lastPoint[1]);
        dot.setAttribute("r", "3");
        dot.setAttribute("fill", color);
        svg.appendChild(dot);
      }
    });

    const labelIndexes = [0, Math.floor(totalPoints / 2), totalPoints - 1].filter(
      (value, idx, arr) => value >= 0 && arr.indexOf(value) === idx
    );

    labelIndexes.forEach((idx) => {
      const label = labels[idx];
      if (!label) return;
      const text = createSvgElement("text");
      const x = padding + (innerWidth / Math.max(1, totalPoints - 1)) * idx;
      text.setAttribute("x", x);
      text.setAttribute("y", height - 8);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("fill", "#71767b");
      text.setAttribute("font-size", "11");
      text.textContent = label;
      svg.appendChild(text);
    });

    const legend = document.createElement("div");
    legend.className = "gt-chart-legend";
    legend.innerHTML = seriesList
      .map((series, idx) => {
        const color = series.color || COLORS[idx % COLORS.length];
        return `
          <span class="gt-chart-legend-item">
            <span class="gt-chart-legend-swatch" style="background:${color}"></span>
            ${series.label}
          </span>
        `;
      })
      .join("");

    container.innerHTML = "";
    container.appendChild(svg);
    container.appendChild(legend);
  }

  function renderLineChartWithData(container, chartId, labels, seriesList, options = {}) {
    renderLineChart(container, labels, seriesList, options);
    hideSkeleton(chartId);

    // Store for export/table
    const dates = labels || [];
    if (chartId === "engagement") {
      chartDataStore.engagement = {
        timelineData: {
          dates: dates,
          likes: (seriesList[0] && seriesList[0].data) || [],
          replies: (seriesList[1] && seriesList[1].data) || [],
          reposts: (seriesList[2] && seriesList[2].data) || [],
        },
      };
      renderDataTable("engagement", chartDataStore.engagement);
    } else if (chartId === "followers") {
      chartDataStore.followers = {
        growthData: { dates: dates, counts: (seriesList[0] && seriesList[0].data) || [] },
      };
      renderDataTable("followers", chartDataStore.followers);
    }
  }

  function renderDonutChart(container, data) {
    if (!container) return;
    if (!data || !Array.isArray(data.hashtags) || data.hashtags.length === 0) {
      return setEmpty(container, "No hashtags yet");
    }

    const total = data.total || data.hashtags.reduce((sum, item) => sum + item.count, 0);
    const radius = 48;
    const circumference = 2 * Math.PI * radius;

    const svg = createSvgElement("svg");
    svg.setAttribute("viewBox", "0 0 120 120");
    svg.classList.add("gt-donut-chart");

    let offset = 0;
    data.hashtags.forEach((item, idx) => {
      const fraction = total ? item.count / total : 0;
      const dash = fraction * circumference;
      const circle = createSvgElement("circle");
      circle.setAttribute("cx", "60");
      circle.setAttribute("cy", "60");
      circle.setAttribute("r", radius);
      circle.setAttribute("fill", "transparent");
      circle.setAttribute("stroke", COLORS[idx % COLORS.length]);
      circle.setAttribute("stroke-width", "14");
      circle.setAttribute("stroke-dasharray", `${dash} ${circumference - dash}`);
      circle.setAttribute("stroke-dashoffset", `${-offset}`);
      circle.setAttribute("stroke-linecap", "butt");
      svg.appendChild(circle);
      offset += dash;
    });

    const totalText = createSvgElement("text");
    totalText.setAttribute("x", "60");
    totalText.setAttribute("y", "64");
    totalText.setAttribute("text-anchor", "middle");
    totalText.setAttribute("fill", "#e7e9ea");
    totalText.setAttribute("font-size", "14");
    totalText.setAttribute("font-weight", "700");
    totalText.textContent = total;
    svg.appendChild(totalText);

    const legend = document.createElement("div");
    legend.className = "gt-donut-legend";
    legend.innerHTML = data.hashtags
      .map((item, idx) => {
        const color = COLORS[idx % COLORS.length];
        return `
          <div class="gt-donut-legend-item">
            <span class="gt-chart-legend-swatch" style="background:${color}"></span>
            <span>#${item.tag}</span>
            <span class="gt-text-secondary">${item.percent}%</span>
          </div>
        `;
      })
      .join("");

    const wrapper = document.createElement("div");
    wrapper.className = "gt-donut-wrapper";
    wrapper.appendChild(svg);
    wrapper.appendChild(legend);

    container.innerHTML = "";
    container.appendChild(wrapper);
    hideSkeleton("hashtags");

    // Store for export/table
    chartDataStore.hashtags = { hashtagData: data.hashtags };
    renderDataTable("hashtags", chartDataStore.hashtags);
  }

  async function loadUserCharts(userId) {
    const chartsRoot = $("profile-charts");
    if (!chartsRoot || !window.GadTalkAPI || !userId) return;
    currentUserId = userId;

    const heatmapContainer = $("chart-activity-heatmap");
    const engagementContainer = $("chart-engagement-line");
    const growthContainer = $("chart-follower-growth");
    const hashtagsContainer = $("chart-hashtag-donut");

    // Initialize skeletons first
    initSkeletons();
    showSkeleton("activity");
    showSkeleton("engagement");
    showSkeleton("followers");
    showSkeleton("hashtags");

    try {
      const [heatmapRes, timelineRes, growthRes, hashtagsRes] = await Promise.all([
        window.GadTalkAPI.analytics.getActivityHeatmap(userId, Math.max(currentRangeDays, 30)),
        window.GadTalkAPI.analytics.getEngagementTimeline(userId, Math.min(currentRangeDays, 180)),
        window.GadTalkAPI.analytics.getFollowerGrowth(userId, 12),
        window.GadTalkAPI.analytics.getHashtagDistribution(userId, 8),
      ]);

      renderHeatmap(heatmapContainer, heatmapRes.heatmap);

      if (timelineRes && timelineRes.timeline) {
        renderLineChartWithData(
          engagementContainer,
          "engagement",
          timelineRes.timeline.labels,
          [
            { label: "Likes", data: timelineRes.timeline.series.likes, color: "#f91880" },
            { label: "Replies", data: timelineRes.timeline.series.replies, color: "#1d9bf0" },
            { label: "Reposts", data: timelineRes.timeline.series.reposts, color: "#00ba7c" },
          ],
          { height: 220 }
        );
      } else {
        setEmpty(engagementContainer, "No engagement yet");
        hideSkeleton("engagement");
      }

      if (growthRes && growthRes.growth) {
        renderLineChartWithData(
          growthContainer,
          "followers",
          growthRes.growth.labels,
          [{ label: "Followers", data: growthRes.growth.counts, color: "#1d9bf0" }],
          { height: 200 }
        );
      } else {
        setEmpty(growthContainer, "No follower data yet");
        hideSkeleton("followers");
      }

      renderDonutChart(hashtagsContainer, hashtagsRes.hashtags);

      // Compute and populate summary metrics
      try {
        const totalPostsEl = $("analytics-total-posts");
        const avgEngEl = $("analytics-avg-engagement");
        const peakDayEl = $("analytics-peak-day");
        const topHashtagEl = $("analytics-top-hashtag");
        const emptyEl = $("analytics-empty");
        const chartsGrid = chartsRoot.querySelector(".gt-charts-grid");
        const summary = chartsRoot.querySelector(".gt-analytics-summary");

        const heatData =
          heatmapRes && heatmapRes.heatmap && Array.isArray(heatmapRes.heatmap.data) ? heatmapRes.heatmap.data : [];
        const totalPosts = heatData.reduce((s, e) => s + (e.count || 0), 0);

        let totalEngagement = 0;
        if (timelineRes && timelineRes.timeline && timelineRes.timeline.series) {
          const series = timelineRes.timeline.series;
          const likes = Array.isArray(series.likes) ? series.likes.reduce((s, v) => s + (v || 0), 0) : 0;
          const replies = Array.isArray(series.replies) ? series.replies.reduce((s, v) => s + (v || 0), 0) : 0;
          const reposts = Array.isArray(series.reposts) ? series.reposts.reduce((s, v) => s + (v || 0), 0) : 0;
          totalEngagement = likes + replies + reposts;
        }
        const avgEngagement = totalPosts > 0 ? Math.round(totalEngagement / totalPosts) : 0;

        const peakEntry = heatData.reduce((best, e) => (e.count > (best.count || 0) ? e : best), {});
        const peakDayText =
          peakEntry && peakEntry.date ? `${new Date(peakEntry.date).toLocaleDateString()} (${peakEntry.count})` : "—";
        const topHashtag =
          hashtagsRes && Array.isArray(hashtagsRes.hashtags) && hashtagsRes.hashtags.length
            ? `#${hashtagsRes.hashtags[0].tag} (${hashtagsRes.hashtags[0].count})`
            : "—";

        if (totalPostsEl) totalPostsEl.textContent = totalPosts || "0";
        if (avgEngEl) avgEngEl.textContent = totalPosts > 0 ? `${avgEngagement}` : "—";
        if (peakDayEl) peakDayEl.textContent = totalPosts > 0 ? peakDayText : "—";
        if (topHashtagEl) topHashtagEl.textContent = topHashtag;

        // Show/hide empty state depending on whether we have posts
        if (totalPosts === 0) {
          if (emptyEl) emptyEl.classList.remove("gt-hidden");
          if (chartsGrid) chartsGrid.classList.add("gt-hidden");
          if (summary) summary.classList.add("gt-hidden");
        } else {
          if (emptyEl) emptyEl.classList.add("gt-hidden");
          if (chartsGrid) chartsGrid.classList.remove("gt-hidden");
          if (summary) summary.classList.remove("gt-hidden");
        }
      } catch (e) {
        // ignore metric population errors
        // leave charts rendered
      }
    } catch (error) {
      setEmpty(heatmapContainer, "Failed to load heatmap");
      setEmpty(engagementContainer, "Failed to load engagement");
      setEmpty(growthContainer, "Failed to load growth");
      setEmpty(hashtagsContainer, "Failed to load hashtags");
      hideSkeleton("activity");
      hideSkeleton("engagement");
      hideSkeleton("followers");
      hideSkeleton("hashtags");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return {
    init,
    loadUserCharts,
  };
})();

window.gadTalkCharts = gadTalkCharts;
