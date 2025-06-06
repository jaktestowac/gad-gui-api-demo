document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const temperatureEl = document.getElementById("temperature");
  const temperatureIconEl = document.getElementById("temperatureIcon");
  const tempCategoryEl = document.getElementById("tempCategory");
  const humidityEl = document.getElementById("humidity");
  const windDirectionEl = document.getElementById("windDirection");
  const windDirectionIconEl = document.getElementById("windDirectionIcon");
  const windSpeedEl = document.getElementById("windSpeed");
  const weatherDateEl = document.getElementById("weatherDate");
  const datePickerEl = document.getElementById("datePicker");
  const eventFormEl = document.getElementById("eventForm");
  const eventTextEl = document.getElementById("eventText");
  const eventsListEl = document.getElementById("eventsList");
  const noEventsMessageEl = document.getElementById("noEventsMessage");
  const loginFormEl = document.getElementById("loginForm");
  const registerFormEl = document.getElementById("registerForm");
  const logoutBtnEl = document.getElementById("logoutBtn");
  const userWelcomeEl = document.getElementById("userWelcome");
  const adminDashboardLinkEl = document.getElementById("adminDashboardLink");
  const adminDashboardEl = document.querySelector(".weather-app-admin-dashboard");
  const mainContentEl = document.querySelector(".weather-app-main-content");
  const closeAdminBtnEl = document.getElementById("closeAdminBtn");
  const usersListEl = document.getElementById("usersList");
  const allEventsListEl = document.getElementById("allEventsList");
  const totalUsersEl = document.getElementById("totalUsers");
  const totalNotesEl = document.getElementById("totalNotes");
  const totalAdminsEl = document.getElementById("totalAdmins");
  const avgNotesPerUserEl = document.getElementById("avgNotesPerUser");
  const errorToastEl = document.getElementById("errorToast");
  const successToastEl = document.getElementById("successToast");
  const errorToastMessageEl = document.getElementById("errorToastMessage");
  const successToastMessageEl = document.getElementById("successToastMessage");
  const loggedInContentEls = document.querySelectorAll(".weather-app-logged-in");
  const loggedOutContentEls = document.querySelectorAll(".weather-app-logged-out");
  const returnToAppBtnEl = document.getElementById("returnToAppBtn");
  const editNoteFormEl = document.getElementById("editNoteForm");
  const editNoteTextEl = document.getElementById("editNoteText");
  const editNoteIdEl = document.getElementById("editNoteId");
  const editNoteModalEl = document.getElementById("editNoteModal");

  // New page elements
  const loginPageEl = document.getElementById("loginPage");
  const registerPageEl = document.getElementById("registerPage");
  const loginFormPageEl = document.getElementById("loginFormPage");
  const registerFormPageEl = document.getElementById("registerFormPage");
  const loginPageBtnEl = document.getElementById("loginPageBtn");
  const registerPageBtnEl = document.getElementById("registerPageBtn");
  const closeLoginBtnEl = document.getElementById("closeLoginBtn");
  const closeRegisterBtnEl = document.getElementById("closeRegisterBtn");
  const switchToRegisterBtnEl = document.getElementById("switchToRegisterBtn");
  const switchToLoginBtnEl = document.getElementById("switchToLoginBtn");

  // State
  let currentUser = null;
  let userToken = null; // Store the user's token
  // Get today's date formatted as YYYY-MM-DD using the browser's capabilities
  let selectedDate = formatDateYYYYMMDD(new Date()); // Default to today in YYYY-MM-DD format
  let events = [];
  // Cookie utilities
  const COOKIE_NAME = "weatherAppToken";

  // URL Routing functionality
  function navigateToPage(page) {
    // Hide all pages
    hideAllPages();

    // Update URL without reloading
    const newUrl = `${window.location.pathname}#${page}`;
    window.history.pushState({ page }, "", newUrl);

    // Show the requested page
    showPage(page);
  }

  function hideAllPages() {
    mainContentEl.style.display = "none";
    adminDashboardEl.style.display = "none";
    loginPageEl.style.display = "none";
    registerPageEl.style.display = "none";
  }

  function showPage(page) {
    switch (page) {
      case "login":
        loginPageEl.style.display = "block";
        break;
      case "register":
        registerPageEl.style.display = "block";
        break;
      case "admin":
        if (currentUser?.isAdmin) {
          adminDashboardEl.style.display = "block";
          fetchAdminData();
        } else {
          showError("Access denied. Admin privileges required.");
          showPage("home");
        }
        break;
      case "home":
      default:
        mainContentEl.style.display = "block";
        break;
    }
  }

  function getCurrentPageFromURL() {
    const hash = window.location.hash.substring(1);
    return hash || "home";
  }

  function initializeRouting() {
    // Handle initial page load
    const currentPage = getCurrentPageFromURL();
    showPage(currentPage);

    // Handle browser back/forward buttons
    window.addEventListener("popstate", (event) => {
      const page = event.state?.page || getCurrentPageFromURL();
      hideAllPages();
      showPage(page);
    });
  }

  function setTokenCookie(token, expiryMinutes = 30) {
    const date = new Date();
    date.setTime(date.getTime() + expiryMinutes * 60 * 1000);
    const expires = "expires=" + date.toUTCString();
    document.cookie = `${COOKIE_NAME}=${token};${expires};path=/;SameSite=Strict`;
  }

  function getTokenFromCookie() {
    const name = COOKIE_NAME + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(";");
    for (let i = 0; i < cookieArray.length; i++) {
      let cookie = cookieArray[i].trim();
      if (cookie.indexOf(name) === 0) {
        return cookie.substring(name.length, cookie.length);
      }
    }
    return null;
  }

  function removeTokenCookie() {
    document.cookie = `${COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  // Utility function to create headers with auth token
  function createAuthHeaders(contentType = true) {
    const headers = {};

    if (contentType) {
      headers["Content-Type"] = "application/json";
    }

    // Get token from cookie instead of using the variable
    const token = getTokenFromCookie();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  // Check if response is unauthorized (401) and handle expired session
  function handleUnauthorizedResponse(response) {
    if (response.status === 401) {
      // Session likely expired, reload the page to reset state
      showError("Session expired. Reloading page...");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      return true;
    }
    return false;
  }

  function formatDateYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // getMonth() is zero-based
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getDaysDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    d1.setHours(12, 0, 0, 0);
    d2.setHours(12, 0, 0, 0);

    const timeDiff = d2.getTime() - d1.getTime();

    return Math.round(timeDiff / (1000 * 60 * 60 * 24));
  }

  // Initialize date picker
  const datePicker = flatpickr(datePickerEl, {
    dateFormat: "Y-m-d",
    defaultDate: selectedDate,
    onChange: function (selectedDates) {
      // Fix: Format the selected date using our helper function to ensure consistent YYYY-MM-DD format
      selectedDate = formatDateYYYYMMDD(selectedDates[0]);
      fetchWeatherForSelectedDate();
      if (currentUser) {
        fetchEventsForDate();
      }
    },
  });

  // Bootstrap toasts
  const errorToast = new bootstrap.Toast(errorToastEl);
  const successToast = new bootstrap.Toast(successToastEl);

  // UI helper functions
  function showLoadingSkeleton() {
    document.getElementById("weatherSkeleton").style.display = "block";
    document.getElementById("weatherContent").style.display = "none";
  }

  function hideLoadingSkeleton() {
    document.getElementById("weatherSkeleton").style.display = "none";
    document.getElementById("weatherContent").style.display = "block";
  }

  // API functions
  async function fetchCurrentWeather() {
    try {
      showLoadingSkeleton();
      const response = await fetch("/api/practice/v1/weather/current");
      if (!response.ok) throw new Error("Failed to fetch current weather");
      const data = await response.json();
      updateWeatherUI(data);
    } catch (error) {
      showError(error.message);
    } finally {
      hideLoadingSkeleton();
    }
  }

  async function fetchWeatherForSelectedDate() {
    try {
      showLoadingSkeleton();
      const response = await fetch("/api/practice/v1/weather/day", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({ day: selectedDate }),
      });
      if (handleUnauthorizedResponse(response)) return;
      if (!response.ok) throw new Error("Failed to fetch weather for selected date");
      const data = await response.json();
      updateWeatherUI(data);
    } catch (error) {
      showError(error.message);
    } finally {
      hideLoadingSkeleton();
    }
  }

  async function fetchWeatherForCurrentDate() {
    try {
      showLoadingSkeleton();
      const response = await fetch("/api/practice/v1/weather/current", {
        method: "GET",
        headers: createAuthHeaders(),
      });
      if (handleUnauthorizedResponse(response)) return;
      if (!response.ok) throw new Error("Failed to fetch weather for current date");
      const data = await response.json();
      updateWeatherUI(data);
    } catch (error) {
      showError(error.message);
    } finally {
      hideLoadingSkeleton();
    }
  }

  async function fetchEventsForDate() {
    try {
      // Get events only for the current user and selected date
      const response = await fetch(`/api/practice/v1/weather/event?day=${selectedDate}`, {
        headers: createAuthHeaders(false), // No need for Content-Type on GET request
      });
      if (handleUnauthorizedResponse(response)) return;
      if (!response.ok) throw new Error("Failed to fetch events");
      const data = await response.json();

      // Only keep events that belong to the current user
      events = data.filter((event) => event.userId === currentUser.id);

      updateEventsUI();
    } catch (error) {
      showError(error.message);
    }
  }

  async function createEvent(event) {
    try {
      const response = await fetch("/api/practice/v1/weather/event", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({ day: selectedDate, event }),
      });
      if (handleUnauthorizedResponse(response)) return null;
      if (!response.ok) throw new Error("Failed to create event");
      const data = await response.json();
      showSuccess("Note added successfully");
      fetchEventsForDate();
      return data;
    } catch (error) {
      showError(error.message);
      return null;
    }
  }

  async function updateEvent(id, event) {
    try {
      const response = await fetch(`/api/practice/v1/weather/event/${id}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({ id, event }),
      });

      if (handleUnauthorizedResponse(response)) return null;
      if (!response.ok) throw new Error("Failed to update event");
      const data = await response.json();
      showSuccess("Note updated successfully");
      fetchEventsForDate();
      return data;
    } catch (error) {
      showError(error.message);
      return null;
    }
  }

  async function deleteEvent(id) {
    try {
      const response = await fetch(`/api/practice/v1/weather/event/${id}`, {
        method: "DELETE",
        headers: createAuthHeaders(false), // No need for Content-Type on DELETE
      });
      if (handleUnauthorizedResponse(response)) return;
      if (!response.ok) throw new Error("Failed to delete event");
      showSuccess("Note deleted successfully");
      fetchEventsForDate();
    } catch (error) {
      showError(error.message);
    }
  }

  async function registerUser(username, password, isAdmin) {
    try {
      const response = await fetch("/api/practice/v1/weather/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, isAdmin }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Registration failed");
      }

      const data = await response.json();
      showSuccess("Registration successful! You can now login.");

      // Switch to the login tab after successful registration
      const loginTab = document.getElementById("login-tab");
      if (loginTab) {
        const tabInstance = new bootstrap.Tab(loginTab);
        tabInstance.show();

        // Pre-fill the login form with the registered username for convenience
        const loginUsernameField = document.getElementById("loginUsername");
        if (loginUsernameField) {
          loginUsernameField.value = username;
          // Focus the password field for better user experience
          document.getElementById("loginPassword").focus();
        }
      }

      return data;
    } catch (error) {
      showError(error.message);
      return null;
    }
  }

  async function loginUser(username, password) {
    try {
      const response = await fetch("/api/practice/v1/weather/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Login failed");
      }

      const data = await response.json();
      currentUser = data.user;

      // Store token in cookie instead of variable
      setTokenCookie(data.token);

      updateAuthUI();
      fetchEventsForDate();
      showSuccess("Login successful!");
      closeAuthModal();
      return data;
    } catch (error) {
      showError(error.message);
      return null;
    }
  }

  async function logoutUser() {
    try {
      await fetch("/api/practice/v1/weather/auth/logout", {
        method: "POST",
        headers: createAuthHeaders(false), // Send token in logout request
      });

      // Clear local state
      currentUser = null;
      removeTokenCookie(); // Remove token from cookies instead of clearing variable
      updateAuthUI();
      showSuccess("Logout successful!");
    } catch (error) {
      // Still clear local state on error
      currentUser = null;
      removeTokenCookie(); // Remove token from cookies on error too
      updateAuthUI();
      showError(error.message);
    }
  }

  async function fetchAdminData() {
    if (!currentUser?.isAdmin) return;

    try {
      const response = await fetch("/api/practice/v1/weather/admin/data", {
        headers: createAuthHeaders(false), // No need for Content-Type on GET request
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to fetch admin data");
      }

      const data = await response.json();
      adminData = data;
      updateAdminUI(data);
    } catch (error) {
      showError(error.message);
    }
  }

  // UI update functions
  function updateWeatherUI(data) {
    if (!data) return;

    // Format the date for display
    const dateObj = new Date(data.date);
    const displayDate = dateObj.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    weatherDateEl.textContent = displayDate;

    // Get container elements by ID - assuming you have added these IDs to the HTML
    const tempContainerEl = document.getElementById("tempContainer");
    const humidityContainerEl = document.getElementById("humidityContainer");
    const windDirContainerEl = document.getElementById("windDirContainer");
    const windSpeedContainerEl = document.getElementById("windSpeedContainer");

    // Display temperature if available
    if (data.temp !== undefined) {
      tempContainerEl.style.display = "block";
      temperatureEl.textContent = `${data.temp}°C`;
      setTemperatureIcon(data.temp);
    } else {
      tempContainerEl.style.display = "none";
    }

    // Display humidity if available
    if (data.humidity !== undefined) {
      humidityContainerEl.style.display = "block";
      humidityEl.textContent = `${data.humidity}%`;
    } else {
      humidityContainerEl.style.display = "none";
    }

    // Handle wind direction if available
    if (data.wind && typeof data.wind === "object" && data.wind.direction !== undefined) {
      windDirContainerEl.style.display = "block";
      windDirectionEl.textContent = data.wind.direction;
      setWindDirectionIcon(data.wind.direction);
    } else {
      windDirContainerEl.style.display = "none";
    }

    // Handle wind speed if available
    if (data.wind !== undefined) {
      windSpeedContainerEl.style.display = "block";
      if (typeof data.wind === "object") {
        windSpeedEl.textContent = `${data.wind.speed} km/h`;
        setWindSpeedIcon(data.wind.speed);
      } else {
        windSpeedEl.textContent = `${data.wind} km/h`;
        setWindSpeedIcon(data.wind);
      }
    } else {
      windSpeedContainerEl.style.display = "none";
    }

    // Check the selected date compared to today and apply appropriate styling
    const weatherCardEl = document.querySelector(".weather-app-card");
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    dateObj.setHours(0, 0, 0, 0);

    // Calculate days difference
    const daysDiff = getDaysDifference(today, dateObj);

    // Create or get the days difference element
    let daysInfoEl = document.getElementById("daysInfo");
    if (!daysInfoEl) {
      daysInfoEl = document.createElement("div");
      daysInfoEl.id = "daysInfo";
      daysInfoEl.className = "text-center mb-2 days-info";
      weatherDateEl.parentNode.insertBefore(daysInfoEl, weatherDateEl.nextSibling);
    }

    // Set the appropriate message based on days difference
    if (daysDiff === 0) {
      daysInfoEl.textContent = "Today";
    } else if (daysDiff === 1) {
      daysInfoEl.textContent = "Tomorrow";
    } else if (daysDiff === -1) {
      daysInfoEl.textContent = "Yesterday";
    } else if (daysDiff > 1) {
      daysInfoEl.textContent = `${daysDiff} days in the future`;
    } else {
      daysInfoEl.textContent = `${Math.abs(daysDiff)} days ago`;
    }

    // Remove all possible style classes first
    weatherCardEl.classList.remove("weather-app-forecast-card", "weather-app-today-card", "weather-app-past-card");

    // Compare dates and apply appropriate style
    if (dateObj > today) {
      // Future date - apply forecast styling
      weatherCardEl.classList.add("weather-app-forecast-card");
    } else if (dateObj.getTime() === today.getTime()) {
      // Today - apply today's styling
      weatherCardEl.classList.add("weather-app-today-card");
    } else {
      // Past date - apply historical styling
      weatherCardEl.classList.add("weather-app-past-card");
    }
  }

  function setWindDirectionIcon(direction) {
    // Map wind direction to rotation angle
    const directionAngle = {
      N: 0,
      NE: 45,
      E: 90,
      SE: 135,
      S: 180,
      SW: 225,
      W: 270,
      NW: 315,
    };

    const angle = directionAngle[direction] || 0;
    windDirectionIconEl.style.transform = `rotate(${angle}deg)`;
  }
  // Function to set wind speed icon based on speed
  function setWindSpeedIcon(speed) {
    // Convert speed to a number if it's a string
    const windSpeed = parseFloat(speed);

    // Get the icon element
    const iconContainer = document.querySelector("#windSpeedContainer i");
    // Get the wind category label element
    const windCategoryEl = document.getElementById("windCategory");

    if (!iconContainer || !windCategoryEl) return;

    // Reset any previous styles
    iconContainer.style.animation = "";

    let category = "";

    // Apply appropriate icon and styling based on wind speed
    if (windSpeed < 10) {
      // Light breeze (0-9 km/h)
      iconContainer.className = "fas fa-wind fa-2x me-2 text-light";
      category = "Light Breeze";
      windCategoryEl.className = "text-light";
    } else if (windSpeed < 20) {
      // Moderate wind (10-19 km/h)
      iconContainer.className = "fas fa-wind fa-2x me-2 text-info";
      category = "Moderate Wind";
      windCategoryEl.className = "text-info";
    } else if (windSpeed < 40) {
      // Strong wind (20-39 km/h)
      iconContainer.className = "fas fa-wind fa-2x me-2 text-warning";
      category = "Strong Wind";
      windCategoryEl.className = "text-warning";
      // Add gentle shake animation
      iconContainer.style.animation = "pulse 2s infinite";
    } else if (windSpeed < 60) {
      // Gale/Storm (40-59 km/h)
      iconContainer.className = "fas fa-wind fa-2x me-2 text-danger";
      category = "Gale Force";
      windCategoryEl.className = "text-danger";
      // Add more pronounced animation
      iconContainer.style.animation = "fa-beat 1s infinite";
    } else {
      // Hurricane force (60+ km/h)
      iconContainer.className = "fas fa-exclamation-triangle fa-2x me-2 text-danger";
      category = "Hurricane Force";
      windCategoryEl.className = "text-danger fw-bold";
      // Add intense animation
      iconContainer.style.animation = "fa-beat 1.5s infinite linear";
    }

    // Update the wind category text
    windCategoryEl.textContent = category;
  }

  // Function to set temperature icon based on temperature value
  function setTemperatureIcon(temp) {
    // Convert temperature to a number if it's a string
    const temperature = parseFloat(temp);

    // Get the icon element
    const iconContainer = document.getElementById("temperatureIcon");
    // Get the temperature category label element
    const tempCategoryEl = document.getElementById("tempCategory");

    if (!iconContainer || !tempCategoryEl) return;

    // Reset any previous styles
    iconContainer.style.animation = "";

    let category = "";

    // Apply appropriate icon and styling based on temperature
    if (temperature < 0) {
      // Very cold (below 0°C)
      iconContainer.className = "fas fa-thermometer-empty fa-2x me-2 text-info";
      category = "Very Cold";
      tempCategoryEl.className = "text-info";
      // Add gentle pulse animation
      iconContainer.style.animation = "pulse 2s infinite";
    } else if (temperature < 10) {
      // Cold (0-9°C)
      iconContainer.className = "fas fa-thermometer-quarter fa-2x me-2 text-info";
      category = "Cold";
      tempCategoryEl.className = "text-info";
    } else if (temperature < 20) {
      // Mild (10-19°C)
      iconContainer.className = "fas fa-thermometer-half fa-2x me-2 text-light";
      category = "Mild";
      tempCategoryEl.className = "text-light";
    } else if (temperature < 30) {
      // Warm (20-29°C)
      iconContainer.className = "fas fa-thermometer-three-quarters fa-2x me-2 text-warning";
      category = "Warm";
      tempCategoryEl.className = "text-warning";
    } else if (temperature < 40) {
      // Hot (30-39°C)
      iconContainer.className = "fas fa-thermometer-full fa-2x me-2 text-danger";
      category = "Hot";
      tempCategoryEl.className = "text-danger";
      // Add gentle beat animation
      iconContainer.style.animation = "pulse 2s infinite";
    } else {
      // Extreme heat (40°C+)
      iconContainer.className = "fas fa-fire fa-2x me-2 text-danger";
      category = "Extreme Heat";
      tempCategoryEl.className = "text-danger fw-bold";
      // Add intense animation
      iconContainer.style.animation = "fa-beat 1.5s infinite";
    }

    // Update the temperature category text
    tempCategoryEl.textContent = category;
  }

  function updateEventsUI() {
    if (!events || events.length === 0) {
      noEventsMessageEl.style.display = "block";
      eventsListEl.innerHTML = "";
      return;
    }

    noEventsMessageEl.style.display = "none";
    eventsListEl.innerHTML = "";

    events.forEach((event) => {
      const eventCard = document.createElement("div");
      eventCard.className = "weather-app-event-card p-3";

      const header = document.createElement("div");
      header.className = "d-flex justify-content-between align-items-center mb-2";

      const username = document.createElement("span");
      username.className = "badge bg-primary";
      username.textContent = event.username;

      const actions = document.createElement("div");

      // Edit button
      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-sm btn-outline-primary me-2";
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.addEventListener("click", () => {
        editNoteTextEl.value = event.event;
        editNoteIdEl.value = event.id;
        const editNoteModal = new bootstrap.Modal(editNoteModalEl);
        editNoteModal.show();
      });

      // Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-sm btn-outline-danger";
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
      deleteBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete this note?")) {
          deleteEvent(event.id);
        }
      });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      header.appendChild(username);
      header.appendChild(actions);

      const content = document.createElement("p");
      content.className = "mb-1";
      content.innerHTML = event.event;

      const timestamp = document.createElement("small");
      timestamp.className = "text-muted";
      timestamp.textContent = new Date(event.createdAt).toLocaleString();

      eventCard.appendChild(header);
      eventCard.appendChild(content);
      eventCard.appendChild(timestamp);

      eventsListEl.appendChild(eventCard);
    });
  }
  function updateAdminUI(data) {
    if (!data) return;

    // Update stats
    const userCount = data.users.length;
    const noteCount = data.events.length;
    const adminCount = data.users.filter((user) => user.isAdmin).length;

    totalUsersEl.textContent = userCount;
    totalNotesEl.textContent = noteCount;
    totalAdminsEl.textContent = adminCount;

    // Calculate and update average notes per user
    const avgNotesPerUser = userCount > 0 ? (noteCount / userCount).toFixed(2) : "0";
    avgNotesPerUserEl.textContent = avgNotesPerUser;

    // Update users table
    usersListEl.innerHTML = "";
    data.users.forEach((user) => {
      const tr = document.createElement("tr");

      const tdUsername = document.createElement("td");
      tdUsername.textContent = user.username;

      const tdAdmin = document.createElement("td");
      tdAdmin.innerHTML = user.isAdmin
        ? '<span class="badge bg-success">Yes</span>'
        : '<span class="badge bg-secondary">No</span>';

      const tdNotes = document.createElement("td");
      const noteCount = data.events.filter((event) => event.userId === user.id).length;
      tdNotes.textContent = noteCount;

      tr.appendChild(tdUsername);
      tr.appendChild(tdAdmin);
      tr.appendChild(tdNotes);
      usersListEl.appendChild(tr);
    });

    // Update all events table
    allEventsListEl.innerHTML = "";
    data.events.forEach((event) => {
      const tr = document.createElement("tr");

      const tdDate = document.createElement("td");
      tdDate.textContent = event.day;

      const tdUser = document.createElement("td");
      tdUser.textContent = event.username;

      const tdNote = document.createElement("td");
      tdNote.textContent = event.event;

      tr.appendChild(tdDate);
      tr.appendChild(tdUser);
      tr.appendChild(tdNote);
      allEventsListEl.appendChild(tr);
    });
  }

  function updateAuthUI() {
    // Update UI based on authentication state
    if (currentUser) {
      // Show logged-in elements, hide logged-out elements
      loggedInContentEls.forEach((el) => (el.style.display = "block"));
      loggedOutContentEls.forEach((el) => (el.style.display = "none"));

      // Set welcome message
      userWelcomeEl.textContent = `Welcome, ${currentUser.username}!`;

      // Show admin dashboard link if user is admin
      if (currentUser.isAdmin) {
        adminDashboardLinkEl.style.display = "block";
      } else {
        adminDashboardLinkEl.style.display = "none";
      }
    } else {
      // Show logged-out elements, hide logged-in elements
      loggedInContentEls.forEach((el) => (el.style.display = "none"));
      loggedOutContentEls.forEach((el) => (el.style.display = "block"));

      // Hide admin dashboard
      adminDashboardEl.style.display = "none";
      mainContentEl.classList.remove("weather-app-hidden");
    }
  }

  // Helper functions
  function showError(message) {
    errorToastMessageEl.textContent = message;
    errorToast.show();
  }

  function showSuccess(message) {
    successToastMessageEl.textContent = message;
    successToast.show();
  }

  function closeAuthModal() {
    const modal = document.getElementById("authModal");
    const modalInstance = bootstrap.Modal.getInstance(modal);
    if (modalInstance) {
      modalInstance.hide();
    }
  }

  function showAdminDashboard() {
    adminDashboardEl.style.display = "block";
    mainContentEl.classList.add("weather-app-hidden");
    fetchAdminData();
  }

  function hideAdminDashboard() {
    adminDashboardEl.style.display = "none";
    mainContentEl.classList.remove("weather-app-hidden");
  }

  // Check if user is already logged in
  async function checkAuthentication() {
    try {
      // Try to fetch user information from an authenticated endpoint
      const response = await fetch("/api/practice/v1/weather/event", {
        headers: createAuthHeaders(false), // No Content-Type needed for GET
      });

      if (!response.ok) {
        // If unauthorized, reset UI to logged out state
        currentUser = null;
        userToken = null; // Also clear the token
        updateAuthUI();
        return;
      }

      const eventsData = await response.json();
      if (eventsData && eventsData.length > 0) {
        currentUser = {
          id: eventsData[0].userId,
          username: eventsData[0].username,
        };
      } else {
        // Try to get user info another way if no events found
        const userResponse = await fetch("/api/practice/v1/weather/auth/current-user", {
          headers: createAuthHeaders(false),
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          currentUser = userData;
        } else {
          // Set a fallback user object if no user data found but still authenticated
          currentUser = { username: "User" };
        }
      }

      // Check if user is admin
      const adminResponse = await fetch("/api/practice/v1/weather/admin/data", {
        headers: createAuthHeaders(false),
      });
      if (adminResponse.ok) {
        currentUser.isAdmin = true;
      }

      updateAuthUI();
      fetchEventsForDate();
    } catch (error) {
      // If any errors, assume not logged in
      currentUser = null;
      userToken = null; // Clear token on error
      updateAuthUI();
    }
  }

  // Event listeners
  loginFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (username && password) {
      await loginUser(username, password);
    }
  });

  // Refresh weather button functionality
  document.getElementById("refreshWeatherBtn")?.addEventListener("click", async () => {
    // Show a spinning animation on the refresh icon while loading
    const refreshIcon = document.querySelector("#refreshWeatherBtn i");
    refreshIcon.classList.add("fa-spin");

    // Disable the button during refresh
    const refreshBtn = document.getElementById("refreshWeatherBtn");
    refreshBtn.disabled = true;

    try {
      // Fetch the weather data for the currently selected date
      await fetchWeatherForSelectedDate();
      showSuccess("Weather data refreshed successfully");
    } catch (error) {
      showError("Failed to refresh weather data");
    } finally {
      // Stop the spinning animation and re-enable the button
      setTimeout(() => {
        refreshIcon.classList.remove("fa-spin");
        refreshBtn.disabled = false;
      }, 500);
    }
  });

  registerFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("registerUsername").value.trim();
    const password = document.getElementById("registerPassword").value.trim();
    const isAdmin = document.getElementById("registerAsAdmin").checked;
    const usernameEl = document.getElementById("registerUsername");

    // Reset validation styling
    usernameEl.classList.remove("is-invalid");
    usernameEl.classList.remove("shake-animation");

    // Validate username (3-10 characters, only letters, numbers, and hyphens)
    if (username.length < 3 || username.length > 10) {
      showError("Username must be between 3 and 10 characters!");

      // Apply validation styling
      usernameEl.classList.add("is-invalid");
      usernameEl.classList.add("shake-animation");

      // Remove shake animation after it completes
      setTimeout(() => {
        usernameEl.classList.remove("shake-animation");
      }, 500);

      return;
    }

    // Check if username contains only allowed characters (letters, numbers, hyphen)
    const validUsernamePattern = /^[a-zA-Z0-9-]+$/;
    if (!validUsernamePattern.test(username)) {
      showError("Username can only contain letters, numbers, and hyphens!");

      // Apply validation styling
      usernameEl.classList.add("is-invalid");
      usernameEl.classList.add("shake-animation");

      // Remove shake animation after it completes
      setTimeout(() => {
        usernameEl.classList.remove("shake-animation");
      }, 500);

      return;
    }

    if (username && password) {
      await registerUser(username, password, isAdmin);
    }
  });

  eventFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const event = eventTextEl.value.trim();

    // Reset validation styling
    eventTextEl.classList.remove("is-invalid");
    eventTextEl.classList.remove("shake-animation");

    // Validate note length (3-256 characters)
    if (event.length < 3 || event.length > 256) {
      showError("Note must be between 3 and 256 characters!");

      // Apply visual feedback for validation failure
      eventTextEl.classList.add("is-invalid");
      eventTextEl.classList.add("shake-animation");

      // Remove shake animation after it completes
      setTimeout(() => {
        eventTextEl.classList.remove("shake-animation");
      }, 500);

      return;
    }

    if (event) {
      await createEvent(event);
      eventTextEl.value = "";
    }
  });

  editNoteFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const eventId = editNoteIdEl.value;
    const updatedEvent = editNoteTextEl.value.trim();

    // Reset validation styling
    editNoteTextEl.classList.remove("is-invalid");
    editNoteTextEl.classList.remove("shake-animation");

    // Validate note length (3-256 characters)
    if (updatedEvent.length < 3 || updatedEvent.length > 256) {
      showError("Note must be between 3 and 256 characters!");

      // Apply visual feedback for validation failure
      editNoteTextEl.classList.add("is-invalid");
      editNoteTextEl.classList.add("shake-animation");

      // Remove shake animation after it completes
      setTimeout(() => {
        editNoteTextEl.classList.remove("shake-animation");
      }, 500);

      return;
    }

    if (eventId && updatedEvent) {
      await updateEvent(eventId, updatedEvent);
      const editNoteModal = bootstrap.Modal.getInstance(editNoteModalEl);
      if (editNoteModal) {
        editNoteModal.hide();
      }
    }
  });

  logoutBtnEl.addEventListener("click", async (e) => {
    e.preventDefault();
    await logoutUser();
  });
  adminDashboardLinkEl.addEventListener("click", (e) => {
    e.preventDefault();
    navigateToPage("admin");
  });

  closeAdminBtnEl.addEventListener("click", () => {
    navigateToPage("home");
  });

  // Add event listener for the new Return to App button
  returnToAppBtnEl.addEventListener("click", () => {
    navigateToPage("home");
  });

  // Previous day button handler
  document.getElementById("prevDayBtn").addEventListener("click", () => {
    const currentDate = datePicker.selectedDates[0];
    const prevDay = new Date(currentDate);
    prevDay.setDate(prevDay.getDate() - 1);
    datePicker.setDate(prevDay);

    // Manual trigger to ensure complete update of the weather card
    selectedDate = formatDateYYYYMMDD(prevDay);
    fetchWeatherForSelectedDate();
    if (currentUser) {
      fetchEventsForDate();
    }
  });

  // Next day button handler
  document.getElementById("nextDayBtn").addEventListener("click", () => {
    const currentDate = datePicker.selectedDates[0];
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    datePicker.setDate(nextDay);

    // Manual trigger to ensure complete update of the weather card
    selectedDate = formatDateYYYYMMDD(nextDay);
    fetchWeatherForSelectedDate();
    if (currentUser) {
      fetchEventsForDate();
    }
  });
  // Page navigation event listeners
  loginPageBtnEl?.addEventListener("click", (e) => {
    e.preventDefault();
    navigateToPage("login");
  });

  registerPageBtnEl?.addEventListener("click", (e) => {
    e.preventDefault();
    navigateToPage("register");
  });

  closeLoginBtnEl?.addEventListener("click", () => {
    navigateToPage("home");
  });

  closeRegisterBtnEl?.addEventListener("click", () => {
    navigateToPage("home");
  });

  switchToRegisterBtnEl?.addEventListener("click", (e) => {
    e.preventDefault();
    navigateToPage("register");
  });

  switchToLoginBtnEl?.addEventListener("click", (e) => {
    e.preventDefault();
    navigateToPage("login");
  });

  // New page form submissions
  loginFormPageEl?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUsernamePageInput").value;
    const password = document.getElementById("loginPasswordPageInput").value;

    const user = await loginUser(username, password);
    if (user) {
      navigateToPage("home");
    }
  });

  registerFormPageEl?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("registerUsernamePageInput").value;
    const password = document.getElementById("registerPasswordPageInput").value;
    const isAdmin = document.getElementById("registerIsAdminPageInput").checked;

    const success = await registerUser(username, password, isAdmin);
    if (success) {
      // Auto-fill login form and switch to login page
      document.getElementById("loginUsernamePageInput").value = username;
      navigateToPage("login");
      showSuccess("Registration successful! Please login with your credentials.");
    }
  });

  // Initialize routing system
  initializeRouting();

  // Initialize app
  fetchWeatherForCurrentDate();
  checkAuthentication();
});
