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
  createProjectService,
  listProjectsService,
  getProjectService,
  patchProjectService,
  addMemberService,
  removeMemberService,
} = require("../../services/bug-hatch/project.service");
const { logError } = require("../../helpers/logger-api");

function getCurrentUserFromReq(req) {
  const token = req.cookies["bug-hatch-token"];
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || decoded instanceof Error) return null;
  const base = { id: decoded.userId, role: decoded.role, email: decoded.email, isDemo: decoded.isDemo === true };
  if (req.bugHatchForceDemo === true) {
    base.isDemo = true;
  }
  return base;
}

async function handleListProjects(req, res) {
  const user = getCurrentUserFromReq(req);
  const result = listProjectsService(req.query || {}, user);
  if (!result.success) {
    const status = result.errorType === "unauthorized" ? 401 : 400;
    res.status(status).send(formatErrorResponse(result.error));
    return;
  }
  res.status(HTTP_OK).send({ ok: true, data: { projects: result.projects, total: result.total } });
}

async function handleCreateProject(req, res) {
  const user = getCurrentUserFromReq(req);
  try {
    const result = await createProjectService(req.body || {}, user);
    if (!result.success) {
      let status = HTTP_BAD_REQUEST;
      if (result.errorType === "forbidden") status = HTTP_FORBIDDEN;
      if (result.errorType === "unique") status = 409;
      res.status(status).send(formatErrorResponse(result.error));
      return;
    }
    res.status(HTTP_CREATED).send({ ok: true, data: result.project });
  } catch (e) {
    logError("Create project error", e);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(e.message));
  }
}

async function handleGetProject(req, res, projectId) {
  const user = getCurrentUserFromReq(req);
  const result = getProjectService(projectId, user);
  if (!result.success) {
    let status = HTTP_BAD_REQUEST;
    if (result.errorType === "notfound") status = HTTP_NOT_FOUND;
    if (result.errorType === "forbidden") status = HTTP_FORBIDDEN;
    if (result.errorType === "unauthorized") status = 401;
    res.status(status).send(formatErrorResponse(result.error));
    return;
  }
  res.status(HTTP_OK).send({ ok: true, data: result.project });
}

async function handlePatchProject(req, res, projectId) {
  const user = getCurrentUserFromReq(req);
  const result = await patchProjectService(projectId, req.body || {}, user);
  if (!result.success) {
    let status = HTTP_BAD_REQUEST;
    if (result.errorType === "forbidden") status = HTTP_FORBIDDEN;
    res.status(status).send(formatErrorResponse(result.error));
    return;
  }
  res.status(HTTP_OK).send({ ok: true, data: result.project });
}

async function handleAddMember(req, res, projectId) {
  const user = getCurrentUserFromReq(req);
  const { userId } = req.body || {};
  const result = await addMemberService(projectId, userId, user);
  if (!result.success) {
    let status = HTTP_BAD_REQUEST;
    if (result.errorType === "forbidden") status = HTTP_FORBIDDEN;
    res.status(status).send(formatErrorResponse(result.error));
    return;
  }
  res.status(HTTP_OK).send({ ok: true, data: result.project });
}

async function handleRemoveMember(req, res, projectId, userId) {
  const current = getCurrentUserFromReq(req);
  const result = await removeMemberService(projectId, userId, current);
  if (!result.success) {
    let status = HTTP_BAD_REQUEST;
    if (result.errorType === "forbidden") status = HTTP_FORBIDDEN;
    res.status(status).send(formatErrorResponse(result.error));
    return;
  }
  res.status(HTTP_OK).send({ ok: true, data: result.project });
}

function handleBugHatchProjects(req, res) {
  // Normalize URL path
  const url = req.url.replace(/\?.*$/, "");

  // /api/bug-hatch/projects
  if (req.method === "GET" && /\/api\/bug-hatch\/projects(\/?$|\?)/.test(url)) {
    handleListProjects(req, res);
    return;
  }
  if (req.method === "POST" && /\/api\/bug-hatch\/projects\/?$/.test(url)) {
    handleCreateProject(req, res);
    return;
  }

  // /api/bug-hatch/projects/:pid
  const projectMatch = url.match(/\/api\/bug-hatch\/projects\/([^/]+)\/?$/);
  if (projectMatch) {
    const projectId = projectMatch[1];
    if (req.method === "GET") {
      handleGetProject(req, res, projectId);
      return;
    }
    if (req.method === "PATCH") {
      handlePatchProject(req, res, projectId);
      return;
    }
  }

  // /api/bug-hatch/projects/:pid/members
  const membersAddMatch = url.match(/\/api\/bug-hatch\/projects\/([^/]+)\/members\/?$/);
  if (membersAddMatch) {
    const projectId = membersAddMatch[1];
    if (req.method === "POST") {
      handleAddMember(req, res, projectId);
      return;
    }
  }

  // /api/bug-hatch/projects/:pid/members/:uid
  const memberRemoveMatch = url.match(/\/api\/bug-hatch\/projects\/([^/]+)\/members\/([^/]+)\/?$/);
  if (memberRemoveMatch) {
    const projectId = memberRemoveMatch[1];
    const userId = memberRemoveMatch[2];
    if (req.method === "DELETE") {
      handleRemoveMember(req, res, projectId, userId);
      return;
    }
  }

  res.status(404).send(formatErrorResponse("Project endpoint not found"));
}

module.exports = { handleBugHatchProjects };
