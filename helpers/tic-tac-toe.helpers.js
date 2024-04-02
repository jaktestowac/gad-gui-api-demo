const { areIdsEqual, isUndefined } = require("./compare.helpers");
const { formatErrorResponse, generateRandomString } = require("./helpers");
const { logWarnTrace } = require("./logger-api");

function createNewSession(userId) {
  return {
    users: { 0: userId, 1: undefined },
    scores: { 0: 0, 1: 0 },
    code: generateRandomString(4),
    id: generateRandomString(20),
    numberOfMatches: 0,
    hasStarted: false,
    hasEnded: false,
    currentTurn: 0,
    roundTimeInSeconds: 10,
    startTime: undefined,
    endTime: undefined,
    currentTime: undefined,
    board: [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ],
  };
}

function findSessionById(sessions, id) {
  const existingSession = sessions.find((s) => areIdsEqual(s.id, id));

  return existingSession;
}

function findSessionByCode(sessions, sessionCode) {
  const existingSession = sessions.find((s) => areIdsEqual(s.code, sessionCode));

  return existingSession;
}

function registerNewSession(sessions, session) {
  const existingSession = findSessionById(sessions, session.id);
  if (existingSession) {
    logWarnTrace("registerNewSession: Session already exists", { session });
    return existingSession;
  }
  sessions.push(session);
  return session;
}

function isUserAlreadyInGame(sessions, userId, sessionCode) {
  const existingSession = findSessionByCode(sessions, sessionCode);
  if (existingSession === undefined) {
    logWarnTrace("userCanJoin: Session not found", { userId, sessionCode });
    return formatErrorResponse("Session not found");
  }

  return { success: areIdsEqual(existingSession.users[0], userId) || areIdsEqual(existingSession.users[1], userId) };
}

function userCanJoin(sessions, userId, sessionCode) {
  const existingSession = findSessionByCode(sessions, sessionCode);
  if (existingSession === undefined) {
    logWarnTrace("userCanJoin: Session not found", { userId, sessionCode });
    return formatErrorResponse("Session not found");
  }

  if (isUserAlreadyInGame(sessions, userId, sessionCode).success === true) {
    logWarnTrace("userCanJoin: User is already in the game", { existingSession, userId, sessionCode });
    return formatErrorResponse("User is already in the game");
  }

  if (!isUndefined(existingSession.users[0]) && !isUndefined(existingSession.users[1])) {
    logWarnTrace("userCanJoin: Session is full", { existingSession, userId, sessionCode });
    return formatErrorResponse("Session is full");
  }

  return { success: true };
}

function joinUser(sessions, userId, sessionCode) {
  const existingSession = findSessionByCode(sessions, sessionCode);

  if (isUndefined(existingSession.users[0])) {
    existingSession.users[0] = userId;
  } else if (isUndefined(existingSession.users[1])) {
    existingSession.users[1] = userId;
  } else {
    logWarnTrace("joinUser: User cannot join the game - game probably full.", { existingSession, userId, sessionCode });
    return undefined;
  }

  existingSession.hasStarted = true;
  existingSession.startTime = new Date();
  return existingSession;
}

function canUserMakeTurn(sessions, sessionCode, move, userId) {
  const existingSession = findSessionByCode(sessions, sessionCode);

  if (!existingSession) {
    logWarnTrace("makeUserTurn: Session not found", { sessions, sessionCode });
    return formatErrorResponse("Session not found");
  }

  if (existingSession.hasEnded === true) {
    logWarnTrace("makeUserTurn: Session has already ended", { existingSession, sessionCode });
    return formatErrorResponse("Session has already ended");
  }

  if (isUndefined(move) || move.length !== 2) {
    logWarnTrace("makeUserTurn: Move is invalid", { existingSession, move });
    return formatErrorResponse("Move is invalid");
  }

  const currentUser = existingSession.currentTurn % 2;
  if (!areIdsEqual(existingSession.users[currentUser], userId)) {
    logWarnTrace("makeUserTurn: It's not the user's turn", { existingSession, userId });
    return formatErrorResponse("It's not the user's turn");
  }

  if (existingSession.board.length < move[1] || existingSession.board[0].length < move[0]) {
    logWarnTrace("makeUserTurn: Move is out of bounds", { existingSession, move });
    return formatErrorResponse("Move is out of bounds");
  }

  if (`${existingSession.board[move[1]][move[0]]}`?.length > 0) {
    logWarnTrace("makeUserTurn: Move is already taken", { existingSession, move });
    return formatErrorResponse("Move is already taken");
  }

  return { success: true };
}

function makeUserTurn(sessions, sessionCode, move) {
  const existingSession = findSessionByCode(sessions, sessionCode);
  if (!existingSession) {
    logWarnTrace("makeUserTurn: Session not found", { sessions, sessionCode });
    return undefined;
  }

  if (existingSession.hasEnded === true) {
    logWarnTrace("makeUserTurn: Session has already ended", { existingSession, sessionCode });
    return existingSession;
  }

  const currentUser = existingSession.currentTurn % 2;
  const userId = existingSession.users[currentUser];

  existingSession.board[move[1]][move[0]] = userId;
  existingSession.currentTurn++;

  const result = checkWin(existingSession.board);

  if (result !== undefined) {
    existingSession.hasEnded = true;
    existingSession.endTime = new Date();
    existingSession.numberOfMatches += 1;
    existingSession.scores[currentUser] += 1;
  }

  return existingSession;
}

function checkWin(board) {
  // Check rows
  for (let i = 0; i < 3; i++) {
    if (board[i][0] !== "" && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
      return board[i][0];
    }
  }

  // Check columns
  for (let j = 0; j < 3; j++) {
    if (board[0][j] !== "" && board[0][j] === board[1][j] && board[1][j] === board[2][j]) {
      return board[0][j];
    }
  }

  // Check diagonals
  if (board[0][0] !== "" && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
    return board[0][0];
  }
  if (board[0][2] !== "" && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
    return board[0][2];
  }
  // No winner
  return undefined;
}

function countDifferences(board1, board2) {
  let count = 0;
  for (let i = 0; i < board1.length; i++) {
    for (let j = 0; j < board1[i].length; j++) {
      if (board1[i][j] !== board2[i][j]) {
        count++;
      }
    }
  }
  return count;
}

function getCurrentUserTurn(sessions, sessionCode) {
  const existingSession = findSessionByCode(sessions, sessionCode);
  if (!existingSession) {
    logWarnTrace("getCurrentUserTurn: Session not found", { sessions, sessionCode });
    return existingSession;
  }

  const currentUser = existingSession.currentTurn % 2;
  return existingSession.users[currentUser];
}

function addScore(sessions, sessionCode, userId, score) {
  const existingSession = findSessionByCode(sessions, sessionCode);
  if (!existingSession) {
    logWarnTrace("addScore: Session not found", { sessions, sessionCode });
    return existingSession;
  }

  if (existingSession.hasEnded === true) {
    logWarnTrace("addScore: Session has already ended", { existingSession, userId, sessionCode });
    return existingSession;
  }

  if (areIdsEqual(existingSession.users[0], userId)) {
    existingSession.scores[0] += score;
  } else if (areIdsEqual(existingSession.users[1], userId)) {
    existingSession.scores[1] += score;
  } else {
    logWarnTrace("addScore: User not found in the session", { existingSession, userId, sessionCode });
    return existingSession;
  }

  return existingSession;
}

function stopSession(sessions, sessionCode) {
  const existingSession = findSessionByCode(sessions, sessionCode);
  if (!existingSession) {
    logWarnTrace("stopSession: Session not found", { sessions, sessionCode });
    return existingSession;
  }

  if (existingSession.hasEnded === true) {
    logWarnTrace("addScore: Session has already ended", { existingSession, sessionCode });
    return existingSession;
  }

  existingSession.hasEnded = true;
  existingSession.endTime = new Date();
  existingSession.numberOfMatches += 1;
  return existingSession;
}

module.exports = {
  stopSession,
  addScore,
  getCurrentUserTurn,
  countDifferences,
  makeUserTurn,
  joinUser,
  userCanJoin,
  registerNewSession,
  createNewSession,
  canUserMakeTurn,
  checkWin,
  findSessionByCode,
  findSessionById,
  isUserAlreadyInGame,
};
