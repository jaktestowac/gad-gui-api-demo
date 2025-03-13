const { HTTP_NOT_FOUND } = require("../../helpers/response.helpers");
const { formatErrorResponse } = require("../../helpers/helpers");
const { logTrace, logDebug, logError } = require("../../helpers/logger-api");

const v1Handler = require("./v1.handler");

const VERSION_HANDLERS = {
  v1: v1Handler,
  // Add new version handlers here as needed
  // v2: v2Handler,
  // v3: v3Handler,
};

function handleChallenges(req, res) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");
  const urlParts = urlEnds.split("/").filter(Boolean);

  // Validate API path structure
  if (urlParts.length < 3 || urlParts[0] !== "api" || urlParts[1] !== "challenges") {
    res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Invalid API endpoint"));
    return;
  }

  const version = urlParts[2];
  const handler = VERSION_HANDLERS[version];

  if (!handler) {
    res.status(HTTP_NOT_FOUND).send(formatErrorResponse(`API version "${version}" not supported`));
    return;
  }

  // Remove api/challenges/v* prefix for further processing
  const endpointParts = urlParts.slice(3);

  return handler(endpointParts, req, res);
}

module.exports = {
  handleChallenges,
};
