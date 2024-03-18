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

function registerNewSession(sessions, session) {
  const existingSession = sessions.find((s) => areIdsEqual(s.id, session.id));
  if (existingSession) {
    logWarnTrace("registerNewSession: Session already exists", { session });
    return existingSession;
  }
  sessions.push(session);
  return session;
}

function userCanJoin(sessions, userId, sessionCode) {
  const existingSession = sessions.find((s) => areIdsEqual(s.code, sessionCode));
  if (existingSession === undefined) {
    logWarnTrace("userCanJoin: Session not found", { userId, sessionCode });
    return formatErrorResponse("Session not found");
  }

  if (areIdsEqual(existingSession.users[0], userId) || areIdsEqual(existingSession.users[1], userId)) {
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
  const existingSession = sessions.find((s) => areIdsEqual(s.code, sessionCode));

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

function canSwitchUserTurn(sessions, sessionCode, move, userId) {
  const existingSession = sessions.find((s) => areIdsEqual(s.code, sessionCode));

  if (!existingSession) {
    logWarnTrace("switchUserTurn: Session not found", { sessions, sessionCode });
    return formatErrorResponse("Session not found");
  }

  const currentUser = existingSession.currentTurn % 2;
  if (!areIdsEqual(existingSession.users[currentUser], userId)) {
    logWarnTrace("switchUserTurn: It's not the user's turn", { existingSession, userId });
    return formatErrorResponse("It's not the user's turn");
  }

  if (existingSession.board.length < move[1] || existingSession.board[0].length < move[0]) {
    logWarnTrace("switchUserTurn: Move is out of bounds", { existingSession, move });
    return formatErrorResponse("Move is out of bounds");
  }

  if (`${existingSession.board[move[1]][move[0]]}`?.length > 0) {
    logWarnTrace("switchUserTurn: Move is already taken", { existingSession, move });
    return formatErrorResponse("Move is already taken");
  }

  return { success: true };
}

function switchUserTurn(sessions, sessionCode, move) {
  const existingSession = sessions.find((s) => areIdsEqual(s.code, sessionCode));
  if (!existingSession) {
    logWarnTrace("switchUserTurn: Session not found", { sessions, sessionCode });
    return undefined;
  }

  const currentUser = existingSession.currentTurn % 2;
  const userId = existingSession.users[currentUser];

  existingSession.board[move[1]][move[0]] = userId;
  existingSession.currentTurn++;
  return existingSession;
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
  const existingSession = sessions.find((s) => areIdsEqual(s.code, sessionCode));
  if (!existingSession) {
    logWarnTrace("getCurrentUserTurn: Session not found", { sessions, sessionCode });
    return existingSession;
  }

  const currentUser = existingSession.currentTurn % 2;
  return existingSession.users[currentUser];
}

function addScore(sessions, sessionCode, userId, score) {
  const existingSession = sessions.find((s) => areIdsEqual(s.code, sessionCode));
  if (!existingSession) {
    logWarnTrace("addScore: Session not found", { sessions, sessionCode });
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
  const existingSession = sessions.find((s) => areIdsEqual(s.code, sessionCode));
  if (!existingSession) {
    logWarnTrace("stopSession: Session not found", { sessions, sessionCode });
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
  switchUserTurn,
  joinUser,
  userCanJoin,
  registerNewSession,
  createNewSession,
  canSwitchUserTurn,
};
