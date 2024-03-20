const { isBugEnabled } = require("../config/config-manager");
const { BugConfigKeys } = require("../config/enums");
const { isUndefined, areIdsEqual } = require("../helpers/compare.helpers");
const {
  searchForUser,
  getGameNameById,
  getGameIdByName,
  getGameScores,
  searchForUserWithOnlyToken,
} = require("../helpers/db-operation.helpers");
const { formatErrorResponse, formatInvalidTokenErrorResponse } = require("../helpers/helpers");
const { logDebug, logTrace } = require("../helpers/logger-api");
const {
  HTTP_NOT_FOUND,
  HTTP_OK,
  HTTP_UNAUTHORIZED,
  HTTP_UNPROCESSABLE_ENTITY,
  HTTP_CREATED,
  HTTP_CONFLICT,
  HTTP_FORBIDDEN,
} = require("../helpers/response.helpers");
const {
  stopSession,
  userCanJoin,
  joinUser,
  createNewSession,
  registerNewSession,
  canUserMakeTurn,
  makeUserTurn,
  findSessionByCode,
  isUserAlreadyInGame,
} = require("../helpers/tic-tac-toe.helpers");
const { verifyAccessToken } = require("../helpers/validation.helpers");

const gameName = "Tic Tac Toe";

const sessions = [];

function handleTicTacToe(req, res) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

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
    logTrace("handleTicTacToe: foundUser:", { method: req.method, foundUser });

    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).json(formatInvalidTokenErrorResponse());
      return;
    }
    const newSession = createNewSession(foundUser.id);
    const currentSession = registerNewSession(sessions, newSession);

    logTrace("handleTicTacToe:tic-tac-toe start:", { method: req.method, currentSession });
    res.status(HTTP_CREATED).json({ ...currentSession, id: undefined });
    return;
  } else if (req.method === "GET" && req.url.includes("/api/tic-tac-toe/status/")) {
    const verifyTokenResult = verifyAccessToken(req, res, "tic-tac-toe/status", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleTicTacToe: foundUser:", { method: req.method, foundUser });

    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).json(formatInvalidTokenErrorResponse());
      return;
    }

    const sessionCode = urlEnds.split("/").slice(-1)[0];
    const currentSession = findSessionByCode(sessions, sessionCode);

    if (isUndefined(currentSession)) {
      res.status(HTTP_NOT_FOUND).json(formatErrorResponse("User cannot make a move"));
      return;
    }

    if (!areIdsEqual(currentSession.users[0], foundUser.id) && !areIdsEqual(currentSession.users[1], foundUser.id)) {
      res.status(HTTP_UNAUTHORIZED).json(formatInvalidTokenErrorResponse());
      return;
    }

    res.status(HTTP_OK).json({ ...currentSession, id: undefined });
    return;
  } else if (req.method === "POST" && req.url.endsWith("/api/tic-tac-toe/status")) {
    const verifyTokenResult = verifyAccessToken(req, res, "tic-tac-toe/status", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleTicTacToe: foundUser:", { method: req.method, foundUser });

    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).json(formatInvalidTokenErrorResponse());
      return;
    }

    const sessionCode = req.body.code;
    const move = req.body.move;
    let canMove = canUserMakeTurn(sessions, sessionCode, move, foundUser.id);

    if (isBugEnabled(BugConfigKeys.BUG_GAME_TTT_001)) {
      canMove = { success: true };
    }

    if (canMove.error !== undefined) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).json(canMove);
      return;
    }

    const currentSession = makeUserTurn(sessions, sessionCode, move);

    if (isUndefined(currentSession)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).json(formatErrorResponse("User cannot make a move"));
      return;
    }

    res.status(HTTP_OK).json({ ...currentSession, id: undefined });
    return;
  } else if (req.method === "POST" && req.url.endsWith("/api/tic-tac-toe/join")) {
    const verifyTokenResult = verifyAccessToken(req, res, "tic-tac-toe/join", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleTicTacToe: foundUser:", { method: req.method, foundUser });

    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).json(formatInvalidTokenErrorResponse());
      return;
    }

    const sessionCode = req.body.code;
    if (isUndefined(sessionCode)) {
      res.status(HTTP_FORBIDDEN).json(formatErrorResponse("Session code not provided"));
      return;
    }

    let userAlreadyInGame = isUserAlreadyInGame(sessions, foundUser.id, sessionCode);
    if (isBugEnabled(BugConfigKeys.BUG_GAME_TTT_002)) {
      userAlreadyInGame = { success: false };
    }

    if (userAlreadyInGame.success === true) {
      const currentSession = findSessionByCode(sessions, sessionCode);
      res.status(HTTP_OK).json({ ...currentSession, id: undefined });
      return;
    }

    const canJoin = userCanJoin(sessions, foundUser.id, sessionCode);

    if (canJoin.error !== undefined) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).json(canJoin);
      return;
    }

    const currentSession = joinUser(sessions, foundUser.id, sessionCode);

    if (isUndefined(currentSession)) {
      res.status(HTTP_CONFLICT).json(formatErrorResponse("User cannot join the game - game probably full."));
      return;
    }

    res.status(HTTP_OK).json({ ...currentSession, id: undefined });
    return;
  } else if (req.method === "POST" && req.url.endsWith("/api/tic-tac-toe/stop")) {
    const verifyTokenResult = verifyAccessToken(req, res, "tic-tac-toe/stop", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleTicTacToe: foundUser:", { method: req.method, foundUser });

    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).json(formatInvalidTokenErrorResponse());
      return;
    }

    const sessionCode = req.body.code;

    if (isUndefined(sessionCode)) {
      res.status(HTTP_FORBIDDEN).json(formatErrorResponse("Session code not provided"));
      return;
    }

    const currentSession = stopSession(sessions, sessionCode);

    res.status(HTTP_OK).json({ ...currentSession, id: undefined });
    return;
  } else {
    res.status(HTTP_NOT_FOUND).json({});
  }
  return;
}

module.exports = {
  handleTicTacToe,
};
