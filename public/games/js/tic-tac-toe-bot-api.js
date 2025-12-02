const API_BASE = "/api/games/tic-tac-toe-bot";

const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");
const clearSessionButton = document.getElementById("clear-session-button");
const difficultySelect = document.getElementById("difficulty");
const cells = document.querySelectorAll(".cell");
const playerXScore = document.getElementById("player-x-score");
const playerOScore = document.getElementById("player-o-score");
const messageLbl = document.getElementById("messageLbl");
const sessionIdDisplay = document.getElementById("sessionIdDisplay");
const board = document.getElementById("t-board");
const userInfo = document.getElementById("userInfo");
const userDisplay = document.getElementById("userDisplay");
const gamesPlayedDisplay = document.getElementById("gamesPlayedDisplay");

let isLoading = false;

// Helper to get auth token from localStorage (if user is logged in)
function getAuthToken() {
  try {
    // Prefer token stored in localStorage (some parts of app use it)
    const localToken = localStorage.getItem("token");
    if (localToken) return localToken;

    // Fallback to cookie named 'token' (some login flows set cookie only)
    const tokenCookie = (document.cookie || "")
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("token="));
    if (tokenCookie) {
      return tokenCookie.split("=")[1] || null;
    }

    return null;
  } catch (e) {
    return null;
  }
}

// Helper function to make API calls
async function apiCall(endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Important: include cookies
  };

  // Add authorization header if user is logged in
  const token = getAuthToken();
  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "API request failed");
    }

    return data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("API Error:", error);
    throw error;
  }
}

// Small helper to show a confirmation modal and return a boolean
function showConfirmDialog(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const box = document.createElement("div");
    box.className = "modal-box";
    box.innerHTML = `<p>${message}</p>`;

    const actions = document.createElement("div");
    actions.className = "modal-actions";

    const btnYes = document.createElement("button");
    btnYes.className = "btn-confirm";
    btnYes.textContent = "Yes";

    const btnNo = document.createElement("button");
    btnNo.className = "btn-cancel";
    btnNo.textContent = "No";

    actions.appendChild(btnYes);
    actions.appendChild(btnNo);
    box.appendChild(actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    function cleanup() {
      overlay.remove();
      window.removeEventListener("keydown", onKey);
    }

    btnYes.addEventListener("click", () => {
      cleanup();
      resolve(true);
    });
    btnNo.addEventListener("click", () => {
      cleanup();
      resolve(false);
    });

    function onKey(e) {
      if (e.key === "Escape") {
        cleanup();
        resolve(false);
      }
      if (e.key === "Enter") {
        cleanup();
        resolve(true);
      }
    }
    window.addEventListener("keydown", onKey);
  });
}

function setLoading(loading) {
  isLoading = loading;
  if (loading) {
    board.classList.add("loading");
  } else {
    board.classList.remove("loading");
  }
}

function updateUI(gameState) {
  // Update session ID display
  if (gameState.sessionId) {
    sessionIdDisplay.textContent = gameState.sessionId;
    sessionIdDisplay.title = gameState.sessionId; // Show full ID on hover
  }

  // Update user info display
  if (gameState.user) {
    userInfo.style.display = "inline";
    const displayName = gameState.user.firstname
      ? `${gameState.user.firstname} ${gameState.user.lastname || ""}`
      : gameState.user.email;
    userDisplay.textContent = displayName;
    userDisplay.title = gameState.user.email;
    userDisplay.className = "user-logged-in";
  } else {
    userInfo.style.display = "inline";
    userDisplay.textContent = "Guest";
    userDisplay.title = "Not logged in";
    userDisplay.className = "user-guest";
  }

  // Update games played
  if (gamesPlayedDisplay && gameState.gamesPlayed !== undefined) {
    gamesPlayedDisplay.textContent = gameState.gamesPlayed;
  }

  // Update scores
  playerXScore.textContent = gameState.playerXScore;
  playerOScore.textContent = gameState.playerOScore;

  // Update board
  cells.forEach((cell) => {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const value = gameState.board[row][col];
    cell.textContent = value;

    // Update cell accessibility
    if (value === "") {
      cell.setAttribute("aria-label", `Empty cell, row ${row + 1}, column ${col + 1}`);
    } else {
      cell.setAttribute("aria-label", `${value}, row ${row + 1}, column ${col + 1}`);
    }
  });

  // Update message - use server message if available, otherwise compute defaults from state
  if (gameState.message) {
    messageLbl.textContent = gameState.message;
  } else {
    // Compute default message
    if (!gameState.gameActive) {
      if (gameState.winner === "X") {
        messageLbl.textContent = "You won!";
      } else if (gameState.winner === "O") {
        messageLbl.textContent = "Bot won!";
      } else if (gameState.isDraw) {
        messageLbl.textContent = "It's a draw!";
      } else {
        messageLbl.textContent = "Click 'Start' to play!";
      }
    } else {
      if (gameState.currentPlayer === "X") {
        messageLbl.textContent = "Your turn (X).";
      } else if (gameState.currentPlayer === "O") {
        messageLbl.textContent = "Bot is thinking...";
      } else {
        messageLbl.textContent = "Game in progress.";
      }
    }
  }

  // Update button states
  startButton.disabled = !!gameState.gameActive;
  stopButton.disabled = !gameState.gameActive;
  if (difficultySelect) difficultySelect.disabled = !!gameState.gameActive;

  // Update visual states (class + aria-disabled) to improve UX
  startButton.classList.toggle("is-disabled", !!gameState.gameActive);
  startButton.setAttribute("aria-disabled", !!gameState.gameActive);
  stopButton.classList.toggle("is-disabled", !gameState.gameActive);
  stopButton.setAttribute("aria-disabled", !gameState.gameActive);
  if (difficultySelect) {
    difficultySelect.classList.toggle("is-disabled", !!gameState.gameActive);
    difficultySelect.setAttribute("aria-disabled", !!gameState.gameActive);
  }

  // Update cells interactivity
  cells.forEach((cell) => {
    if (gameState.gameActive && cell.textContent === "") {
      cell.classList.remove("disabled");
    } else {
      cell.classList.add("disabled");
    }
  });
}

async function initSession() {
  try {
    setLoading(true);
    const gameState = await apiCall("/session");
    updateUI(gameState);

    // Sync difficulty select with session
    if (difficultySelect && gameState.difficulty) {
      difficultySelect.value = gameState.difficulty;
    }

    if (!gameState.gameActive) {
      messageLbl.textContent = "Click 'Start New Game' to play!";
    }

    // If client has a token but server returned guest session, try to attach the user to session
    await attachUserToSessionIfNeeded(gameState);
  } catch (error) {
    messageLbl.textContent = "Failed to load session. Please refresh.";
    // eslint-disable-next-line no-console
    console.error("Init session error:", error);
  } finally {
    setLoading(false);
  }
}

// Try to attach logged-in user to a server session if a token exists but session is guest
async function attachUserToSessionIfNeeded(gameState) {
  try {
    const token = getAuthToken();
    if (!token) return;
    if (gameState && gameState.user) return;

    try {
      // Attempt to get user info from users endpoint first
      let fetchedUser = null;
      if (typeof getId === "function") {
        const id = getId();
        if (id) {
          fetchedUser = await getUserInfoFromUsersEndpoint(id);
        }
      }

      // If we managed to fetch user info (via users endpoint), attach it to session
      if (fetchedUser) {
        // The server's /session/user relies on Authorization header to verify + bind user
        await apiCall("/session/user", "POST");
        // Update UI with fetched user
        updateUI({ ...gameState, user: fetchedUser });
      } else {
        // If not, fallback to request server to attach user using token
        const resp = await apiCall("/session/user", "POST");
        if (resp?.user) {
          // Re-fetch session after updating user info
          const updatedState = await apiCall("/session");
          updateUI(updatedState);
        }
      }
    } catch (err) {
      // ignore failures here - token might be expired or invalid
    }
  } catch (err) {
    // ignore
  }
}

// Fetch user details from the users endpoint by ID using Authorization token if present
async function getUserInfoFromUsersEndpoint(id) {
  try {
    if (!id) return null;
    const headers = {
      "Content-Type": "application/json",
    };
    const token = getAuthToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`/api/users/${id}`, { method: "GET", headers, credentials: "include" });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data;
  } catch (e) {
    return null;
  }
}

async function startGame() {
  try {
    setLoading(true);
    const difficulty = difficultySelect ? difficultySelect.value : "easy";
    const gameState = await apiCall("/start", "POST", { difficulty });
    updateUI(gameState);
  } catch (error) {
    messageLbl.textContent = "Failed to start game: " + error.message;
  } finally {
    setLoading(false);
  }
}

async function stopGame() {
  try {
    setLoading(true);
    const gameState = await apiCall("/stop", "POST");
    updateUI(gameState);
  } catch (error) {
    messageLbl.textContent = "Failed to stop game: " + error.message;
  } finally {
    setLoading(false);
  }
}

async function clearSession() {
  const confirmed = await showConfirmDialog("Are you sure you want to clear your session? This will reset all scores.");
  if (!confirmed) {
    return;
  }

  try {
    setLoading(true);
    await apiCall("/session", "DELETE");

    // Reset UI
    cells.forEach((cell) => {
      cell.textContent = "";
      cell.classList.add("disabled");
    });
    playerXScore.textContent = "0";
    playerOScore.textContent = "0";

    // Reload session to get new one
    await initSession();
    messageLbl.textContent = "Session cleared! Click 'Start New Game' to play.";
  } catch (error) {
    messageLbl.textContent = "Failed to clear session: " + error.message;
  } finally {
    setLoading(false);
  }
}

async function handleCellClick(event) {
  if (isLoading) return;

  const cell = event.target;
  if (cell.classList.contains("disabled")) return;
  if (cell.textContent !== "") return;

  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);

  try {
    setLoading(true);

    // Immediately show player's move for better UX
    cell.textContent = "X";
    cell.classList.add("disabled");
    messageLbl.textContent = "Bot is thinking...";

    const gameState = await apiCall("/move", "POST", { row, col });
    updateUI(gameState);
  } catch (error) {
    // Revert the move if there was an error
    await initSession();
    messageLbl.textContent = "Move failed: " + error.message;
  } finally {
    setLoading(false);
  }
}

// Event listeners
startButton.addEventListener("click", startGame);
stopButton.addEventListener("click", stopGame);
clearSessionButton.addEventListener("click", clearSession);

cells.forEach((cell) => {
  cell.addEventListener("click", handleCellClick);

  // Keyboard support
  cell.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleCellClick(event);
    }
  });
});

// Initialize session on page load
document.addEventListener("DOMContentLoaded", initSession);

// If localStorage token is added/removed (login/logout) in other tabs, attach/detach user
window.addEventListener("storage", async (e) => {
  if (e.key === "token") {
    if (e.newValue) {
      // token added or changed
      try {
        await apiCall("/session/user", "POST");
        await initSession();
      } catch (err) {
        // ignore
      }
    } else {
      // token removed -> user logged out, clear session user
      try {
        await apiCall("/session/user", "DELETE");
        await initSession();
      } catch (err) {
        // ignore
      }
    }
  }
});
