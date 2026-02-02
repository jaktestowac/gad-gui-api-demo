/**
 * GadTalk Charts
 * Renders analytics charts for user profiles
 */

const gadTalkCharts = (function () {
  const COLORS = ["#1d9bf0", "#f91880", "#00ba7c", "#ffd400", "#8b5cf6", "#f97316", "#38bdf8", "#22c55e"];
  let currentUserId = null;
  let currentRangeDays = 90;

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
  }

  function setLoading(container, message = "Loading chart...") {
    if (!container) return;
    container.innerHTML = `
      <div class="gt-chart-loading">
        <div class="gt-spinner gt-spinner-sm"></div>
        <span class="gt-text-secondary gt-text-sm">${message}</span>
      </div>
    `;
  }

  function setEmpty(container, message = "No data yet") {
    if (!container) return;
    container.innerHTML = `<div class="gt-chart-empty gt-text-secondary">${message}</div>`;
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
  }

  async function loadUserCharts(userId) {
    const chartsRoot = $("profile-charts");
    if (!chartsRoot || !window.GadTalkAPI || !userId) return;
    currentUserId = userId;

    const heatmapContainer = $("chart-activity-heatmap");
    const engagementContainer = $("chart-engagement-line");
    const growthContainer = $("chart-follower-growth");
    const hashtagsContainer = $("chart-hashtag-donut");

    setLoading(heatmapContainer, "Loading heatmap...");
    setLoading(engagementContainer, "Loading engagement...");
    setLoading(growthContainer, "Loading growth...");
    setLoading(hashtagsContainer, "Loading hashtags...");

    try {
      const [heatmapRes, timelineRes, growthRes, hashtagsRes] = await Promise.all([
        window.GadTalkAPI.analytics.getActivityHeatmap(userId, Math.max(currentRangeDays, 30)),
        window.GadTalkAPI.analytics.getEngagementTimeline(userId, Math.min(currentRangeDays, 180)),
        window.GadTalkAPI.analytics.getFollowerGrowth(userId, 12),
        window.GadTalkAPI.analytics.getHashtagDistribution(userId, 8),
      ]);

      renderHeatmap(heatmapContainer, heatmapRes.heatmap);

      if (timelineRes && timelineRes.timeline) {
        renderLineChart(
          engagementContainer,
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
      }

      if (growthRes && growthRes.growth) {
        renderLineChart(
          growthContainer,
          growthRes.growth.labels,
          [{ label: "Followers", data: growthRes.growth.counts, color: "#1d9bf0" }],
          { height: 200 }
        );
      } else {
        setEmpty(growthContainer, "No follower data yet");
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
