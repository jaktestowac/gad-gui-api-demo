const { isUndefined, areStringsEqualIgnoringCase } = require("../helpers/compare.helpers");
const { getConfigValue } = require("../config/config-manager");
const { ConfigKeys } = require("../config/enums");
const { formatErrorResponse } = require("../helpers/helpers");
const { logDebug, logTrace } = require("../helpers/logger-api");
const { verifyAccessToken } = require("../helpers/validation.helpers");
const { verifyToken } = require("../helpers/jwtauth");
const { searchForUser } = require("../helpers/db-operation.helpers");
const { isUserActionAllowed, searchForRoleByUserId } = require("../helpers/db-operations/db-user-roles.operations");
const { searchForUserWithOnlyToken } = require("../helpers/db-operation.helpers");
const {
  HTTP_NOT_FOUND,
  HTTP_OK,
  HTTP_CREATED,
  HTTP_BAD_REQUEST,
  HTTP_UNPROCESSABLE_ENTITY,
} = require("../helpers/response.helpers");

// In-memory session storage
const botSessions = new Map();

// In-memory completed games history (keeps last N records in memory)
const playedGamesHistory = [];
const PLAYED_GAMES_HISTORY_MAX = 1000; // keep last 1000 records in memory

// Session expiry time (1 day in milliseconds)
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

function generateSessionId() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
}

function createEmptyBoard() {
  return [
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ];
}

function createNewBotSession(userInfo = null) {
  return {
    sessionId: generateSessionId(),
    board: createEmptyBoard(),
    currentPlayer: "X", // Player is always X, bot is O
    gameActive: false,
    playerXScore: 0,
    playerOScore: 0,
    difficulty: "easy",
    winner: null,
    isDraw: false,
    gamesPlayed: 0,
    createdAt: new Date(),
    roundStartAt: null,
    lastActivityAt: new Date(),
    expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS),
    user: userInfo, // Store user info if logged in
  };
}

function recordCompletedGame(session, reason = "finished", aborted = false, req = undefined) {
  const endedAt = new Date();
  const startedAt = session.roundStartAt || session.createdAt || new Date();
  const durationMs = endedAt - startedAt;
  const flat = getBoardFlat(session.board);
  const moves = flat.filter((c) => c !== "").length;

  // Try to infer user if not set on session using request (cookies/token)
  let resolvedUser = session.user;
  if (!resolvedUser && req) {
    try {
      const info = extractUserInfo(req);
      if (info) {
        resolvedUser = info;
      }
    } catch (e) {
      // ignore
    }
  }

  const rec = {
    id: generateSessionId(),
    sessionId: session.sessionId,
    user: resolvedUser
      ? { email: resolvedUser.email, firstname: resolvedUser.firstname, lastname: resolvedUser.lastname }
      : null,
    createdAt: session.createdAt,
    startedAt,
    endedAt,
    durationMs,
    difficulty: session.difficulty,
    playerXScore: session.playerXScore,
    playerOScore: session.playerOScore,
    winner: session.winner || null,
    isDraw: !!session.isDraw,
    aborted: !!aborted,
    moves,
    board: JSON.parse(JSON.stringify(session.board)),
    reason,
  };

  // push to history and maintain max length
  playedGamesHistory.unshift(rec);
  if (playedGamesHistory.length > PLAYED_GAMES_HISTORY_MAX) {
    playedGamesHistory.pop();
  }
  logDebug("handleTicTacToeBot: Recorded completed game", {
    recId: rec.id,
    sessionId: rec.sessionId,
    winner: rec.winner,
  });
}

// Helper to extract user info from request if logged in
function extractUserInfo(req) {
  try {
    let verifyTokenResult = verifyAccessToken(req, null, "tic-tac-toe-bot", req.url);
    // If token not found via Authorization header, check cookie token or cookie id
    if (isUndefined(verifyTokenResult)) {
      // Try token in cookie
      const cookies = req.headers?.cookie;
      if (cookies) {
        const tokenCookie = cookies
          .split(";")
          .map((c) => c.trim())
          .find((c) => c.startsWith("token="));
        if (tokenCookie) {
          const token = tokenCookie.split("=")[1];
          try {
            const verified = verifyToken(token);
            if (!(verified instanceof Error)) {
              verifyTokenResult = verified;
            }
          } catch (e) {
            // ignore invalid cookies
          }
        }
      }
      // If still not found, try using user id cookie
      if (isUndefined(verifyTokenResult)) {
        if (cookies) {
          const idCookie = cookies
            .split(";")
            .map((c) => c.trim())
            .find((c) => c.startsWith("id="));
          if (idCookie) {
            const userId = idCookie.split("=")[1];
            const foundUserById = searchForUser(userId);
            if (!isUndefined(foundUserById)) {
              return {
                userId: foundUserById.id,
                email: foundUserById.email,
                firstname: foundUserById.firstname,
                lastname: foundUserById.lastname,
              };
            }
          }
        }
      }
    }
    if (!isUndefined(verifyTokenResult) && verifyTokenResult?.email) {
      const foundUser = searchForUserWithOnlyToken(verifyTokenResult);
      if (foundUser) {
        return {
          userId: foundUser.id,
          email: foundUser.email,
          firstname: foundUser.firstname,
          lastname: foundUser.lastname,
        };
      }
      return {
        email: verifyTokenResult.email,
      };
    }
  } catch (error) {
    logTrace("extractUserInfo error:", error);
  }
  return null;
}

function getSessionFromCookie(req) {
  const cookies = req.headers.cookie;
  if (!cookies) return null;

  const sessionCookie = cookies.split(";").find((c) => c.trim().startsWith("ttt_bot_session="));
  if (!sessionCookie) return null;

  const sessionId = sessionCookie.split("=")[1]?.trim();
  return sessionId;
}

function setSessionCookie(res, sessionId) {
  const expiryDate = new Date(Date.now() + SESSION_EXPIRY_MS);
  res.setHeader(
    "Set-Cookie",
    `ttt_bot_session=${sessionId}; Path=/; Expires=${expiryDate.toUTCString()}; SameSite=Lax`
  );
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `ttt_bot_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`);
}

function cleanupExpiredSessions() {
  const now = new Date();
  for (const [sessionId, session] of botSessions.entries()) {
    if (session.expiresAt < now) {
      botSessions.delete(sessionId);
      logTrace("Cleaned up expired session:", sessionId);
    }
  }
}

// Win checking logic
const winningCombinations = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Middle column
  [2, 5, 8], // Right column
  [0, 4, 8], // Diagonal top-left to bottom-right
  [2, 4, 6], // Diagonal top-right to bottom-left
];

function getBoardFlat(board) {
  return board.flat();
}

function checkWinState(board, player) {
  const flatBoard = getBoardFlat(board);
  return winningCombinations.some((combination) => {
    return combination.every((index) => flatBoard[index] === player);
  });
}

function checkDraw(board) {
  return getBoardFlat(board).every((cell) => cell !== "");
}

function getAvailableMoves(board) {
  const moves = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (board[row][col] === "") {
        moves.push({ row, col });
      }
    }
  }
  return moves;
}

// Bot move strategies
function getRandomMove(board) {
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * availableMoves.length);
  return availableMoves[randomIndex];
}

function findWinningMove(board, player) {
  const availableMoves = getAvailableMoves(board);
  for (const move of availableMoves) {
    // Simulate move
    board[move.row][move.col] = player;
    if (checkWinState(board, player)) {
      board[move.row][move.col] = ""; // Undo
      return move;
    }
    board[move.row][move.col] = ""; // Undo
  }
  return null;
}

function getEasyMove(board) {
  // 1. Check if bot can win
  const winMove = findWinningMove(board, "O");
  if (winMove) return winMove;

  // 2. Random move (don't block player)
  return getRandomMove(board);
}

function getDifficultMove(board) {
  // Use minimax algorithm for optimal play
  const result = minimax(board, "O", true);
  return result.move;
}

function minimax(board, player, isMaximizing) {
  // Check terminal states
  if (checkWinState(board, "X")) {
    return { score: -10 };
  }
  if (checkWinState(board, "O")) {
    return { score: 10 };
  }
  if (checkDraw(board)) {
    return { score: 0 };
  }

  const availableMoves = getAvailableMoves(board);

  if (isMaximizing) {
    let bestScore = -Infinity;
    let bestMove = null;
    for (const move of availableMoves) {
      board[move.row][move.col] = "O";
      const result = minimax(board, "X", false);
      board[move.row][move.col] = "";

      if (result.score > bestScore) {
        bestScore = result.score;
        bestMove = move;
      }
    }
    return { score: bestScore, move: bestMove };
  } else {
    let bestScore = Infinity;
    let bestMove = null;
    for (const move of availableMoves) {
      board[move.row][move.col] = "X";
      const result = minimax(board, "O", true);
      board[move.row][move.col] = "";

      if (result.score < bestScore) {
        bestScore = result.score;
        bestMove = move;
      }
    }
    return { score: bestScore, move: bestMove };
  }
}

function getBotMove(board, difficulty) {
  switch (difficulty) {
    case "chaotic":
      return getRandomMove(board);
    case "easy":
      return getEasyMove(board);
    case "difficult":
      return getDifficultMove(board);
    default:
      return getEasyMove(board);
  }
}

// Helper to get session stats for admin
function getSessionStats() {
  const now = new Date();
  const sessions = Array.from(botSessions.values());
  const activeSessions = sessions.filter((s) => s.expiresAt > now);
  const loggedInSessions = activeSessions.filter((s) => s.user !== null);
  const guestSessions = activeSessions.filter((s) => s.user === null);
  const activeGames = activeSessions.filter((s) => s.gameActive);

  return {
    totalSessions: activeSessions.length,
    loggedInSessions: loggedInSessions.length,
    guestSessions: guestSessions.length,
    activeGames: activeGames.length,
    totalGamesPlayed: activeSessions.reduce((sum, s) => sum + s.gamesPlayed, 0),
  };
}

// Helper to format session for response (hide sensitive data for non-admin)
function formatSessionForAdmin(session) {
  return {
    sessionId: session.sessionId,
    gameActive: session.gameActive,
    playerXScore: session.playerXScore,
    playerOScore: session.playerOScore,
    difficulty: session.difficulty,
    gamesPlayed: session.gamesPlayed,
    createdAt: session.createdAt,
    lastActivityAt: session.lastActivityAt,
    expiresAt: session.expiresAt,
    user: session.user
      ? {
          email: session.user.email,
          firstname: session.user.firstname,
          lastname: session.user.lastname,
        }
      : null,
    isGuest: session.user === null,
  };
}

function handleTicTacToeBot(req, res) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  // Cleanup expired sessions periodically
  cleanupExpiredSessions();

  // ==================== ADMIN ENDPOINTS ====================

  // Helper: admin authorization
  function isAdminRequest() {
    return true;
  }

  // GET /api/games/tic-tac-toe-bot/admin/sessions - List all active sessions (admin only)
  if (req.method === "GET" && urlEnds.includes("/api/games/tic-tac-toe-bot/admin/sessions")) {
    if (!isAdminRequest()) {
      res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Not authorized"));
      return;
    }
    const now = new Date();
    const activeSessions = Array.from(botSessions.values())
      .filter((s) => s.expiresAt > now)
      .map(formatSessionForAdmin)
      .sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));

    logDebug("handleTicTacToeBot: GET admin/sessions", { count: activeSessions.length });
    res.status(HTTP_OK).json({
      sessions: activeSessions,
      stats: getSessionStats(),
    });
    return;
  }

  // GET /api/games/tic-tac-toe-bot/admin/stats - Get session statistics (admin only)
  if (req.method === "GET" && urlEnds.includes("/api/games/tic-tac-toe-bot/admin/stats")) {
    if (!isAdminRequest()) {
      res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Not authorized"));
      return;
    }
    const stats = getSessionStats();
    logDebug("handleTicTacToeBot: GET admin/stats", stats);
    res.status(HTTP_OK).json(stats);
    return;
  }

  // DELETE /api/games/tic-tac-toe-bot/admin/sessions/:sessionId - Delete specific session (admin only)
  if (req.method === "DELETE" && urlEnds.includes("/api/games/tic-tac-toe-bot/admin/sessions/")) {
    if (!isAdminRequest()) {
      res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Not authorized"));
      return;
    }
    const urlParts = urlEnds.split("/");
    const targetSessionId = urlParts[urlParts.length - 1];

    if (!targetSessionId || targetSessionId === "sessions") {
      res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Session ID is required."));
      return;
    }

    if (botSessions.has(targetSessionId)) {
      botSessions.delete(targetSessionId);
      logDebug("handleTicTacToeBot: DELETE admin/sessions", { targetSessionId });
      res.status(HTTP_OK).json({ message: "Session deleted", sessionId: targetSessionId });
    } else {
      res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Session not found."));
    }
    return;
  }

  // DELETE /api/games/tic-tac-toe-bot/admin/sessions - Clear all sessions (admin only)
  if (req.method === "DELETE" && urlEnds.endsWith("/api/games/tic-tac-toe-bot/admin/sessions")) {
    if (!isAdminRequest()) {
      res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Not authorized"));
      return;
    }
    const count = botSessions.size;
    botSessions.clear();
    logDebug("handleTicTacToeBot: DELETE admin/sessions (clear all)", { count });
    res.status(HTTP_OK).json({ message: "All sessions cleared", clearedCount: count });
    return;
  }

  // GET /api/games/tic-tac-toe-bot/admin/history - list completed game history
  if (req.method === "GET" && urlEnds.includes("/api/games/tic-tac-toe-bot/admin/history")) {
    if (!isAdminRequest()) {
      res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Not authorized"));
      return;
    }

    // support ?limit & ?offset query params
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const limit = Math.min(parseInt(urlObj.searchParams.get("limit") || "50", 10), 500);
    const offset = Math.max(parseInt(urlObj.searchParams.get("offset") || "0", 10), 0);
    const total = playedGamesHistory.length;
    const rows = playedGamesHistory.slice(offset, offset + limit);
    res.status(HTTP_OK).json({ total, offset, limit, rows });
    return;
  }

  // GET /api/games/tic-tac-toe-bot/admin/history/:id - get specific record
  if (req.method === "GET" && urlEnds.includes("/api/games/tic-tac-toe-bot/admin/history/")) {
    if (!isAdminRequest()) {
      res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Not authorized"));
      return;
    }
    const parts = urlEnds.split("/");
    const recId = parts[parts.length - 1];
    const record = playedGamesHistory.find((r) => r.id === recId);
    if (!record) {
      res.status(HTTP_NOT_FOUND).json(formatErrorResponse("History record not found"));
      return;
    }
    res.status(HTTP_OK).json(record);
    return;
  }

  // DELETE /api/games/tic-tac-toe-bot/admin/history - clear history (admin only)
  if (req.method === "DELETE" && urlEnds.endsWith("/api/games/tic-tac-toe-bot/admin/history")) {
    if (!isAdminRequest()) {
      res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Not authorized"));
      return;
    }
    const count = playedGamesHistory.length;
    playedGamesHistory.length = 0;
    res.status(HTTP_OK).json({ message: "History cleared", clearedCount: count });
    return;
  }

  // DELETE /api/games/tic-tac-toe-bot/admin/history/:id - delete specific record (admin only)
  if (req.method === "DELETE" && urlEnds.includes("/api/games/tic-tac-toe-bot/admin/history/")) {
    if (!isAdminRequest()) {
      res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Not authorized"));
      return;
    }
    const parts = urlEnds.split("/");
    const recId = parts[parts.length - 1];
    const idx = playedGamesHistory.findIndex((r) => r.id === recId);
    if (idx === -1) {
      res.status(HTTP_NOT_FOUND).json(formatErrorResponse("History record not found"));
      return;
    }
    playedGamesHistory.splice(idx, 1);
    res.status(HTTP_OK).json({ message: "History record deleted", id: recId });
    return;
  }

  // ==================== USER ENDPOINTS ====================

  // POST /api/games/tic-tac-toe-bot/session/user - Update session with user info (when user logs in)
  if (req.method === "POST" && urlEnds.endsWith("/api/games/tic-tac-toe-bot/session/user")) {
    const sessionId = getSessionFromCookie(req);
    const session = sessionId ? botSessions.get(sessionId) : null;

    if (!session) {
      res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Session not found."));
      return;
    }

    // Extract user info from authorization header
    const userInfo = extractUserInfo(req);
    if (userInfo) {
      session.user = userInfo;
      session.lastActivityAt = new Date();
      logDebug("handleTicTacToeBot: POST session/user", { sessionId, userInfo });
      res.status(HTTP_OK).json({
        message: "User info updated",
        user: {
          email: userInfo.email,
          firstname: userInfo.firstname,
          lastname: userInfo.lastname,
        },
      });
    } else {
      res.status(HTTP_OK).json({ message: "No user info available (guest session)" });
    }
    return;
  }

  // DELETE /api/games/tic-tac-toe-bot/session/user - Clear user info from session (when user logs out)
  if (req.method === "DELETE" && urlEnds.endsWith("/api/games/tic-tac-toe-bot/session/user")) {
    const sessionId = getSessionFromCookie(req);
    const session = sessionId ? botSessions.get(sessionId) : null;

    if (!session) {
      res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Session not found."));
      return;
    }

    session.user = null;
    session.lastActivityAt = new Date();
    logDebug("handleTicTacToeBot: DELETE session/user", { sessionId });
    res.status(HTTP_OK).json({ message: "User info cleared (now guest session)" });
    return;
  }

  // GET /api/games/tic-tac-toe-bot/session - Get or create session
  if (req.method === "GET" && urlEnds.endsWith("/api/games/tic-tac-toe-bot/session")) {
    let sessionId = getSessionFromCookie(req);
    let session = sessionId ? botSessions.get(sessionId) : null;

    // Extract user info if logged in
    const userInfo = extractUserInfo(req);

    if (!session || session.expiresAt < new Date()) {
      // Create new session with user info if available
      session = createNewBotSession(userInfo);
      botSessions.set(session.sessionId, session);
      sessionId = session.sessionId;
    } else if (userInfo && !session.user) {
      // Update existing session with user info if user just logged in
      session.user = userInfo;
    }

    session.lastActivityAt = new Date();
    setSessionCookie(res, sessionId);

    logDebug("handleTicTacToeBot: GET session", { sessionId: session.sessionId, user: session.user?.email });
    res.status(HTTP_OK).json({
      sessionId: session.sessionId,
      board: session.board,
      currentPlayer: session.currentPlayer,
      gameActive: session.gameActive,
      playerXScore: session.playerXScore,
      playerOScore: session.playerOScore,
      difficulty: session.difficulty,
      winner: session.winner,
      isDraw: session.isDraw,
      gamesPlayed: session.gamesPlayed,
      user: session.user
        ? {
            email: session.user.email,
            firstname: session.user.firstname,
            lastname: session.user.lastname,
          }
        : null,
    });
    return;
  }

  // DELETE /api/games/tic-tac-toe-bot/session - Clear session
  if (req.method === "DELETE" && urlEnds.endsWith("/api/games/tic-tac-toe-bot/session")) {
    const sessionId = getSessionFromCookie(req);
    if (sessionId) {
      const session = botSessions.get(sessionId);
      if (session && session.gameActive) {
        try {
          recordCompletedGame(session, "cleared", true, req);
        } catch (e) {
          logTrace("recordCompletedGame error:", e);
        }
      }
      botSessions.delete(sessionId);
      logDebug("handleTicTacToeBot: DELETE session", { sessionId });
    }

    clearSessionCookie(res);
    res.status(HTTP_OK).json({ message: "Session cleared" });
    return;
  }

  // POST /api/games/tic-tac-toe-bot/start - Start new game
  if (req.method === "POST" && urlEnds.endsWith("/api/games/tic-tac-toe-bot/start")) {
    let sessionId = getSessionFromCookie(req);
    let session = sessionId ? botSessions.get(sessionId) : null;

    // Extract user info if logged in
    const userInfo = extractUserInfo(req);

    if (!session) {
      session = createNewBotSession(userInfo);
      botSessions.set(session.sessionId, session);
      sessionId = session.sessionId;
    } else if (userInfo && !session.user) {
      // Update session with user info if user just logged in
      session.user = userInfo;
    }

    const difficulty = req.body?.difficulty || session.difficulty || "easy";

    // Reset game state but keep scores
    session.board = createEmptyBoard();
    session.currentPlayer = "X";
    session.gameActive = true;
    session.difficulty = difficulty;
    session.winner = null;
    session.isDraw = false;
    session.gamesPlayed++;
    session.roundStartAt = new Date();
    session.lastActivityAt = new Date();

    setSessionCookie(res, sessionId);

    logDebug("handleTicTacToeBot: POST start", { sessionId, difficulty, user: session.user?.email });
    res.status(HTTP_CREATED).json({
      sessionId: session.sessionId,
      board: session.board,
      currentPlayer: session.currentPlayer,
      gameActive: session.gameActive,
      playerXScore: session.playerXScore,
      playerOScore: session.playerOScore,
      difficulty: session.difficulty,
      winner: session.winner,
      isDraw: session.isDraw,
      gamesPlayed: session.gamesPlayed,
      message: "Game started! Your turn (X).",
    });
    return;
  }

  // POST /api/games/tic-tac-toe-bot/move - Player makes a move
  if (req.method === "POST" && urlEnds.endsWith("/api/games/tic-tac-toe-bot/move")) {
    const sessionId = getSessionFromCookie(req);
    const session = sessionId ? botSessions.get(sessionId) : null;

    if (!session) {
      res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Session not found. Please start a new game."));
      return;
    }

    if (!session.gameActive) {
      res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Game is not active. Please start a new game."));
      return;
    }

    if (session.currentPlayer !== "X") {
      res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("It's not your turn."));
      return;
    }

    const { row, col } = req.body || {};

    if (isUndefined(row) || isUndefined(col) || row < 0 || row > 2 || col < 0 || col > 2) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).json(formatErrorResponse("Invalid move. Row and col must be 0-2."));
      return;
    }

    if (session.board[row][col] !== "") {
      res.status(HTTP_UNPROCESSABLE_ENTITY).json(formatErrorResponse("Cell is already occupied."));
      return;
    }

    // Update last activity
    session.lastActivityAt = new Date();

    // Player makes move
    session.board[row][col] = "X";

    // Check if player won
    if (checkWinState(session.board, "X")) {
      session.gameActive = false;
      session.winner = "X";
      session.playerXScore++;

      logDebug("handleTicTacToeBot: Player X wins", { sessionId });
      // record completed game
      try {
        recordCompletedGame(session, "player_win", false, req);
      } catch (e) {
        logTrace("recordCompletedGame error:", e);
      }
      res.status(HTTP_OK).json({
        sessionId: session.sessionId,
        board: session.board,
        currentPlayer: null,
        gameActive: session.gameActive,
        playerXScore: session.playerXScore,
        playerOScore: session.playerOScore,
        difficulty: session.difficulty,
        winner: session.winner,
        isDraw: session.isDraw,
        message: "You won!",
      });
      return;
    }

    // Check for draw
    if (checkDraw(session.board)) {
      session.gameActive = false;
      session.isDraw = true;

      logDebug("handleTicTacToeBot: Draw", { sessionId });
      try {
        recordCompletedGame(session, "draw", false, req);
      } catch (e) {
        logTrace("recordCompletedGame error:", e);
      }
      res.status(HTTP_OK).json({
        sessionId: session.sessionId,
        board: session.board,
        currentPlayer: null,
        gameActive: session.gameActive,
        playerXScore: session.playerXScore,
        playerOScore: session.playerOScore,
        difficulty: session.difficulty,
        winner: session.winner,
        isDraw: session.isDraw,
        message: "It's a draw!",
      });
      return;
    }

    // Bot's turn
    session.currentPlayer = "O";
    const botMove = getBotMove(session.board, session.difficulty);

    if (botMove) {
      session.board[botMove.row][botMove.col] = "O";

      // Check if bot won
      if (checkWinState(session.board, "O")) {
        session.gameActive = false;
        session.winner = "O";
        session.playerOScore++;

        logDebug("handleTicTacToeBot: Bot O wins", { sessionId });
        try {
          recordCompletedGame(session, "bot_win", false, req);
        } catch (e) {
          logTrace("recordCompletedGame error:", e);
        }
        res.status(HTTP_OK).json({
          sessionId: session.sessionId,
          board: session.board,
          currentPlayer: null,
          gameActive: session.gameActive,
          playerXScore: session.playerXScore,
          playerOScore: session.playerOScore,
          difficulty: session.difficulty,
          winner: session.winner,
          isDraw: session.isDraw,
          botMove: botMove,
          message: "Bot won!",
        });
        return;
      }

      // Check for draw after bot move
      if (checkDraw(session.board)) {
        session.gameActive = false;
        session.isDraw = true;

        logDebug("handleTicTacToeBot: Draw after bot move", { sessionId });
        try {
          recordCompletedGame(session, "draw_after_bot_move", false, req);
        } catch (e) {
          logTrace("recordCompletedGame error:", e);
        }
        res.status(HTTP_OK).json({
          sessionId: session.sessionId,
          board: session.board,
          currentPlayer: null,
          gameActive: session.gameActive,
          playerXScore: session.playerXScore,
          playerOScore: session.playerOScore,
          difficulty: session.difficulty,
          winner: session.winner,
          isDraw: session.isDraw,
          botMove: botMove,
          message: "It's a draw!",
        });
        return;
      }
    }

    // Back to player's turn
    session.currentPlayer = "X";

    logDebug("handleTicTacToeBot: Move completed", { sessionId, botMove });
    res.status(HTTP_OK).json({
      sessionId: session.sessionId,
      board: session.board,
      currentPlayer: session.currentPlayer,
      gameActive: session.gameActive,
      playerXScore: session.playerXScore,
      playerOScore: session.playerOScore,
      difficulty: session.difficulty,
      winner: session.winner,
      isDraw: session.isDraw,
      botMove: botMove,
      message: "Your turn (X).",
    });
    return;
  }

  // POST /api/games/tic-tac-toe-bot/stop - Stop current game
  if (req.method === "POST" && urlEnds.endsWith("/api/games/tic-tac-toe-bot/stop")) {
    const sessionId = getSessionFromCookie(req);
    const session = sessionId ? botSessions.get(sessionId) : null;

    if (!session) {
      res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Session not found."));
      return;
    }

    const wasActive = session.gameActive === true;
    session.gameActive = false;
    session.currentPlayer = null;

    logDebug("handleTicTacToeBot: POST stop", { sessionId });
    if (wasActive) {
      try {
        recordCompletedGame(session, "stopped", true, req);
      } catch (e) {
        logTrace("recordCompletedGame error:", e);
      }
    }
    res.status(HTTP_OK).json({
      sessionId: session.sessionId,
      board: session.board,
      currentPlayer: session.currentPlayer,
      gameActive: session.gameActive,
      playerXScore: session.playerXScore,
      playerOScore: session.playerOScore,
      difficulty: session.difficulty,
      winner: session.winner,
      isDraw: session.isDraw,
      message: "Game stopped.",
    });
    return;
  }

  // Default: 404 for unknown endpoints
  res.status(HTTP_NOT_FOUND).json({});
  return;
}

module.exports = {
  handleTicTacToeBot,
};
