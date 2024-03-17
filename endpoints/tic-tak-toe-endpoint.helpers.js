const { isNumber, isUndefined, areIdsEqual } = require("../helpers/compare.helpers");
const {
  searchForUser,
  getGameNameById,
  getGameIdByName,
  searchForUserWithEmail,
  getUserScore,
  getGameScores,
  searchForUserWithOnlyToken,
} = require("../helpers/db-operation.helpers");
const { formatErrorResponse, generateRandomString, formatInvalidTokenErrorResponse } = require("../helpers/helpers");
const { logDebug, logTrace } = require("../helpers/logger-api");
const {
  HTTP_NOT_FOUND,
  HTTP_OK,
  HTTP_UNAUTHORIZED,
  HTTP_UNPROCESSABLE_ENTITY,
  HTTP_CREATED,
} = require("../helpers/response.helpers");
const { verifyAccessToken } = require("../helpers/validation.helpers");

const gameName = "Tic Tac Toe";

const sessions = [];

function createNewSession(userId) {
  return {
    firstUserId: userId,
    secondUserId: undefined,
    code: generateRandomString(4),
    id: generateRandomString(20),
    firstUserScore: 0,
    secondUserScore: 0,
    numberOfMatches: 0,
    hasStarted: false,
    hasEnded: false,
  };
}

function registerNewSession(sessions, session) {
  const existingSession = sessions.find((s) => areIdsEqual(s.id, session.id));
  if (existingSession) {
    logTrace("registerNewSession: Session already exists", { session });
    return existingSession;
  }
  sessions.push(session);
  return session;
}

function userCanJoin(sessions, userId, sessionCode) {
  const existingSession = sessions.find((s) => areIdsEqual(s.sessionCode, sessionCode));
  if (existingSession === undefined) {
    logTrace("userCanJoin: Session not found", { userId, sessionCode });
    return false;
  }

  if (!isUndefined(existingSession.firstUserId) && !isUndefined(existingSession.secondUserId)) {
    logTrace("userCanJoin: Session is full", { existingSession, userId, sessionCode });
    return false;
  }

  if (areIdsEqual(existingSession.firstUserId, userId) || areIdsEqual(existingSession.secondUserId, userId)) {
    logTrace("userCanJoin: User is already in the game", { existingSession, userId, sessionCode });
    return false;
  }

  return true;
}

function joinUser(sessions, userId, sessionCode) {
  const existingSession = sessions.find((s) => areIdsEqual(s.sessionCode, sessionCode));

  if (isUndefined(existingSession.firstUserId)) {
    existingSession.firstUserId = userId;
  } else if (isUndefined(existingSession.secondUserId)) {
    existingSession.firstUserId = userId;
  } else {
    logTrace("joinUser: User cannot join the game", { existingSession, userId, sessionCode });
    return false;
  }

  existingSession.hasStarted = true;
}

function addScore(sessions, sessionCode, userId, score) {
  const existingSession = sessions.find((s) => areIdsEqual(s.sessionCode, sessionCode));
  if (!existingSession) {
    logTrace("stopSession: Session not found", { sessions, sessionCode });
    return existingSession;
  }

  if (areIdsEqual(existingSession.firstUserId, userId)) {
    existingSession.firstUserScore += score;
  } else if (areIdsEqual(existingSession.secondUserId, userId)) {
    existingSession.secondUserScore += score;
  } else {
    logTrace("addScore: User not found in the session", { existingSession, userId, sessionCode });
    return existingSession;
  }

  return existingSession;
}

function stopSession(sessions, sessionCode) {
  const existingSession = sessions.find((s) => areIdsEqual(s.sessionCode, sessionCode));
  if (!existingSession) {
    logTrace("stopSession: Session not found", { sessions, sessionCode });
    return existingSession;
  }

  existingSession.hasEnded = true;
  return existingSession;
}

function handleTicTacToe(req, res) {
  if (req.method === "GET" && req.url.endsWith("/api/tic-tac-toe/highscores")) {
    const gameId = getGameIdByName(gameName);
    const scores = getGameScores(gameId);
    const parsedScores = scores.map((score) => {
      const user = searchForUser(score.user_id);
      return {
        user: `${user.firstname} ${user.lastname}`,
        game: getGameNameById(score.game_id),
        score: score.score,
      };
    });

    logDebug("handleTicTacToe:tic-tac-toe highScores:", { parsedScores });
    res.status(HTTP_OK).json({ highScore: parsedScores });
  } else if (req.method === "POST" && req.url.endsWith("/api/tic-tac-toe/start")) {
    const verifyTokenResult = verifyAccessToken(req, res, "tic-tac-toe/start", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleSurvey: foundUser:", { method: req.method, foundUser });

    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).json(formatInvalidTokenErrorResponse());
      return;
    }
    const newSession = createNewSession(req.body.user_id);
    const currentSession = registerNewSession(sessions, newSession);

    logTrace("handleTicTacToe:tic-tac-toe start:", { method: req.method, currentSession });
    res.status(HTTP_CREATED).json({ ...currentSession, id: undefined });
    return;
  } else if (req.method === "POST" && req.url.endsWith("/api/tic-tac-toe/join")) {
    const verifyTokenResult = verifyAccessToken(req, res, "tic-tac-toe/join", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleSurvey: foundUser:", { method: req.method, foundUser });

    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).json(formatInvalidTokenErrorResponse());
      return;
    }

    const sessionCode = req.body.sessionCode;
    const canJoin = userCanJoin(sessions, foundUser.id, sessionCode);
    if (!canJoin) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).json(formatErrorResponse("User cannot join the game"));
      return;
    }

    const currentSession = joinUser(sessions, foundUser.id, sessionCode);
    res.status(HTTP_OK).json({ ...currentSession, id: undefined });
    return;
  } else if (req.method === "POST" && req.url.endsWith("/api/tic-tac-toe/stop")) {
    const verifyTokenResult = verifyAccessToken(req, res, "tic-tac-toe/stop", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleSurvey: foundUser:", { method: req.method, foundUser });

    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).json(formatInvalidTokenErrorResponse());
      return;
    }
    const sessionCode = req.body.sessionCode;

    addScore(sessions, sessionCode, foundUser.id);
    const currentSession = stopSession(sessions, sessionCode);
    
    res.status(HTTP_OK).json({ ...currentSession, id: undefined });
    return;
  } else if (req.method === "POST" && req.url.endsWith("/api/tic-tac-toe/score")) {
    const verifyTokenResult = verifyAccessToken(req, res, "tic-tac-toe", req.url);
    if (isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
      return;
    }

    const score = req.body;
    const email = verifyTokenResult?.email;
    if (isUndefined(score) || isUndefined(score.score) || !isNumber(score.score)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).json(formatErrorResponse("Score was not provided"));
    }
    const gameId = getGameIdByName(gameName);
    const user = searchForUserWithEmail(email);
    const previousUserScore = getUserScore(user.id, gameId);

    logDebug("handleTicTacToe:tic-tac-toe highScores:", { previousUserScore, currentScore: score });
    if (!isUndefined(previousUserScore) && previousUserScore.score >= score.score) {
      res.status(HTTP_OK).json({ game_id: gameId, user_id: user.id, score: score.score });
    } else {
      if (!isUndefined(previousUserScore?.id)) {
        req.method = "PUT";
        req.url = `/api/scores/${previousUserScore.id}`;
      } else {
        req.method = "POST";
        req.url = `/api/scores`;
      }
      req.body = { game_id: gameId, user_id: user.id, score: score.score };
      logDebug("handleTicTacToe:stop -> PUT/POST scores:", {
        method: req.method,
        url: req.url,
        body: req.body,
      });
    }

    return;
  } else {
    res.status(HTTP_NOT_FOUND).json({});
  }
  return;
}

module.exports = {
  handleTicTacToe,
};