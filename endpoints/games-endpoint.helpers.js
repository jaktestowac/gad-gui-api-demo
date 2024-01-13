const { HTTP_NOT_FOUND } = require("../helpers/response.helpers");

function handleGames(req, res) {
  if (req.url.endsWith("/api/games")) {
    res.status(HTTP_NOT_FOUND).json({});
  }
  return;
}

module.exports = {
  handleGames,
};
