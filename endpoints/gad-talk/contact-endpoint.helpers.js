const { logError, logTrace } = require("../../helpers/logger-api");
const { formatErrorResponse } = require("../../helpers/helpers");
const {
  HTTP_OK,
  HTTP_BAD_REQUEST,
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_TOO_MANY_REQUESTS,
} = require("../../helpers/response.helpers");
const { createGadTalkAuditLog } = require("./db-gad-talk.operations");

function normalizeValue(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Simple in-memory rate limiter per IP
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // max messages per window

function removeControlChars(str) {
  if (!str) return "";
  let out = "";
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 32 && code !== 127) {
      out += str.charAt(i);
    } else {
      out += " ";
    }
  }
  return out;
}

function isRateLimited(key) {
  const now = Date.now();
  const state = rateLimitMap.get(key) || { times: [] };
  // Keep only times within window
  state.times = state.times.filter((t) => now - t <= RATE_LIMIT_WINDOW_MS);
  if (state.times.length >= RATE_LIMIT_MAX) {
    // Don't change state (still rate-limited)
    rateLimitMap.set(key, state);
    return true;
  }
  state.times.push(now);
  rateLimitMap.set(key, state);
  return false;
}

/**
 * Submit contact form
 * POST /api/gad-talk/contact
 */
async function handleContactForm(req, res) {
  try {
    const ip =
      (req.headers?.["x-forwarded-for"] && req.headers["x-forwarded-for"].split(",")[0].trim()) ||
      req.socket?.remoteAddress ||
      "unknown";

    // Rate limit per IP
    if (isRateLimited(ip)) {
      return res
        .status(HTTP_TOO_MANY_REQUESTS)
        .send(formatErrorResponse("Too many requests. Please wait before sending another message."));
    }

    const name = normalizeValue(req.body?.name);
    const email = normalizeValue(req.body?.email);
    const subject = normalizeValue(req.body?.subject);
    const message = normalizeValue(req.body?.message);
    const source = normalizeValue(req.body?.source) || "gad-talk-contact";

    // Basic presence checks
    if (!name || !email || !message) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Name, email, and message are required."));
    }

    // Validate common fields and lengths
    if (!isValidEmail(email) || email.length > 120) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Email address is invalid or too long."));
    }

    if (name.length > 80) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Name is too long."));
    }

    if (subject.length > 120) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Subject is too long."));
    }

    if (message.length > 2000) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Message is too long."));
    }

    // Sanitize control characters from message and subject
    const sanitizedMessage = removeControlChars(message).trim();
    const sanitizedSubject = removeControlChars(subject).trim();

    const auditPayload = {
      name,
      email,
      subject: sanitizedSubject,
      message: sanitizedMessage,
      source,
      page: req.headers?.referer || "",
      userAgent: req.headers?.["user-agent"] || "",
      ip,
    };

    // Try to log to audit DB - do not fail the request if audit logging fails
    try {
      await createGadTalkAuditLog({
        actorUserId: req.gadTalkUserId || null,
        eventType: "contact.form_submitted",
        payloadObject: auditPayload,
      });

      logTrace("GadTalk contact form submitted", { email, source, userId: req.gadTalkUserId || null });

      return res.status(HTTP_OK).send({
        ok: true,
        data: {
          message: "Thanks! Your message has been logged for review.",
        },
      });
    } catch (auditErr) {
      logError("GadTalk contact form audit log failed", { error: auditErr?.message || auditErr, email, source });
      // Still return success but indicate a warning so callers can surface it if needed
      return res.status(HTTP_OK).send({
        ok: true,
        data: {
          message: "Thanks! Your message has been received. (audit logging failed)",
          warning: "audit_log_failed",
        },
      });
    }
  } catch (error) {
    logError("GadTalk contact form error:", error);
    return res
      .status(HTTP_INTERNAL_SERVER_ERROR)
      .send(formatErrorResponse(error.message || "Unable to submit contact form"));
  }
}

module.exports = {
  handleContactForm,
};
