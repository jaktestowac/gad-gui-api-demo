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
  const cardRefreshBtnEl = document.getElementById("cardRefreshBtn");
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
  const switchToRegisterBtn = document.getElementById("switchToRegister");
  const switchToLoginBtn = document.getElementById("switchToLogin");

  // State
  let currentUser = null;
  let userToken = null;
  let selectedDate = formatDateYYYYMMDD(new Date()); // Default to today
  let events = [];

  // GraphQL endpoint
  const GRAPHQL_ENDPOINT = "/api/practice/weather/v1/graphql";

  // Cookie utilities
  const COOKIE_NAME = "weatherAppGraphQLToken";

  function setTokenCookie(token, expiryMinutes = 30) {
    const date = new Date();
    date.setTime(date.getTime() + expiryMinutes * 60 * 1000);
    document.cookie = `${COOKIE_NAME}=${token}; expires=${date.toUTCString()}; path=/`;
  }

  function getTokenFromCookie() {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${COOKIE_NAME}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  function removeTokenCookie() {
    document.cookie = `${COOKIE_NAME}=; Max-Age=-99999999; path=/`;
  }

  // Helper functions
  function formatDateYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getDaysDifference(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
    return Math.round((date2 - date1) / oneDay);
  }

  // Initialize date picker
  const datePicker = flatpickr(datePickerEl, {
    dateFormat: "Y-m-d",
    defaultDate: selectedDate,
    onChange: function (selectedDates) {
      if (selectedDates.length > 0) {
        selectedDate = formatDateYYYYMMDD(selectedDates[0]);
        fetchWeatherForSelectedDate();
        if (currentUser) {
          fetchEventsForDate();
        }
      }
    },
  });

  // Bootstrap toasts
  const errorToast = new bootstrap.Toast(errorToastEl);
  const successToast = new bootstrap.Toast(successToastEl);

  // UI helper functions
  function showLoadingSkeleton() {
    if (weatherSkeleton && weatherContent) {
      weatherSkeleton.style.display = "block";
      weatherContent.style.display = "none";
    }
  }

  function hideLoadingSkeleton() {
    if (weatherSkeleton && weatherContent) {
      weatherSkeleton.style.display = "none";
      weatherContent.style.display = "block";
    }
  }

  // GraphQL API functions
  async function executeGraphQL(query, variables = {}, withAuth = false) {
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      if (withAuth && userToken) {
        headers["Authorization"] = `Bearer ${userToken}`;
      }

      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          query: query,
          variables: variables,
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      return result.data;
    } catch (error) {
      console.error("GraphQL error:", error);
      if (error.message.includes("Authentication") || error.message.includes("Unauthorized")) {
        // Handle expired session
        handleExpiredSession();
      }
      throw error;
    }
  }

  function handleExpiredSession() {
    // Clear user data and token
    currentUser = null;
    userToken = null;
    removeTokenCookie();
    updateAuthUI();
    showError("Your session has expired. Please login again.");
  }

  async function fetchCurrentWeather() {
    showLoadingSkeleton();
    try {
      const query = `
        query {
          currentWeather {
            temp
            date
            wind
          }
        }
      `;

      const data = await executeGraphQL(query);
      updateWeatherUI(data.currentWeather);
    } catch (error) {
      showError("Failed to fetch weather data: " + error.message);
    }
    hideLoadingSkeleton();
  }

  async function fetchWeatherForSelectedDate() {
    showLoadingSkeleton();
    try {
      const query = `
        query WeatherByDay($day: String!) {
          weatherByDay(day: $day) {
            temp
            date
            wind
          }
        }
      `;

      const data = await executeGraphQL(query, { day: selectedDate });
      updateWeatherUI(data.weatherByDay);
    } catch (error) {
      showError("Failed to fetch weather data: " + error.message);
    }
    hideLoadingSkeleton();
  }

  async function fetchWeatherForCurrentDate() {
    selectedDate = formatDateYYYYMMDD(new Date());
    datePicker.setDate(selectedDate);
    await fetchCurrentWeather();
    if (currentUser) {
      await fetchEventsForDate();
    }
  }

  async function fetchEventsForDate() {
    try {
      const query = `
        query GetWeatherEvents($day: String) {
          weatherEvents(day: $day) {
            id
            day
            event
            userId
            username
            createdAt
          }
        }
      `;

      const data = await executeGraphQL(query, { day: selectedDate }, true);
      events = data.weatherEvents;
      updateEventsUI();
    } catch (error) {
      showError("Failed to fetch weather notes: " + error.message);
    }
  }

  async function createEvent(event) {
    try {
      const query = `
        mutation CreateEvent($day: String!, $event: String!) {
          createWeatherEvent(day: $day, event: $event) {
            id
            day
            event
            userId
            username
            createdAt
          }
        }
      `;

      const data = await executeGraphQL(query, { day: selectedDate, event }, true);
      events.push(data.createWeatherEvent);
      updateEventsUI();
      showSuccess("Note added successfully");
    } catch (error) {
      showError("Failed to add note: " + error.message);
    }
  }
  async function updateEvent(id, event) {
    try {
      const query = `
        mutation UpdateEvent($id: Int!, $event: String!) {
          updateWeatherEvent(id: $id, event: $event) {
            id
            day
            event
            userId
            username
            createdAt
          }
        }
      `;

      // Parse id to integer to fix the GraphQL error      const parsedId = parseInt(id, 10);
      // Parse id to integer to fix the GraphQL error
      const parsedId = parseInt(id, 10);
      const data = await executeGraphQL(query, { id: parsedId, event }, true);
      const index = events.findIndex((e) => e.id === parsedId);
      if (index !== -1) {
        events[index] = {
          ...events[index],
          ...data.updateWeatherEvent,
        };
      }
      updateEventsUI();
      showSuccess("Note updated successfully");
    } catch (error) {
      showError("Failed to update note: " + error.message);
    }
  }
  async function deleteEvent(id) {
    try {
      const query = `
        mutation DeleteEvent($id: Int!) {
          deleteWeatherEvent(id: $id) {
            message
            event {
              id
            }
          }
        }
      `;

      // Parse ID to integer to fix GraphQL error
      const parsedId = parseInt(id, 10);
      await executeGraphQL(query, { id: parsedId }, true);
      events = events.filter((e) => e.id !== parsedId);
      updateEventsUI();
      showSuccess("Note deleted successfully");
    } catch (error) {
      showError("Failed to delete note: " + error.message);
    }
  }

  async function registerUser(username, password, isAdmin) {
    try {
      const query = `
        mutation Register($username: String!, $password: String!, $isAdmin: Boolean) {
          register(username: $username, password: $password, isAdmin: $isAdmin) {
            message
            token
            user {
              id
              username
              isAdmin
            }
          }
        }
      `;

      const data = await executeGraphQL(query, { username, password, isAdmin });
      userToken = data.register.token;
      currentUser = data.register.user;
      setTokenCookie(userToken);
      updateAuthUI();
      await fetchEventsForDate();
      showSuccess("Registration successful!");

      // Close modal
      const authModal = bootstrap.Modal.getInstance(document.getElementById("authModal"));
      authModal.hide();
    } catch (error) {
      showError("Registration failed: " + error.message);
    }
  }

  async function loginUser(username, password) {
    try {
      const query = `
        mutation Login($username: String!, $password: String!) {
          login(username: $username, password: $password) {
            message
            token
            user {
              id
              username
              isAdmin
            }
          }
        }
      `;

      const data = await executeGraphQL(query, { username, password });
      userToken = data.login.token;
      currentUser = data.login.user;
      setTokenCookie(userToken);
      updateAuthUI();
      await fetchEventsForDate();
      showSuccess("Login successful!");

      // Close modal
      const authModal = bootstrap.Modal.getInstance(document.getElementById("authModal"));
      authModal.hide();
    } catch (error) {
      showError("Login failed: " + error.message);
    }
  }

  async function logoutUser() {
    try {
      const query = `
        mutation {
          logout {
            message
          }
        }
      `;

      await executeGraphQL(query, {}, true);
      currentUser = null;
      userToken = null;
      removeTokenCookie();
      updateAuthUI();
      showSuccess("Logout successful!");
    } catch (error) {
      // Even if logout fails on server, clear local data
      currentUser = null;
      userToken = null;
      removeTokenCookie();
      updateAuthUI();
    }
  }

  async function fetchAdminData() {
    try {
      const query = `
        query {
          allData {
            users {
              id
              username
              isAdmin
            }
            events {
              id
              day
              event
              userId
              username
              createdAt
            }
          }
        }
      `;

      const data = await executeGraphQL(query, {}, true);
      updateAdminUI(data.allData);
    } catch (error) {
      showError("Failed to fetch admin data: " + error.message);
    }
  }

  // UI update functions
  function updateWeatherUI(data) {
    if (!data) return;

    temperatureEl.textContent = data.temp;
    weatherDateEl.textContent = data.date;
    windSpeedEl.textContent = data.wind;

    // Set temperature category
    let category = "";
    if (data.temp <= 0) category = "Freezing";
    else if (data.temp <= 10) category = "Cold";
    else if (data.temp <= 20) category = "Mild";
    else if (data.temp <= 30) category = "Warm";
    else category = "Hot";
    tempCategoryEl.textContent = category;

    // Set temperature icon
    setTemperatureIcon(data.temp);

    // Update card style based on date
    const weatherCard = document.getElementById("currentWeatherCard");
    if (weatherCard) {
      // Remove all card type classes
      weatherCard.classList.remove("weather-app-today-card", "weather-app-past-card", "weather-app-forecast-card");

      // Check if the date is today, past, or future
      const today = formatDateYYYYMMDD(new Date());

      if (data.date === today) {
        weatherCard.classList.add("weather-app-today-card");
      } else if (data.date < today) {
        weatherCard.classList.add("weather-app-past-card");
      } else {
        weatherCard.classList.add("weather-app-forecast-card");
      }
    }

    // Display wind direction and speed if available in data
    if (data.wind && windDirectionEl) {
      if (typeof data.wind === "object" && data.wind.direction) {
        windDirectionEl.textContent = data.wind.direction;
        setWindDirectionIcon(data.wind.direction);
      }

      // Add wind speed icon
      if (windSpeedEl) {
        setWindSpeedIcon(typeof data.wind === "object" ? data.wind.speed : data.wind);
      }
    }

    // Set humidity if available
    if (data.humidity && humidityEl) {
      humidityEl.textContent = data.humidity;
    } else if (humidityEl) {
      humidityEl.parentElement.style.display = "none";
    }
  }

  function setWindDirectionIcon(direction) {
    if (!windDirectionIconEl) return;

    // Reset classes
    windDirectionIconEl.className = "fas fa-location-arrow me-2";

    // Apply rotation based on wind direction
    switch (direction) {
      case "N":
        windDirectionIconEl.style.transform = "rotate(0deg)";
        break;
      case "NE":
        windDirectionIconEl.style.transform = "rotate(45deg)";
        break;
      case "E":
        windDirectionIconEl.style.transform = "rotate(90deg)";
        break;
      case "SE":
        windDirectionIconEl.style.transform = "rotate(135deg)";
        break;
      case "S":
        windDirectionIconEl.style.transform = "rotate(180deg)";
        break;
      case "SW":
        windDirectionIconEl.style.transform = "rotate(225deg)";
        break;
      case "W":
        windDirectionIconEl.style.transform = "rotate(270deg)";
        break;
      case "NW":
        windDirectionIconEl.style.transform = "rotate(315deg)";
        break;
      default:
        windDirectionIconEl.style.transform = "rotate(0deg)";
    }
  }

  function setWindSpeedIcon(speed) {
    if (!document.getElementById("windSpeedIcon")) return;

    const icon = document.getElementById("windSpeedIcon");
    // Reset classes
    icon.className = "fas me-2";

    // Set icon based on wind speed
    if (speed < 10) {
      icon.classList.add("fa-breeze");
      icon.classList.add("fa-wind");
    } else if (speed < 20) {
      icon.classList.add("fa-wind");
    } else {
      icon.classList.add("fa-wind");
      icon.style.animation = "fa-beat 1s infinite";
    }
  }

  function setTemperatureIcon(temp) {
    if (!temperatureIconEl) return;

    // Reset classes
    temperatureIconEl.className = "fas me-2";

    // Set icon based on temperature
    if (temp <= 0) {
      temperatureIconEl.classList.add("fa-snowflake");
    } else if (temp <= 10) {
      temperatureIconEl.classList.add("fa-thermometer-quarter");
    } else if (temp <= 20) {
      temperatureIconEl.classList.add("fa-thermometer-half");
    } else if (temp <= 30) {
      temperatureIconEl.classList.add("fa-thermometer-three-quarters");
    } else {
      temperatureIconEl.classList.add("fa-thermometer-full");
    }
  }

  function updateEventsUI() {
    if (!eventsListEl) return;

    eventsListEl.innerHTML = "";

    if (events.length === 0) {
      if (noEventsMessageEl) noEventsMessageEl.style.display = "block";
      return;
    }

    if (noEventsMessageEl) noEventsMessageEl.style.display = "none";

    events.forEach((event) => {
      const eventEl = document.createElement("div");
      eventEl.className = "weather-app-event-card";

      const date = new Date(event.createdAt);
      const formattedDate = date.toLocaleString();

      eventEl.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <p class="mb-1">${event.event}</p>
            <small class="text-muted">Added by ${event.username} on ${formattedDate}</small>
          </div>
          <div>
            <button class="btn btn-sm btn-outline-secondary me-1 edit-event-btn" data-id="${event.id}" data-event="${event.event}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger delete-event-btn" data-id="${event.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;

      eventsListEl.appendChild(eventEl);

      // Add event listeners for edit and delete buttons
      eventEl.querySelector(".edit-event-btn").addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        const eventText = e.currentTarget.getAttribute("data-event");
        editNoteIdEl.value = id;
        editNoteTextEl.value = eventText;

        const editModal = new bootstrap.Modal(document.getElementById("editNoteModal"));
        editModal.show();
      });

      eventEl.querySelector(".delete-event-btn").addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        // Show custom delete confirmation modal
        const deleteConfirmModal = document.getElementById("deleteConfirmModal");
        // We'll get a linter warning for bootstrap, but it works at runtime
        const deleteModal = new bootstrap.Modal(deleteConfirmModal);
        const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

        // Store the event ID for the confirmation button
        confirmDeleteBtn.setAttribute("data-id", id);

        // Show the modal
        deleteModal.show();
      });
    });
  }

  function updateAdminUI(data) {
    if (!data) return;

    const { users, events } = data;

    // Update stats
    totalUsersEl.textContent = users.length;
    totalNotesEl.textContent = events.length;
    totalAdminsEl.textContent = users.filter((user) => user.isAdmin).length;

    // Calculate average notes per user
    const usersWithNotes = {};
    events.forEach((event) => {
      usersWithNotes[event.userId] = (usersWithNotes[event.userId] || 0) + 1;
    });

    const userCount = Object.keys(usersWithNotes).length || 1;
    const avg = (events.length / userCount).toFixed(1);
    avgNotesPerUserEl.textContent = avg;

    // Update users list
    usersListEl.innerHTML = "";
    users.forEach((user) => {
      const userEl = document.createElement("li");
      userEl.className = "list-group-item d-flex justify-content-between align-items-center";
      userEl.innerHTML = `
        <span>${user.username}</span>
        <span class="badge bg-${user.isAdmin ? "danger" : "primary"} rounded-pill">
          ${user.isAdmin ? "Admin" : "User"}
        </span>
      `;
      usersListEl.appendChild(userEl);
    });

    // Update all events list
    allEventsListEl.innerHTML = "";
    events.forEach((event) => {
      const eventEl = document.createElement("li");
      eventEl.className = "list-group-item";
      const date = new Date(event.createdAt);
      eventEl.innerHTML = `
        <div>
          <p class="mb-1"><strong>${event.event}</strong></p>
          <small class="d-block text-muted">
            By ${event.username} on ${event.day}
          </small>
          <small class="text-muted">Created: ${date.toLocaleString()}</small>
        </div>
      `;
      allEventsListEl.appendChild(eventEl);
    });
  }
  function updateAuthUI() {
    if (currentUser) {
      // Show logged in content
      loggedInContentEls.forEach((el) => (el.style.display = "block"));
      loggedOutContentEls.forEach((el) => (el.style.display = "none"));

      // Update user welcome message
      if (userWelcomeEl) {
        userWelcomeEl.innerHTML = `<i class="fas fa-user-circle"></i> Welcome, ${currentUser.username}${
          currentUser.isAdmin ? ' <span class="badge bg-danger">Admin</span>' : ""
        }!`;
      }

      // Show/hide admin links
      if (adminDashboardLinkEl) {
        if (currentUser.isAdmin) {
          adminDashboardLinkEl.style.display = "block";
        } else {
          adminDashboardLinkEl.style.display = "none";
        }
      }
    } else {
      // Show logged out content
      loggedInContentEls.forEach((el) => (el.style.display = "none"));
      loggedOutContentEls.forEach((el) => (el.style.display = "block"));

      // Hide admin dashboard if it's open
      if (adminDashboardEl) {
        adminDashboardEl.style.display = "none";
      }

      // Show main content
      if (mainContentEl) {
        mainContentEl.classList.remove("weather-app-hidden");
      }
    }
  }

  // Helper functions
  function showError(message) {
    if (errorToastMessageEl) {
      errorToastMessageEl.textContent = message;
      errorToast.show();
    } else {
      alert(`Error: ${message}`);
    }
  }

  function showSuccess(message) {
    if (successToastMessageEl) {
      successToastMessageEl.textContent = message;
      successToast.show();
    }
  }

  function showAdminDashboard() {
    if (adminDashboardEl && mainContentEl) {
      adminDashboardEl.style.display = "block";
      mainContentEl.classList.add("weather-app-hidden");
      fetchAdminData();
    }
  }

  function hideAdminDashboard() {
    if (adminDashboardEl && mainContentEl) {
      adminDashboardEl.style.display = "none";
      mainContentEl.classList.remove("weather-app-hidden");
    }
  }

  // Check if user is already logged in
  async function checkAuthentication() {
    const token = getTokenFromCookie();

    if (token) {
      try {
        userToken = token;
        const query = `
          query {
            currentUser {
              id
              username
              isAdmin
            }
          }
        `;

        const data = await executeGraphQL(query, {}, true);
        currentUser = data.currentUser;
        updateAuthUI();
        fetchEventsForDate();
      } catch (error) {
        console.error("Authentication check failed:", error);
        // Clear invalid token
        userToken = null;
        removeTokenCookie();
      }
    }

    updateAuthUI();
  }

  // Event listeners
  if (loginFormEl) {
    loginFormEl.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("loginUsername").value;
      const password = document.getElementById("loginPassword").value;
      await loginUser(username, password);
    });
  }

  if (registerFormEl) {
    registerFormEl.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("registerUsername").value;
      const password = document.getElementById("registerPassword").value;
      const isAdmin = document.getElementById("registerAdmin").checked;
      await registerUser(username, password, isAdmin);
    });
  }

  if (eventFormEl) {
    eventFormEl.addEventListener("submit", async (e) => {
      e.preventDefault();
      const eventText = eventTextEl.value.trim();

      if (eventText.length < 3 || eventText.length > 256) {
        eventTextEl.classList.add("is-invalid", "shake-animation");
        setTimeout(() => {
          eventTextEl.classList.remove("shake-animation");
        }, 500);
        return;
      }

      eventTextEl.classList.remove("is-invalid");
      await createEvent(eventText);
      eventTextEl.value = "";
    });
  }

  if (editNoteFormEl) {
    editNoteFormEl.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = parseInt(editNoteIdEl.value);
      const text = editNoteTextEl.value.trim();

      if (text.length < 3 || text.length > 256) {
        editNoteTextEl.classList.add("is-invalid", "shake-animation");
        setTimeout(() => {
          editNoteTextEl.classList.remove("shake-animation");
        }, 500);
        return;
      }

      editNoteTextEl.classList.remove("is-invalid");
      await updateEvent(id, text);

      // Close modal
      const editModal = bootstrap.Modal.getInstance(document.getElementById("editNoteModal"));
      editModal.hide();
    });
  }

  if (logoutBtnEl) {
    logoutBtnEl.addEventListener("click", async (e) => {
      e.preventDefault();
      await logoutUser();
    });
  }

  if (adminDashboardLinkEl) {
    adminDashboardLinkEl.addEventListener("click", (e) => {
      e.preventDefault();
      showAdminDashboard();
    });
  }

  if (closeAdminBtnEl) {
    closeAdminBtnEl.addEventListener("click", () => {
      hideAdminDashboard();
    });
  }

  if (returnToAppBtnEl) {
    returnToAppBtnEl.addEventListener("click", () => {
      hideAdminDashboard();
    });
  }

  // Authentication modal tab switching
  if (switchToRegisterBtn) {
    switchToRegisterBtn.addEventListener("click", () => {
      document.getElementById("loginForm").style.display = "none";
      document.getElementById("registerForm").style.display = "block";
      document.getElementById("authTitle").textContent = "Register";
    });
  }

  if (switchToLoginBtn) {
    switchToLoginBtn.addEventListener("click", () => {
      document.getElementById("registerForm").style.display = "none";
      document.getElementById("loginForm").style.display = "block";
      document.getElementById("authTitle").textContent = "Login";
    });
  }

  // Date navigation
  document.getElementById("prevDayBtn")?.addEventListener("click", () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    selectedDate = formatDateYYYYMMDD(date);
    datePicker.setDate(selectedDate);
    fetchWeatherForSelectedDate();
    if (currentUser) {
      fetchEventsForDate();
    }
  });

  document.getElementById("nextDayBtn")?.addEventListener("click", () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    selectedDate = formatDateYYYYMMDD(date);
    datePicker.setDate(selectedDate);
    fetchWeatherForSelectedDate();
    if (currentUser) {
      fetchEventsForDate();
    }
  });
  // Refresh weather button in navbar
  document.getElementById("refreshWeatherBtn")?.addEventListener("click", async () => {
    await fetchWeatherForSelectedDate();
    if (currentUser) {
      await fetchEventsForDate();
    }
    showSuccess("Weather data refreshed!");
  });

  // Card refresh button
  document.getElementById("cardRefreshBtn")?.addEventListener("click", async () => {
    const refreshIcon = document.querySelector("#cardRefreshBtn i");
    refreshIcon.classList.add("fa-spin");

    await fetchWeatherForSelectedDate();
    if (currentUser) {
      await fetchEventsForDate();
    }

    // Stop spinning after refresh
    setTimeout(() => {
      refreshIcon.classList.remove("fa-spin");
    }, 500);
  });

  // Initialize app
  fetchWeatherForCurrentDate();
  checkAuthentication();
  // Setup delete confirmation modal handler
  document.getElementById("confirmDeleteBtn").addEventListener("click", function () {
    const id = this.getAttribute("data-id");
    if (id) {
      deleteEvent(parseInt(id, 10));
      // Hide the modal after confirming delete - bootstrap will be available at runtime
      const deleteModal = document.getElementById("deleteConfirmModal");
      const bsModal = bootstrap.Modal.getInstance(deleteModal);
      bsModal.hide();
    }
  });
});
