const path = require("path");
const fs = require("fs");
const multer = require("multer");
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
  listAttachmentsService,
  uploadAttachmentService,
  getAttachmentService,
  deleteAttachmentService,
  UPLOAD_DIR,
} = require("./services/attachment.service");

// Multer storage config (store original name separately)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

function getCurrentUser(req) {
  const token = req.cookies["bug-hatch-token"]; // cookie-based
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || decoded instanceof Error) return null;
  const base = { id: decoded.userId, role: decoded.role, email: decoded.email, isDemo: decoded.isDemo === true };
  if (req.bugHatchForceDemo === true) base.isDemo = true;
  return base;
}

async function handleListIssueAttachments(req, res, issueId) {
  const user = getCurrentUser(req);
  const result = listAttachmentsService(issueId, user);
  if (!result.success) {
    let status = HTTP_BAD_REQUEST;
    if (result.errorType === "unauthorized") status = 401;
    if (result.errorType === "forbidden") status = HTTP_FORBIDDEN;
    if (result.errorType === "notfound") status = HTTP_NOT_FOUND;
    res.status(status).send(formatErrorResponse(result.error));
    return;
  }
  res.status(HTTP_OK).send({ ok: true, data: { attachments: result.attachments } });
}

async function handleUploadAttachment(req, res, issueId) {
  const user = getCurrentUser(req);
  const file = req.file;
  const result = await uploadAttachmentService(issueId, file, user);
  if (!result.success) {
    let status = HTTP_BAD_REQUEST;
    if (result.errorType === "unauthorized") status = 401;
    if (result.errorType === "forbidden") status = HTTP_FORBIDDEN;
    if (result.errorType === "notfound") status = HTTP_NOT_FOUND;
    res.status(status).send(formatErrorResponse(result.error));
    return;
  }
  res.status(HTTP_CREATED).send({ ok: true, data: result.attachment });
}

async function handleGetAttachment(req, res, attachmentId) {
  const user = getCurrentUser(req);
  const result = getAttachmentService(attachmentId, user);
  if (!result.success) {
    let status = HTTP_BAD_REQUEST;
    if (result.errorType === "unauthorized") status = 401;
    if (result.errorType === "forbidden") status = HTTP_FORBIDDEN;
    if (result.errorType === "notfound") status = HTTP_NOT_FOUND;
    res.status(status).send(formatErrorResponse(result.error));
    return;
  }
  const attachment = result.attachment;
  try {
    res.setHeader("Content-Type", attachment.mime || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${attachment.filename}"`);
    const stream = fs.createReadStream(attachment.path);
    stream.on("error", () => {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("File not found"));
    });
    stream.pipe(res);
  } catch (e) {
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Failed to stream file"));
  }
}

async function handleDeleteAttachment(req, res, attachmentId) {
  const user = getCurrentUser(req);
  const result = await deleteAttachmentService(attachmentId, user);
  if (!result.success) {
    let status = HTTP_BAD_REQUEST;
    if (result.errorType === "unauthorized") status = 401;
    if (result.errorType === "forbidden") status = HTTP_FORBIDDEN;
    if (result.errorType === "notfound") status = HTTP_NOT_FOUND;
    res.status(status).send(formatErrorResponse(result.error));
    return;
  }
  res.status(HTTP_OK).send({ ok: true, data: result.attachment });
}

// Main dispatcher
function handleBugHatchAttachments(req, res) {
  const url = req.url.replace(/\?.*$/, "");

  // /api/bug-hatch/issues/:iid/attachments
  const listMatch = url.match(/\/api\/bug-hatch\/issues\/([^/]+)\/attachments\/?$/);
  if (listMatch) {
    const issueId = listMatch[1];
    if (req.method === "GET") {
      handleListIssueAttachments(req, res, issueId);
      return;
    }
    if (req.method === "POST") {
      // Use multer single middleware manually
      upload.single("file")(req, res, function (err) {
        if (err) {
          res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Upload failed: " + err.message));
          return;
        }
        handleUploadAttachment(req, res, issueId);
      });
      return;
    }
  }

  // /api/bug-hatch/attachments/:aid
  const attMatch = url.match(/\/api\/bug-hatch\/attachments\/([^/]+)\/?$/);
  if (attMatch) {
    const attachmentId = attMatch[1];
    if (req.method === "GET") {
      handleGetAttachment(req, res, attachmentId);
      return;
    }
    if (req.method === "DELETE") {
      handleDeleteAttachment(req, res, attachmentId);
      return;
    }
  }

  res.status(404).send(formatErrorResponse("Attachment endpoint not found"));
}

module.exports = { handleBugHatchAttachments };
