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
  listCommentsService,
  createCommentService,
  patchCommentService,
  deleteCommentService,
} = require("../../services/bug-hatch/comment.service");

function getCurrentUser(req) {
  const token = req.cookies["bug-hatch-token"]; // cookie-based
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || decoded instanceof Error) return null;
  const base = { id: decoded.userId, role: decoded.role, email: decoded.email, isDemo: decoded.isDemo === true };
  if (req.bugHatchForceDemo === true) base.isDemo = true;
  return base;
}

async function handleListIssueComments(req, res, issueId) {
  const user = getCurrentUser(req);
  const result = listCommentsService(issueId, user);
  if (!result.success) {
    let status = HTTP_BAD_REQUEST;
    if (result.errorType === "unauthorized") status = 401;
    if (result.errorType === "forbidden") status = HTTP_FORBIDDEN;
    if (result.errorType === "notfound") status = HTTP_NOT_FOUND;
    res.status(status).send(formatErrorResponse(result.error));
    return;
  }
  res.status(HTTP_OK).send({ ok: true, data: { comments: result.comments } });
}

async function handleCreateComment(req, res, issueId) {
  const user = getCurrentUser(req);
  const result = await createCommentService(issueId, req.body || {}, user);
  if (!result.success) {
    let status = HTTP_BAD_REQUEST;
    if (result.errorType === "unauthorized") status = 401;
    if (result.errorType === "forbidden") status = HTTP_FORBIDDEN;
    if (result.errorType === "notfound") status = HTTP_NOT_FOUND;
    res.status(status).send(formatErrorResponse(result.error));
    return;
  }
  res.status(HTTP_CREATED).send({ ok: true, data: result.comment });
}

async function handlePatchComment(req, res, commentId) {
  const user = getCurrentUser(req);
  const result = await patchCommentService(commentId, req.body || {}, user);
  if (!result.success) {
    let status = HTTP_BAD_REQUEST;
    if (result.errorType === "unauthorized") status = 401;
    if (result.errorType === "forbidden") status = HTTP_FORBIDDEN;
    if (result.errorType === "notfound") status = HTTP_NOT_FOUND;
    res.status(status).send(formatErrorResponse(result.error));
    return;
  }
  res.status(HTTP_OK).send({ ok: true, data: result.comment });
}

async function handleDeleteComment(req, res, commentId) {
  const user = getCurrentUser(req);
  const result = await deleteCommentService(commentId, user);
  if (!result.success) {
    let status = HTTP_BAD_REQUEST;
    if (result.errorType === "unauthorized") status = 401;
    if (result.errorType === "forbidden") status = HTTP_FORBIDDEN;
    if (result.errorType === "notfound") status = HTTP_NOT_FOUND;
    res.status(status).send(formatErrorResponse(result.error));
    return;
  }
  res.status(HTTP_OK).send({ ok: true, data: result.comment });
}

function handleBugHatchComments(req, res) {
  const url = req.url.replace(/\?.*$/, "");

  // /api/bug-hatch/issues/:iid/comments
  const listMatch = url.match(/\/api\/bug-hatch\/issues\/([^/]+)\/comments\/?$/);
  if (listMatch) {
    const issueId = listMatch[1];
    if (req.method === "GET") {
      handleListIssueComments(req, res, issueId);
      return;
    }
    if (req.method === "POST") {
      handleCreateComment(req, res, issueId);
      return;
    }
  }

  // /api/bug-hatch/comments/:cid
  const commentMatch = url.match(/\/api\/bug-hatch\/comments\/([^/]+)\/?$/);
  if (commentMatch) {
    const commentId = commentMatch[1];
    if (req.method === "PATCH") {
      handlePatchComment(req, res, commentId);
      return;
    }
    if (req.method === "DELETE") {
      handleDeleteComment(req, res, commentId);
      return;
    }
  }

  res.status(404).send(formatErrorResponse("Comment endpoint not found"));
}

module.exports = { handleBugHatchComments };
