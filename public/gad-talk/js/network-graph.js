/**
 * GadTalk Network Graph Visualization
 * Displays followers and following relationships as a DAG
 */

const gadTalkNetworkGraph = (function () {
  let canvas = null;
  let ctx = null;
  let networkData = null;
  let zoomLevel = 1;
  let panX = 0;
  let panY = 0;
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let showLabels = true;

  const nodeRadius = 25;
  const centralNodeRadius = 35;
  const colors = {
    central: "#4a90e2",
    following: "#7ed321",
    followers: "#f5a623",
  };

  /**
   * Initialize network graph
   */
  function init() {
    canvas = document.getElementById("network-graph-canvas");
    if (!canvas) return;

    ctx = canvas.getContext("2d");
    const container = canvas.parentElement;

    // Set canvas size
    function resizeCanvas() {
      canvas.width = container.clientWidth;
      canvas.height = Math.min(container.clientWidth * 0.6, 600);
      // Redraw after resize
      if (networkData) draw();
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Setup controls
    const resetBtn = document.getElementById("network-reset-zoom");
    const showLabelsCheckbox = document.getElementById("network-show-labels");

    if (resetBtn) {
      resetBtn.addEventListener("click", resetView);
    }

    if (showLabelsCheckbox) {
      showLabelsCheckbox.addEventListener("change", (e) => {
        showLabels = e.target.checked;
        if (networkData) draw();
      });
    }

    // Mouse/touch events for panning and zooming
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("click", onCanvasClick);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart);
    canvas.addEventListener("touchmove", onTouchMove);
    canvas.addEventListener("touchend", onTouchEnd);

    // Setup modal close handlers
    const modal = document.getElementById("network-user-details-modal");
    if (modal) {
      modal.querySelectorAll("[data-close-modal]").forEach((el) => {
        el.addEventListener("click", () => modal.classList.add("gt-hidden"));
      });
    }
  }

  /**
   * Load network data (followers and following)
   */
  async function loadNetworkData(userId, displayName) {
    const loadingEl = document.getElementById("network-loading");
    const emptyEl = document.getElementById("network-empty");

    if (loadingEl) loadingEl.classList.remove("gt-hidden");
    if (emptyEl) emptyEl.classList.add("gt-hidden");

    // Give DOM time to layout the visible element
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Ensure canvas is properly sized when tab becomes visible
    if (canvas && canvas.parentElement) {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = Math.min(canvas.parentElement.clientWidth * 0.6, 600);
    }

    try {
      const followers = await getFollowers(userId);
      const following = await getFollowing(userId);

      if (followers.length === 0 && following.length === 0) {
        if (loadingEl) loadingEl.classList.add("gt-hidden");
        if (emptyEl) emptyEl.classList.remove("gt-hidden");
        return;
      }

      // Build network data
      networkData = {
        central: {
          id: userId,
          name: displayName,
          type: "central",
        },
        following: following.slice(0, 15).map((user) => ({
          ...user,
          id: user.id || user.userId,
          name: user.displayName || user.username || user.name,
          type: "following",
        })),
        followers: followers.slice(0, 15).map((user) => ({
          ...user,
          id: user.id || user.userId,
          name: user.displayName || user.username || user.name,
          type: "follower",
        })),
      };

      // Position nodes
      calculateNodePositions();

      // Reset view and draw
      resetView();
      draw();

      if (loadingEl) loadingEl.classList.add("gt-hidden");
    } catch (error) {
      // Silently ignore network data load errors
      if (loadingEl) loadingEl.classList.add("gt-hidden");
      if (emptyEl) emptyEl.classList.remove("gt-hidden");
    }
  }

  /**
   * Get followers list
   */
  async function getFollowers(userId) {
    try {
      if (!window.GadTalkAPI?.users?.getFollowers) return [];
      const response = await window.GadTalkAPI.users.getFollowers(userId, 1, 20);
      return response?.users || response?.followers || response?.data || [];
    } catch (error) {
      // Silently ignore follower fetch errors
      return [];
    }
  }

  /**
   * Get following list
   */
  async function getFollowing(userId) {
    try {
      if (!window.GadTalkAPI?.users?.getFollowing) return [];
      const response = await window.GadTalkAPI.users.getFollowing(userId, 1, 20);
      return response?.users || response?.following || response?.data || [];
    } catch (error) {
      // Silently ignore following fetch errors
      return [];
    }
  }

  /**
   * Calculate node positions using a simple DAG layout
   */
  function calculateNodePositions() {
    if (!networkData) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Central node
    networkData.central.x = centerX;
    networkData.central.y = centerY;

    // Shared settings
    const baseRadius = Math.max(width / 3.5, 140); // start radius
    const ringSpacing = Math.max(90, width / 12);
    const maxPerRing = 6; // nodes per ring before creating a new ring
    const angleSpread = Math.PI * 0.95; // arc size per side (~170°)

    function layoutSide(nodes, side) {
      const count = nodes.length;
      if (count === 0) return;

      const rings = Math.ceil(count / maxPerRing);

      for (let r = 0; r < rings; r++) {
        const startIndex = r * maxPerRing;
        const itemsInRing = Math.min(maxPerRing, count - startIndex);
        const radius = baseRadius + r * ringSpacing;

        for (let i = 0; i < itemsInRing; i++) {
          const node = nodes[startIndex + i];
          const ratio = itemsInRing > 1 ? i / (itemsInRing - 1) : 0.5;
          const centerAngle = side === "left" ? -Math.PI / 2 : Math.PI / 2;
          const angle = centerAngle - angleSpread / 2 + ratio * angleSpread;

          if (side === "left") {
            node.x = centerX - radius * Math.cos(angle);
            node.y = centerY - radius * Math.sin(angle);
          } else {
            node.x = centerX + radius * Math.cos(angle);
            node.y = centerY + radius * Math.sin(angle);
          }
        }
      }
    }

    layoutSide(networkData.followers, "left");
    layoutSide(networkData.following, "right");
  }

  /**
   * Draw the network graph
   */
  function draw() {
    if (!ctx || !canvas) return;

    // Ensure canvas has proper dimensions
    const container = canvas.parentElement;
    if (canvas.width !== container.clientWidth) {
      canvas.width = container.clientWidth;
      canvas.height = Math.min(container.clientWidth * 0.6, 600);
      // Recalculate node positions when canvas size changes to keep layout consistent
      calculateNodePositions();
    }

    // Clear canvas with dark background
    ctx.fillStyle = "#16181c";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    if (networkData) {
      // Draw edges first (so they appear behind nodes)
      drawEdges();

      // Draw nodes
      drawNodes();
    }

    ctx.restore();
  }

  /**
   * Draw connection lines (edges)
   */
  function drawEdges() {
    if (!networkData) return;

    const centerNode = networkData.central;
    ctx.strokeStyle = "rgba(100, 100, 100, 0.3)";
    ctx.lineWidth = 1.5;

    // Draw edges from center to followers
    networkData.followers.forEach((follower) => {
      ctx.beginPath();
      ctx.moveTo(centerNode.x, centerNode.y);
      ctx.lineTo(follower.x, follower.y);
      ctx.stroke();

      // Draw arrow pointing towards center (inbound)
      drawArrow(follower.x, follower.y, centerNode.x, centerNode.y, true);
    });

    // Draw edges from center to following
    networkData.following.forEach((follow) => {
      ctx.beginPath();
      ctx.moveTo(centerNode.x, centerNode.y);
      ctx.lineTo(follow.x, follow.y);
      ctx.stroke();

      // Draw arrow pointing away from center (outbound)
      drawArrow(centerNode.x, centerNode.y, follow.x, follow.y, false);
    });
  }

  /**
   * Draw arrow on a line
   */
  function drawArrow(fromX, fromY, toX, toY, inbound) {
    const headlen = 8;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    const arrowX = inbound ? toX - Math.cos(angle) * headlen : toX;
    const arrowY = inbound ? toY - Math.sin(angle) * headlen : toY;

    ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - Math.cos(angle - Math.PI / 6) * headlen, arrowY - Math.sin(angle - Math.PI / 6) * headlen);
    ctx.lineTo(arrowX - Math.cos(angle + Math.PI / 6) * headlen, arrowY - Math.sin(angle + Math.PI / 6) * headlen);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draw nodes (circles with labels)
   */
  function drawNodes() {
    if (!networkData) return;

    // Draw central node
    drawNode(networkData.central, centralNodeRadius, colors.central);

    // Draw followers
    networkData.followers.forEach((follower) => {
      drawNode(follower, nodeRadius, colors.followers);
    });

    // Draw following
    networkData.following.forEach((follow) => {
      drawNode(follow, nodeRadius, colors.following);
    });
  }

  /**
   * Draw a single node
   */
  function drawNode(node, radius, color) {
    // Draw circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw label if enabled
    if (showLabels && node.name) {
      ctx.fillStyle = "#fff"; // light text for dark background
      ctx.strokeStyle = "rgba(0,0,0,0.6)"; // subtle outline for readability
      ctx.lineWidth = 3;
      ctx.font = "11px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Truncate long names
      const maxLen = node.type === "central" ? 10 : 8;
      const displayName = node.name.length > maxLen ? node.name.substring(0, maxLen - 1) + "…" : node.name;

      // Stroke first for contrast then fill
      try {
        ctx.strokeText(displayName, node.x, node.y);
      } catch (err) {
        // strokeText may throw on some environments if fonts aren't loaded; ignore
      }
      ctx.fillText(displayName, node.x, node.y);
    }
  }

  /**
   * Mouse/Touch event handlers
   */
  function onMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    isDragging = true;
    // Store dragStart in canvas pixel coordinates
    dragStart = { x: (e.clientX - rect.left) * scaleX - panX, y: (e.clientY - rect.top) * scaleY - panY };
  }

  function onMouseMove(e) {
    if (isDragging) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      panX = (e.clientX - rect.left) * scaleX - dragStart.x;
      panY = (e.clientY - rect.top) * scaleY - dragStart.y;
      draw();
    }
  }

  function onMouseUp() {
    isDragging = false;
  }

  /**
   * Handle canvas click to detect node selection
   */
  function onCanvasClick(e) {
    if (isDragging) return; // Don't process click if we were dragging

    const rect = canvas.getBoundingClientRect();

    // Ensure canvas dimensions and node positions are current (in case of recent resize)
    const container = canvas.parentElement;
    if (canvas.width !== container.clientWidth) {
      canvas.width = container.clientWidth;
      canvas.height = Math.min(container.clientWidth * 0.6, 600);
      calculateNodePositions();
    }

    // Map mouse coordinates to canvas pixel coordinates (handles CSS-to-canvas scaling)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    // Convert pan offsets from CSS pixels to canvas pixels
    const panXScaled = panX * scaleX;
    const panYScaled = panY * scaleY;

    // Inverse the canvas transformations to get world coordinates
    // Canvas transformations: translate(w/2 + panXScaled, h/2 + panYScaled) -> scale(zoom) -> translate(-w/2, -h/2)
    const w = canvas.width;
    const h = canvas.height;

    // Transform click coordinates back to graph space
    const x = (canvasX - w / 2 - panXScaled) / zoomLevel + w / 2;
    const y = (canvasY - h / 2 - panYScaled) / zoomLevel + h / 2;

    // Check if click hit any node
    const hitNode = getNodeAtPosition(x, y);
    if (hitNode) {
      showUserDetails(hitNode);
    }
  }

  /**
   * Find node at a given canvas position
   */
  function getNodeAtPosition(x, y) {
    if (!networkData) return null;

    // Check central node
    const centralNode = networkData.central;
    if (distanceBetween(x, y, centralNode.x, centralNode.y) <= centralNodeRadius + 6) {
      return centralNode;
    }

    // Check followers
    for (const follower of networkData.followers) {
      if (distanceBetween(x, y, follower.x, follower.y) <= nodeRadius + 4) {
        return follower;
      }
    }

    // Check following
    for (const follow of networkData.following) {
      if (distanceBetween(x, y, follow.x, follow.y) <= nodeRadius + 4) {
        return follow;
      }
    }

    return null;
  }

  /**
   * Calculate distance between two points
   */
  function distanceBetween(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Show user details modal
   */
  async function showUserDetails(node) {
    const modal = document.getElementById("network-user-details-modal");
    if (!modal) return;

    try {
      // Fetch full user details
      const user = await fetchUserDetails(node.id);
      if (!user) {
        return;
      }

      // Populate modal
      const avatarEl = document.getElementById("network-user-avatar");
      const displayNameEl = document.getElementById("network-user-display-name");
      const usernameEl = document.getElementById("network-user-username");
      const bioEl = document.getElementById("network-user-bio");
      const gadsEl = document.getElementById("network-user-gads");
      const followersEl = document.getElementById("network-user-followers");
      const followingEl = document.getElementById("network-user-following");
      const profileLinkEl = document.getElementById("network-user-profile-link");

      if (avatarEl) {
        avatarEl.innerHTML = window.gadTalkGads
          ? window.gadTalkGads.getAvatarHtml(user, "lg")
          : `<img src="${user.avatar}" alt="${user.username}" />`;
      }
      if (displayNameEl) displayNameEl.textContent = user.displayName || user.username;
      if (usernameEl) usernameEl.textContent = `@${user.username}`;
      if (bioEl) bioEl.textContent = user.bio || "No bio";
      if (gadsEl) gadsEl.textContent = user.gadsCount || 0;
      if (followersEl) followersEl.textContent = user.followersCount || 0;
      if (followingEl) followingEl.textContent = user.followingCount || 0;
      if (profileLinkEl) {
        profileLinkEl.href = `/gad-talk/@${encodeURIComponent(user.username)}`;
      }

      modal.classList.remove("gt-hidden");
    } catch (error) {
      // Silently ignore errors
    }
  }

  /**
   * Fetch full user details from API
   */
  async function fetchUserDetails(userId) {
    try {
      if (!window.GadTalkAPI || !window.GadTalkAPI.users) return null;
      const response = await window.GadTalkAPI.users.getById(userId);
      return response?.data || response;
    } catch (error) {
      return null;
    }
  }

  function onWheel(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const zoomSpeed = 0.1;
    const oldZoom = zoomLevel;
    zoomLevel -= e.deltaY > 0 ? zoomSpeed : -zoomSpeed;
    zoomLevel = Math.max(0.5, Math.min(3, zoomLevel));

    // Zoom towards mouse position (pan stored in canvas pixels)
    const zoomDiff = zoomLevel - oldZoom;
    panX -= (mouseX - canvas.width / 2) * (zoomDiff / oldZoom);
    panY -= (mouseY - canvas.height / 2) * (zoomDiff / oldZoom);

    draw();
  }

  function onTouchStart(e) {
    if (e.touches.length === 1) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      isDragging = true;
      dragStart = {
        x: (e.touches[0].clientX - rect.left) * scaleX - panX,
        y: (e.touches[0].clientY - rect.top) * scaleY - panY,
      };
    }
  }

  function onTouchMove(e) {
    if (isDragging && e.touches.length === 1) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      panX = (e.touches[0].clientX - rect.left) * scaleX - dragStart.x;
      panY = (e.touches[0].clientY - rect.top) * scaleY - dragStart.y;
      draw();
    }
  }

  function onTouchEnd() {
    isDragging = false;
  }

  /**
   * Reset zoom and pan to initial state
   */
  function resetView() {
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    draw();
  }

  /**
   * Show/hide network section based on active tab
   */
  function handleTabChange(tabName) {
    const networkSection = document.getElementById("profile-network");
    if (!networkSection) return;

    if (tabName === "network") {
      networkSection.classList.remove("gt-hidden");
      draw();
    } else {
      networkSection.classList.add("gt-hidden");
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Public API
  return {
    init,
    loadNetworkData,
    handleTabChange,
  };
})();

// Export for use in other scripts
window.gadTalkNetworkGraph = gadTalkNetworkGraph;
