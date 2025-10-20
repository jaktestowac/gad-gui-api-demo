const { formatErrorResponse } = require("../../helpers/helpers");
const { verifyToken } = require("../../helpers/jwtauth");
const { HTTP_OK, HTTP_BAD_REQUEST, HTTP_FORBIDDEN, HTTP_NOT_FOUND } = require("../../helpers/response.helpers");
const { activityForIssueService } = require("./services/activity.service");

function getCurrentUser(req) {
  const token = req.cookies["bug-hatch-token"]; // cookie-based
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || decoded instanceof Error) return null;
  const base = { id: decoded.userId, role: decoded.role, email: decoded.email, isDemo: decoded.isDemo === true };
  if (req.bugHatchForceDemo === true) base.isDemo = true;
  return base;
}

async function handleIssueActivity(req, res, issueId) {
  const user = getCurrentUser(req);
  const result = activityForIssueService(issueId, user);
  if (!result.success) {
    let status = HTTP_BAD_REQUEST;
    if (result.errorType === "unauthorized") status = 401;
    if (result.errorType === "forbidden") status = HTTP_FORBIDDEN;
    if (result.errorType === "notfound") status = HTTP_NOT_FOUND;
    res.status(status).send(formatErrorResponse(result.error));
    return;
  }
  res.status(HTTP_OK).send({ ok: true, data: { activity: result.activity } });
}

function handleBugHatchActivity(req, res) {
  const url = req.url.replace(/\?.*$/, "");

  // /api/bug-hatch/issues/:iid/activity
  const match = url.match(/\/api\/bug-hatch\/issues\/([^/]+)\/activity\/?$/);
  if (match) {
    const issueId = match[1];
    if (req.method === "GET") {
      handleIssueActivity(req, res, issueId);
      return;
    }
  }

  res.status(404).send(formatErrorResponse("Activity endpoint not found"));
}

module.exports = { handleBugHatchActivity };
