const { isUndefined } = require("../../helpers/compare.helpers");
const { generateWeatherAppV1Response } = require("../../helpers/generators/weather.generator");
const { formatErrorResponse, generateUuid } = require("../../helpers/helpers");
const { logDebug } = require("../../helpers/logger-api");
const { HTTP_OK, HTTP_BAD_REQUEST, HTTP_NOT_FOUND, HTTP_UNAUTHORIZED } = require("../../helpers/response.helpers");

// In-memory storage for weather data and events
let weatherEvents = [];
let users = [];
let sessions = {};
// Counter for event IDs
let nextEventId = 1;

// Authentication middleware
function authenticate(req, res, next) {
  // Check for token in cookie
  const token = req.cookies?.weatherAppSession;

  if (!token || !sessions[token]) {
    return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Unauthorized! Please login."));
  }

  req.user = sessions[token];
  return next(req, res);
}

// Admin check middleware
function adminOnly(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Admin access required!"));
  }

  return next(req, res);
}

/*
Scopes:
1. minimal data (temp, date, wind speed)
   - Example: { "temp": 17, "date": "2025-05-08", "wind": 22 }
2.  data (temp, humidity, date, wind speed, wind direction)
   - Example: { "temp": 17, "humidity": 58, "date": "2025-05-08", "wind": { "speed": 22, "direction": "NW" } }
Default.  full data (all weather data for the day)
   - Example: { "temp": 17, "humidity": 58, "date": "2025-05-08", "wind": { "speed": 22, "direction": "NW" }, ... }
*/
function getWeatherData(day, scope = 1, historicalStable = true) {
  const data = generateWeatherAppV1Response({ date: day, historicalStable });
  let result;

  switch (scope) {
    case 1:
      result = {
        temp: data.temp,
        date: data.date,
        wind: data.wind.speed,
      };
      break;
    case 2:
      result = {
        temp: data.temp,
        humidity: data.humidity,
        date: data.date,
        wind: {
          speed: data.wind.speed,
          direction: data.wind.direction,
        },
      };
      break;
    default:
      result = data;
  }

  return result;
}

// Weather API handlers
function getCurrentWeather(req, res) {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  return res.status(HTTP_OK).json(getWeatherData(today));
}

function getWeatherByDay(req, res) {
  const { day } = req.body;

  if (isUndefined(day)) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Day parameter is required!"));
  }

  return res.status(HTTP_OK).json(getWeatherData(day));
}

function createWeatherEvent(req, res) {
  const { day, event } = req.body;

  if (isUndefined(day) || isUndefined(event)) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Day and event parameters are required!"));
  }

  // Validate note length (3-256 characters)
  if (event.length < 3 || event.length > 256) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Note must be between 3 and 256 characters!"));
  }

  if (!req.user) {
    return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("You must be logged in to create events!"));
  }

  const newEvent = {
    id: nextEventId++, // Use incrementing ID instead of UUID
    day,
    event,
    userId: req.user.id,
    username: req.user.username,
    createdAt: new Date().toISOString(),
  };

  weatherEvents.push(newEvent);
  logDebug("weatherApp:createEvent", { event: newEvent });

  return res.status(HTTP_OK).json(newEvent);
}

// Get event by ID
function getWeatherEventById(req, res) {
  const { id } = req.params;

  if (isUndefined(id)) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("ID parameter is required!"));
  }

  // Convert string ID to number for comparison
  const eventId = parseInt(id, 10);

  if (isNaN(eventId)) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Invalid ID format!"));
  }

  const event = weatherEvents.find((item) => item.id === eventId);

  if (!event) {
    return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Event not found!"));
  }

  // Check if user has permission to view this event (own events or admin)
  if (event.userId !== req.user.id && !req.user.isAdmin) {
    return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("You can only view your own events!"));
  }

  return res.status(HTTP_OK).json(event);
}

function getWeatherEvents(req, res) {
  const { day } = req.query;

  if (!req.user) {
    return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("You must be logged in to view events!"));
  }

  let filteredEvents = weatherEvents;

  if (day) {
    filteredEvents = filteredEvents.filter((event) => event.day === day);
  }

  filteredEvents = filteredEvents.filter((event) => event.userId === req.user.id);

  return res.status(HTTP_OK).json(filteredEvents);
}

function updateWeatherEvent(req, res) {
  const { id, event } = req.body;

  if (isUndefined(id) || isUndefined(event)) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("ID and event parameters are required!"));
  }

  // Validate note length (3-256 characters)
  if (event.length < 3 || event.length > 256) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Note must be between 3 and 256 characters!"));
  }

  // Convert id to number if it's a string
  const eventId = typeof id === "string" ? parseInt(id, 10) : id;

  if (isNaN(eventId)) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Invalid ID format!"));
  }

  const eventIndex = weatherEvents.findIndex((item) => item.id === eventId);

  if (eventIndex === -1) {
    return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Event not found!"));
  }

  // Check if user owns the event or is admin
  if (weatherEvents[eventIndex].userId !== req.user.id && !req.user.isAdmin) {
    return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("You can only update your own events!"));
  }

  // Update the event
  weatherEvents[eventIndex].event = event;
  weatherEvents[eventIndex].updatedAt = new Date().toISOString();

  return res.status(HTTP_OK).json(weatherEvents[eventIndex]);
}

function deleteWeatherEvent(req, res) {
  const { id } = req.params;

  if (isUndefined(id)) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("ID parameter is required!"));
  }

  // Convert string ID to number for comparison
  const eventId = parseInt(id, 10);

  if (isNaN(eventId)) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Invalid ID format!"));
  }

  const eventIndex = weatherEvents.findIndex((item) => item.id === eventId);

  if (eventIndex === -1) {
    return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Event not found!"));
  }

  // Check if user owns the event or is admin
  if (weatherEvents[eventIndex].userId !== req.user.id && !req.user.isAdmin) {
    return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("You can only delete your own events!"));
  }

  const deletedEvent = weatherEvents.splice(eventIndex, 1)[0];

  return res.status(HTTP_OK).json({ message: "Event deleted successfully", event: deletedEvent });
}

// User authentication handlers
function register(req, res) {
  const { username, password, isAdmin } = req.body;

  if (isUndefined(username) || isUndefined(password)) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Username and password are required!"));
  }

  // Validate username (3-10 characters, only letters, numbers, and hyphens)
  if (username.length < 3 || username.length > 10) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Username must be between 3 and 10 characters!"));
  }

  // Check if username contains only allowed characters (letters, numbers, hyphen)
  const validUsernamePattern = /^[a-zA-Z0-9-]+$/;
  if (!validUsernamePattern.test(username)) {
    return res
      .status(HTTP_BAD_REQUEST)
      .send(formatErrorResponse("Username can only contain letters, numbers, and hyphens!"));
  }

  // Check if username already exists
  if (users.some((user) => user.username === username)) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Username already exists!"));
  }

  const newUser = {
    id: generateUuid(),
    username,
    password, // In a real app, this should be hashed
    isAdmin: !!isAdmin,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  logDebug("weatherApp:register", { username, isAdmin });

  return res.status(HTTP_OK).json({
    message: "Registration successful!",
    user: {
      id: newUser.id,
      username: newUser.username,
      isAdmin: newUser.isAdmin,
    },
  });
}

function login(req, res) {
  const { username, password } = req.body;

  if (isUndefined(username) || isUndefined(password)) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Username and password are required!"));
  }

  // Find user
  const user = users.find((user) => user.username === username && user.password === password);

  if (!user) {
    return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Invalid credentials!"));
  }

  // Create session
  const token = generateUuid();
  sessions[token] = {
    id: user.id,
    username: user.username,
    isAdmin: user.isAdmin,
  };

  // Set cookie for 30 minutes
  const thirtyMinutesInMs = 30 * 60 * 1000;
  const expiryDate = new Date(Date.now() + thirtyMinutesInMs);

  res.cookie("weatherAppSession", token, {
    expires: expiryDate,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Set secure in production
    sameSite: "strict",
  });

  logDebug("weatherApp:login", { username });

  return res.status(HTTP_OK).json({
    message: "Login successful!",
    token,
    user: {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
    },
  });
}

function logout(req, res) {
  const token = req.headers.authorization?.split(" ")[1];

  if (token && sessions[token]) {
    delete sessions[token];
  }

  // Clear the cookie
  res.clearCookie("weatherAppSession");

  return res.status(HTTP_OK).json({ message: "Logout successful!" });
}

// New function to get current user information
function getCurrentUser(req, res) {
  if (!req.user) {
    return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Not authenticated"));
  }

  return res.status(HTTP_OK).json({
    id: req.user.id,
    username: req.user.username,
    isAdmin: req.user.isAdmin,
  });
}

// Admin endpoints
function getAllData(req, res) {
  return res.status(HTTP_OK).json({
    users: users.map((u) => ({ id: u.id, username: u.username, isAdmin: u.isAdmin })),
    events: weatherEvents,
  });
}

module.exports = {
  // Middleware
  authenticate,
  adminOnly,

  // Weather endpoints
  getCurrentWeather,
  getWeatherByDay,
  createWeatherEvent,
  getWeatherEvents,
  getWeatherEventById,
  updateWeatherEvent,
  deleteWeatherEvent,

  // Auth endpoints
  register,
  login,
  logout,
  getCurrentUser,

  // Admin endpoints
  getAllData,
};
