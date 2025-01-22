const { isNumber, isUndefined, isNumberOrStringNumber } = require("../helpers/compare.helpers");
const {
  searchForUser,
  getGameNameById,
  getGameIdByName,
  searchForUserWithEmail,
  getUserScore,
  getGameScores,
} = require("../helpers/db-operation.helpers");
const { formatErrorResponse } = require("../helpers/helpers");
const { logDebug } = require("../helpers/logger-api");
const {
  HTTP_NOT_FOUND,
  HTTP_OK,
  HTTP_UNAUTHORIZED,
  HTTP_UNPROCESSABLE_ENTITY,
} = require("../helpers/response.helpers");
const { verifyAccessToken } = require("../helpers/validation.helpers");

const gameName = "maze";

function handleMaze(req, res) {
  if (req.method === "GET" && req.url.endsWith("/api/maze/highscores")) {
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

    logDebug("handleMaze:maze highScores:", { parsedScores });
    res.status(HTTP_OK).json({ highScore: parsedScores });
  } else if (req.method === "POST" && req.url.endsWith("/api/maze/score")) {
    const verifyTokenResult = verifyAccessToken(req, res, "maze/score", req.url);
    if (isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
      return;
    }
    const score = req.body;
    const email = verifyTokenResult?.email;
    if (
      isUndefined(score) ||
      isUndefined(score.score) ||
      !isNumberOrStringNumber(score.score) ||
      isUndefined(score.size) ||
      !isNumberOrStringNumber(score.size) ||
      isUndefined(score.time) ||
      !isNumberOrStringNumber(score.time)
    ) {
      logDebug("handleMaze:invalid score:", { score });
      res.status(HTTP_UNPROCESSABLE_ENTITY).json(formatErrorResponse("Maze score was not provided"));
      return;
    }

    const finalScore = Math.floor((score.size * 1000) / score.time);
    if (finalScore !== score.score) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).json(formatErrorResponse("Invalid score"));
      return;
    }

    const gameId = getGameIdByName(gameName);
    const user = searchForUserWithEmail(email);
    const previousUserScore = getUserScore(user.id, gameId);

    logDebug("handleMaze:maze highScores:", { previousUserScore, currentScore: score });
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
      req.body = { game_id: gameId, user_id: user.id, score: score.score, size: score.size, time: score.time, seed: score.seed };
      logDebug("handleMaze:stop -> PUT/POST scores:", {
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
  handleMaze,
};
