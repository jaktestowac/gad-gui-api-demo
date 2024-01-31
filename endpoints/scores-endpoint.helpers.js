const { isUndefined } = require("../helpers/compare.helpers");
const { getGameScores } = require("../helpers/db-operation.helpers");
const { scoresDb } = require("../helpers/db.helpers");
const { HTTP_NOT_FOUND, HTTP_OK } = require("../helpers/response.helpers");

function handleScores(req, res) {
  if (req.method === "GET" && req.url.endsWith("/api/scores")) {
    const scores = scoresDb();
    res.status(HTTP_OK).json(scores);
  } else if (req.method === "GET" && req.url.includes("/api/scores/")) {
    const urlEnds = req.url.replace(/\/\/+/g, "/");
    const gameId = urlEnds.split("/").slice(-1)[0];

    if (isUndefined(gameId)) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    const scores = getGameScores(gameId);
    res.status(HTTP_OK).json(scores);
  } else if (req.url.endsWith("/api/scores")) {
    res.status(HTTP_NOT_FOUND).json({});
  }
  return;
}

module.exports = {
  handleScores,
};
