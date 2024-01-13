const { HTTP_NOT_FOUND } = require("../helpers/response.helpers");

function handleScores(req, res) {
  if (req.url.endsWith("/api/scores")) {
    res.status(HTTP_NOT_FOUND).json({});
  }
  return;
}

module.exports = {
  handleScores,
};
