const { formatErrorResponse } = require("../../helpers/helpers");
const { verifyToken } = require("../../helpers/jwtauth");
const {
  HTTP_OK,
  HTTP_CREATED,
  HTTP_BAD_REQUEST,
  HTTP_FORBIDDEN,
  HTTP_NOT_FOUND,
} = require("../../helpers/response.helpers");
const {
  listIssuesService,
  createIssueService,
  getIssueService,
  patchIssueService,
  transitionIssueService,
  archiveIssueService,
} = require("../../services/bug-hatch/issue.service");

function getCurrentUser(req) {
  const token = req.cookies["bug-hatch-token"]; // cookie-based
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || decoded instanceof Error) return null;
  const base = { id: decoded.userId, role: decoded.role, email: decoded.email, isDemo: decoded.isDemo === true };
  // Allow forced demo mode via validations.route.js (query param) for read-only exploration
  if (req.bugHatchForceDemo === true) {
    base.isDemo = true;
  }
  return base;
}

async function handleListProjectIssues(req, res, projectId) {
  const user = getCurrentUser(req);
  const result = listIssuesService(projectId, req.query || {}, user);
  if (!result.success) {
    let status = HTTP_BAD_REQUEST;
    if (result.errorType === "unauthorized") status = 401;
    if (result.errorType === "forbidden") status = HTTP_FORBIDDEN;
    if (result.errorType === "notfound") status = HTTP_NOT_FOUND;
    res.status(status).send(formatErrorResponse(result.error));
    return;
  }
  res.status(HTTP_OK).send({ ok: true, data: { issues: result.issues, total: result.total } });
}

async function handleCreateIssue(req, res, projectId) {
  const user = getCurrentUser(req);
  const payload = { ...req.body, projectId };
  const result = await createIssueService(payload, user);
  if (!result.success) {
    let status = HTTP_BAD_REQUEST;
    if (result.errorType === "unauthorized") status = 401;
    if (result.errorType === "forbidden") status = HTTP_FORBIDDEN;
    if (result.errorType === "notfound") status = HTTP_NOT_FOUND;
    res.status(status).send(formatErrorResponse(result.error));
    return;
  }
  res.status(HTTP_CREATED).send({ ok: true, data: result.issue });
}

async function handleGetIssue(req, res, issueId) {
  const user = getCurrentUser(req);
  const result = getIssueService(issueId, user);
  if (!result.success) {
    let status = HTTP_BAD_REQUEST;
    if (result.errorType === "unauthorized") status = 401;
    if (result.errorType === "forbidden") status = HTTP_FORBIDDEN;
    if (result.errorType === "notfound") status = HTTP_NOT_FOUND;
    res.status(status).send(formatErrorResponse(result.error));
    return;
  }
  res.status(HTTP_OK).send({ ok: true, data: result.issue });
}

async function handlePatchIssue(req, res, issueId) {
  const user = getCurrentUser(req);
  const result = await patchIssueService(issueId, req.body || {}, user);
  if (!result.success) {
    let status = HTTP_BAD_REQUEST;
    if (result.errorType === "unauthorized") status = 401;
    if (result.errorType === "forbidden") status = HTTP_FORBIDDEN;
    if (result.errorType === "notfound") status = HTTP_NOT_FOUND;
    res.status(status).send(formatErrorResponse(result.error));
    return;
  }
  res.status(HTTP_OK).send({ ok: true, data: result.issue });
}

async function handleArchiveIssue(req, res, issueId) {
  const user = getCurrentUser(req);
  const result = await archiveIssueService(issueId, user);
  if (!result.success) {
    let status = HTTP_BAD_REQUEST;
    if (result.errorType === "unauthorized") status = 401;
    if (result.errorType === "forbidden") status = HTTP_FORBIDDEN;
    if (result.errorType === "notfound") status = HTTP_NOT_FOUND;
    res.status(status).send(formatErrorResponse(result.error));
    return;
  }
  res.status(HTTP_OK).send({ ok: true, data: result.issue });
}

async function handleTransitionIssue(req, res, issueId) {
  const user = getCurrentUser(req);
  const { toStatus } = req.body || {};
  if (!toStatus) {
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("toStatus required"));
    return;
  }
  const result = await transitionIssueService(issueId, toStatus, user);
  if (!result.success) {
    let status = HTTP_BAD_REQUEST;
    if (result.errorType === "unauthorized") status = 401;
    if (result.errorType === "forbidden") status = HTTP_FORBIDDEN;
    if (result.errorType === "notfound") status = HTTP_NOT_FOUND;
    res.status(status).send(formatErrorResponse(result.error));
    return;
  }
  res.status(HTTP_OK).send({ ok: true, data: result.issue });
}

function handleBugHatchIssues(req, res) {
  const url = req.url.replace(/\?.*$/, "");

  // project issues list & create: /api/bug-hatch/projects/:pid/issues
  const projectIssuesMatch = url.match(/\/api\/bug-hatch\/projects\/([^/]+)\/issues\/?$/);
  if (projectIssuesMatch) {
    const projectId = projectIssuesMatch[1];
    if (req.method === "GET") {
      handleListProjectIssues(req, res, projectId);
      return;
    }
    if (req.method === "POST") {
      handleCreateIssue(req, res, projectId);
      return;
    }
  }

  // single issue routes: /api/bug-hatch/issues/:iid
  const issueMatch = url.match(/\/api\/bug-hatch\/issues\/([^/]+)\/?$/);
  if (issueMatch) {
    const issueId = issueMatch[1];
    if (req.method === "GET") {
      handleGetIssue(req, res, issueId);
      return;
    }
    if (req.method === "PATCH") {
      handlePatchIssue(req, res, issueId);
      return;
    }
    if (req.method === "DELETE") {
      handleArchiveIssue(req, res, issueId);
      return;
    }
  }

  // transition endpoint: /api/bug-hatch/issues/:iid/transition
  const transitionMatch = url.match(/\/api\/bug-hatch\/issues\/([^/]+)\/transition\/?$/);
  if (transitionMatch) {
    const issueId = transitionMatch[1];
    if (req.method === "POST") {
      handleTransitionIssue(req, res, issueId);
      return;
    }
  }

  res.status(404).send(formatErrorResponse("Issue endpoint not found"));
}

module.exports = { handleBugHatchIssues };
