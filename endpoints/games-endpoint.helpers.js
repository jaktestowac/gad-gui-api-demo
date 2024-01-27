const { gamesDb } = require("../helpers/db.helpers");
const { HTTP_NOT_FOUND, HTTP_OK } = require("../helpers/response.helpers");

function handleGames(req, res) {
  if (req.method === "GET" && req.url.endsWith("/api/games")) {
    const games = gamesDb();
    res.status(HTTP_OK).json(games);
  } else if (req.url.endsWith("/api/games")) {
    res.status(HTTP_NOT_FOUND).json({});
  }
  return;
}

module.exports = {
  handleGames,
};
