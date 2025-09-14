const { formatErrorResponse } = require("../../../helpers/helpers");
const { HTTP_OK, HTTP_BAD_REQUEST, HTTP_INTERNAL_SERVER_ERROR } = require("../../../helpers/response.helpers");
const { logDebug } = require("../../../helpers/logger-api");
const cookie = require("cookie");

// Askio standalone AI (no Nova references)
// -------------------------------------------------
// Per-user memory (learned terms, preferences, topics)
const askioUserMemory = {}; // { [userId]: { terms: { [term]: definition }, topics: string[], prefs: object } }

function getUserMemory(userId) {
  if (!userId) return { terms: {}, topics: [], prefs: {} };
  if (!askioUserMemory[userId]) {
    askioUserMemory[userId] = { terms: {}, topics: [], prefs: {} };
  }
  return askioUserMemory[userId];
}

// Utilities
function normalize(text) {
  return String(text || "").trim();
}

function toLower(text) {
  return normalize(text).toLowerCase();
}

// Simple Levenshtein distance for fuzzy term matching
function levenshtein(a, b) {
  a = String(a);
  b = String(b);
  const m = a.length,
    n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function similarity(a, b) {
  if (!a || !b) return 0;
  const dist = levenshtein(a.toLowerCase(), b.toLowerCase());
  const maxLen = Math.max(a.length, b.length) || 1;
  return 1 - dist / maxLen;
}

function fuzzyFindTerm(term, termsMap) {
  const keys = Object.keys(termsMap || {});
  let best = { key: null, score: 0 };
  for (const k of keys) {
    const s = similarity(term, k);
    if (s > best.score) best = { key: k, score: s };
  }
  return best.score >= 0.75 ? best.key : null;
}

// Safe calculator (only digits, ops, dot, parentheses, spaces)
function safeCalculate(expr) {
  const cleaned = String(expr).replace(/[^0-9+\-*/().\s]/g, "");
  if (!cleaned) throw new Error("Empty expression");
  // eslint-disable-next-line no-new-func
  const fn = new Function(`return (${cleaned})`);
  const result = fn();
  if (typeof result !== "number" || !isFinite(result)) throw new Error("Invalid result");
  return result;
}

// NLU: intent detection
function detectIntent(message) {
  const msg = toLower(message);
  if (!msg) return { intent: "unknown" };

  // Identity / capabilities / reasoning
  if (/(what(?:'s| is) your name|who are you|what are you called)/.test(msg)) {
    return { intent: "identity" };
  }
  if (/(what can you do|capabilities|skills|features|what do you do)/.test(msg)) {
    return { intent: "capabilities" };
  }
  if (/(how do you (reason|work|think)|how does (this|it) work|how do you solve)/.test(msg)) {
    return { intent: "reasoning" };
  }

  // Teach term: "X means Y", "define X as Y", "remember that X is Y", "learn: X = Y"
  if (/^learn\s*:/.test(msg) || /\bdefine\b.+\bas\b/.test(msg) || /\bmeans\b/.test(msg) || /remember that/.test(msg)) {
    return { intent: "teach-term" };
  }
  // Ask define
  if (/^(what is|what's)\b/.test(msg) || /^define\b/.test(msg) || /tell me about\b/.test(msg)) {
    return { intent: "ask-define" };
  }
  // Calculate
  if (/^calc\b/.test(msg) || /\bcalculate\b/.test(msg) || /\bwhat is [0-9().\s+\-*/]+\??$/.test(msg)) {
    return { intent: "calculate" };
  }
  // Sort
  if (/^sort\b/.test(msg) || /\bsort\s*:\s*/.test(msg)) {
    return { intent: "sort" };
  }
  // Issue solver triggers
  if (/\b(problem|issue|error|bug|fail|can't|cannot|doesn't work)\b/.test(msg)) {
    return { intent: "issue-solver" };
  }
  // Greeting / small talk
  if (/\b(hi|hello|hey|good (morning|afternoon|evening))\b/.test(msg)) {
    return { intent: "greet" };
  }
  if (/\b(thanks|thank you)\b/.test(msg)) {
    return { intent: "gratitude" };
  }
  return { intent: "unknown" };
}

// Parsers
function parseTeach(message) {
  const original = normalize(message);
  const msg = toLower(original);

  // learn: x = y
  let m = msg.match(/^learn\s*:\s*([^=]+)=\s*(.+)$/);
  if (m)
    return {
      term: normalize(m[1]),
      definition: normalize(original.slice(original.toLowerCase().indexOf(m[2]))),
      ok: true,
    };

  // define x as y
  m = msg.match(/define\s+(.+?)\s+as\s+(.+)/);
  if (m)
    return {
      term: normalize(m[1]),
      definition: normalize(original.slice(original.toLowerCase().indexOf(m[2]))),
      ok: true,
    };

  // x means y
  m = msg.match(/^(.+?)\s+means\s+(.+)/);
  if (m)
    return {
      term: normalize(m[1]),
      definition: normalize(original.slice(original.toLowerCase().indexOf(m[2]))),
      ok: true,
    };

  // remember that x is y
  m = msg.match(/remember that\s+(.+?)\s+is\s+(.+)/);
  if (m)
    return {
      term: normalize(m[1]),
      definition: normalize(original.slice(original.toLowerCase().indexOf(m[2]))),
      ok: true,
    };

  return { ok: false };
}

function extractTermQuestion(message) {
  const msg = toLower(message);
  let m = msg.match(/^(?:what is|what's)\s+"?(.+?)"?\??$/);
  if (m) return normalize(m[1]);
  m = msg.match(/^define\s+"?(.+?)"?\??$/);
  if (m) return normalize(m[1]);
  m = msg.match(/tell me about\s+"?(.+?)"?\??$/);
  if (m) return normalize(m[1]);
  return null;
}

function parseCalc(message) {
  const original = normalize(message);
  const msg = toLower(original);
  let expr = null;
  const m1 = msg.match(/^calc\s*:?\s*(.+)$/);
  const m2 = msg.match(/calculate\s+(.+)$/);
  const m3 = msg.match(/^what is\s+(.+?)\??$/);
  if (m1) expr = original.slice(original.toLowerCase().indexOf(m1[1]));
  else if (m2) expr = original.slice(original.toLowerCase().indexOf(m2[1]));
  else if (m3) expr = original.slice(original.toLowerCase().indexOf(m3[1]));
  return expr ? expr : null;
}

function parseSort(message) {
  const original = normalize(message);
  const msg = toLower(original);
  let listPart = null;
  let order = "asc";
  const m = msg.match(/^sort\s*:?\s*(.+)$/);
  if (m) listPart = original.slice(original.toLowerCase().indexOf(m[1]));
  if (/\bdesc\b/.test(msg)) order = "desc";

  if (!listPart) return null;
  // Try JSON-like [a, b] or comma/space separated
  let items = [];
  const jsonList = listPart.match(/\[(.*)\]/);
  if (jsonList) {
    items = jsonList[1]
      .split(",")
      .map((s) => normalize(s.replace(/^["']|["']$/g, "")))
      .filter(Boolean);
  } else {
    items = listPart
      .split(/[;,]/)
      .map((s) => normalize(s))
      .filter(Boolean);
  }

  // Determine numeric or string
  const allNumeric = items.every((x) => /^-?\d+(\.\d+)?$/.test(x));
  if (allNumeric) {
    items = items.map(Number).sort((a, b) => (order === "asc" ? a - b : b - a));
  } else {
    items = items.sort((a, b) => (order === "asc" ? a.localeCompare(b) : b.localeCompare(a)));
  }
  return { items, order };
}

// Askio-specific in-memory stores
const conversations = {};
const conversationAnalytics = {}; // { convId: { userId, name, startTime, lastActiveTime, messageCount, skillUsage: {intent: count}, issueState: {...} } }

function ensureConversation(conversationId, userId, conversationName) {
  if (!conversations[conversationId]) {
    conversations[conversationId] = [];
  }
  if (!conversationAnalytics[conversationId]) {
    conversationAnalytics[conversationId] = {
      startTime: Date.now(),
      messageCount: 0,
      lastActiveTime: Date.now(),
      name: conversationName || "New Conversation",
      userId,
      skillUsage: {},
      issueState: null,
    };
  }
}

function trackSkill(conversationId, intent) {
  const a = conversationAnalytics[conversationId];
  if (!a.skillUsage[intent]) a.skillUsage[intent] = 0;
  a.skillUsage[intent] += 1;
}

function generateAIResponse(message, conversationId) {
  ensureConversation(conversationId, conversationAnalytics[conversationId]?.userId);
  const analytics = conversationAnalytics[conversationId];
  analytics.messageCount += 1;
  analytics.lastActiveTime = Date.now();

  const userId = analytics.userId;
  const mem = getUserMemory(userId);
  const steps = [];

  const text = normalize(message);
  const intent = detectIntent(text).intent;
  steps.push({ step: "nlu", intent });

  let response = "";

  // Save user message first
  conversations[conversationId].push({ role: "user", content: text });

  // Identity / capabilities / reasoning
  if (intent === "identity") {
    trackSkill(conversationId, "identity");
    response = "I'm Askio, a tiny demo AI in this app.";
  } else if (intent === "capabilities") {
    trackSkill(conversationId, "capabilities");
    response = "I can learn terms, define them, do quick math, sort lists, and help troubleshoot issues.";
  } else if (intent === "reasoning") {
    trackSkill(conversationId, "reasoning");
    response =
      "I detect intent, parse your input, use tools like math/sort, look up learned terms (with fuzzy match), and guide troubleshooting.";
  }
  // TEACH TERM
  else if (intent === "teach-term") {
    const parsed = parseTeach(text);
    if (parsed.ok && parsed.term && parsed.definition) {
      const termKey = parsed.term.toLowerCase();
      mem.terms[termKey] = parsed.definition;
      // Track topic interest from definition first word
      const topic = termKey.split(/\s+/)[0];
      if (topic && !mem.topics.includes(topic)) mem.topics.unshift(topic);
      trackSkill(conversationId, "teach-term");
      response = `Got it. I learned “${parsed.term}”. You can ask me “what is ${parsed.term}?” anytime.`;
      steps.push({ step: "learned", term: parsed.term });
    } else {
      response = "To teach me, try: 'learn: term = definition' or 'define TERM as DEFINITION'.";
    }
  }
  // ASK DEFINE
  else if (intent === "ask-define") {
    const term = extractTermQuestion(text);
    if (term) {
      const key = term.toLowerCase();
      let found = mem.terms[key];
      let matched = key;
      if (!found) {
        const fuzzy = fuzzyFindTerm(key, mem.terms);
        if (fuzzy) {
          found = mem.terms[fuzzy];
          matched = fuzzy;
          steps.push({ step: "fuzzy-match", from: key, to: fuzzy });
        }
      }
      if (found) {
        trackSkill(conversationId, "ask-define");
        response = `${matched}: ${found}`;
      } else {
        response = `I don't know “${term}” yet. You can teach me: ‘learn: ${term} = your definition’.`;
      }
    } else {
      response = "Please specify the term, e.g., ‘what is polymorphism?’";
    }
  }
  // CALCULATE
  else if (intent === "calculate") {
    const expr = parseCalc(text);
    if (expr) {
      try {
        const result = safeCalculate(expr);
        trackSkill(conversationId, "calculate");
        response = `${expr} = ${result}`;
        steps.push({ step: "calculated", expr, result });
      } catch (e) {
        response = "I couldn't compute that. Use numbers and + - * / ( ).";
      }
    } else {
      response = "Try: ‘calc: (2+3)*4’ or ‘what is 3.5*8?’";
    }
  }
  // SORT
  else if (intent === "sort") {
    const parsed = parseSort(text);
    if (parsed) {
      trackSkill(conversationId, "sort");
      response = `Sorted (${parsed.order}): ${parsed.items.join(", ")}`;
      steps.push({ step: "sorted", order: parsed.order, count: parsed.items.length });
    } else {
      response = "Try: ‘sort: 3, 1, 2 desc’ or ‘sort: [pear, apple, kiwi] asc’.";
    }
  }
  // ISSUE SOLVER (guided troubleshooting)
  else if (intent === "issue-solver") {
    if (!analytics.issueState) {
      analytics.issueState = {
        stage: "gathering",
        description: text,
        details: {},
        asked: 0,
      };
      trackSkill(conversationId, "issue-solver");
      response = "Let's troubleshoot. What environment are you on (OS, runtime, version)?";
      steps.push({ step: "issue-start" });
    } else {
      const s = analytics.issueState;
      if (s.stage === "gathering") {
        s.asked += 1;
        if (!s.details.environment) {
          s.details.environment = text;
          response = "Got it. Any exact error message/log you see?";
        } else if (!s.details.repro) {
          s.details.error = text;
          response = "What steps reproduce it?";
          s.details.repro = null; // placeholder to ask next
        } else if (s.details.repro === null) {
          s.details.repro = text;
          s.stage = "suggesting";
          response = [
            "Try these steps:",
            "1) Reproduce with verbose logs enabled.",
            "2) Clear caches/artifacts and reinstall dependencies.",
            "3) Isolate by running a minimal repro (only the failing part).",
            "4) If it's a config/path issue, print absolute paths and check permissions.",
            "5) Share the minimal repro if it still fails.",
          ].join("\n");
          steps.push({ step: "issue-suggest" });
        }
      } else {
        response = "If you'd like, tell me what happened after trying the suggestions, or say ‘done’ to finish.";
      }
    }
  }
  // GREET / GRATITUDE / DEFAULT
  else if (intent === "greet") {
    trackSkill(conversationId, "greet");
    response =
      "Hi! I can learn terms (learn: X = ...), define them, do quick math (calc: ...), sort lists, and help troubleshoot issues.";
  } else if (intent === "gratitude") {
    trackSkill(conversationId, "gratitude");
    response = "You're welcome!";
  } else {
    response = "I'm Askio. Try: ‘learn: API = Application Programming Interface’, then ask ‘what is API?’";
  }

  // Save assistant message
  conversations[conversationId].push({ role: "assistant", content: response });

  // Trim long histories
  if (conversations[conversationId].length > 50) {
    const initial = conversations[conversationId].slice(0, 10);
    const recent = conversations[conversationId].slice(-40);
    conversations[conversationId] = [...initial, ...recent];
  }

  // Cleanup old conversations (24h)
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000;
  Object.keys(conversationAnalytics).forEach((cid) => {
    if (now - conversationAnalytics[cid].lastActiveTime > maxAge) {
      delete conversations[cid];
      delete conversationAnalytics[cid];
      logDebug(`[Askio] Cleaned up old conversation: ${cid}`);
    }
  });

  return response;
}

function getUserAndConversationIdFromCookies(req) {
  let userId = null;
  let conversationId = null;
  if (req.headers.cookie) {
    const cookies = cookie.parse(req.headers.cookie);
    // Keep cookie names compatible with the demo page
    userId = cookies.novaUserId;
    conversationId = cookies.novaConversationId;
  }
  return { userId, conversationId };
}

function handleMessage(req, res) {
  try {
    if (!req.body || typeof req.body !== "object") {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Invalid request body"));
    }

    let { message, conversationId, conversationName } = req.body;
    const cookieIds = getUserAndConversationIdFromCookies(req);
    if (!conversationId && cookieIds.conversationId) conversationId = cookieIds.conversationId;

    let userId = null;
    if (conversationId) {
      const parts = conversationId.split("_");
      if (parts.length >= 3) userId = parts[1];
    } else if (cookieIds.userId) {
      userId = cookieIds.userId;
    }

    if (!message || typeof message !== "string") {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Message is required and must be a string"));
    }

    message = message.trim();
    if (message.length === 0) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Message cannot be empty"));
    }
    if (message.length > 1000) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Message is too long (max 1000 characters)"));
    }

    if (!conversationId || !conversations[conversationId]) {
      if (!userId || userId === "user") {
        userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      }
      conversationId = `conv_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      res.setHeader("Set-Cookie", [
        cookie.serialize("novaUserId", userId, {
          httpOnly: false,
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
          sameSite: "Lax",
        }),
        cookie.serialize("novaConversationId", conversationId, {
          httpOnly: false,
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
          sameSite: "Lax",
        }),
      ]);
      ensureConversation(conversationId, userId, conversationName);
    } else {
      ensureConversation(conversationId, userId, conversationName);
    }

    if (conversationName && !conversationAnalytics[conversationId]?.name) {
      conversationAnalytics[conversationId].name = conversationName;
    }

    let response;
    try {
      response = generateAIResponse(message, conversationId);
    } catch (error) {
      logDebug("[Askio] Error generating AI response", { error: error.message });
      response = "I'm sorry, I encountered an error while processing your message. Please try again.";
    }

    if (!response || typeof response !== "string") {
      response = "I'm sorry, I couldn't generate a proper response. Please try again.";
    }

    return res
      .status(HTTP_OK)
      .json({ response, conversationId, conversationName: conversationAnalytics[conversationId]?.name });
  } catch (error) {
    logDebug("[Askio] handleMessage", { error: error.message });
    return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Failed to process message"));
  }
}

function getConversationHistory(req, res) {
  try {
    const { conversationId } = req.query;
    if (!conversationId) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Conversation ID is required"));
    }
    const history = conversations[conversationId] || [];
    return res.status(HTTP_OK).json({ history, conversationId });
  } catch (error) {
    logDebug("[Askio] getConversationHistory", { error: error.message });
    return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Failed to retrieve conversation history"));
  }
}

function clearConversation(req, res) {
  try {
    const { conversationId } = req.body;
    if (!conversationId) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Conversation ID is required"));
    }
    if (conversations[conversationId]) {
      delete conversations[conversationId];
    }
    if (conversationAnalytics[conversationId]) {
      delete conversationAnalytics[conversationId];
    }
    return res.status(HTTP_OK).json({ message: "Conversation cleared successfully", conversationId });
  } catch (error) {
    logDebug("[Askio] clearConversation", { error: error.message });
    return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Failed to clear conversation"));
  }
}

function renameConversation(req, res) {
  try {
    const { conversationId, name } = req.body;
    if (!conversationId || !name) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Conversation ID and name are required"));
    }
    if (!conversationAnalytics[conversationId]) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Conversation not found"));
    }
    conversationAnalytics[conversationId].name = name;
    return res.status(HTTP_OK).json({ message: "Conversation renamed successfully", conversationId, name });
  } catch (error) {
    logDebug("[Askio] renameConversation", { error: error.message });
    return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Failed to rename conversation"));
  }
}

function listConversations(req, res) {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("User ID is required"));
    }

    const userConversations = Object.keys(conversationAnalytics)
      .filter((cid) => conversationAnalytics[cid]?.userId === userId)
      .map((cid) => ({
        id: cid,
        name: conversationAnalytics[cid].name || "Unnamed Conversation",
        messageCount: conversationAnalytics[cid].messageCount,
        startTime: conversationAnalytics[cid].startTime,
        lastActiveTime: conversationAnalytics[cid].lastActiveTime,
        skillUsage: conversationAnalytics[cid].skillUsage || {},
      }));

    return res.status(HTTP_OK).json({ conversations: userConversations });
  } catch (error) {
    logDebug("[Askio] listConversations", { error: error.message });
    return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Failed to list conversations"));
  }
}

function getStatistics(req, res) {
  try {
    const stats = {
      totalConversations: Object.keys(conversations).length,
      totalMessages: Object.values(conversationAnalytics).reduce((sum, conv) => sum + conv.messageCount, 0),
      activeConversations: Object.values(conversationAnalytics).filter(
        (conv) => Date.now() - conv.lastActiveTime < 3600000
      ).length,
      avgMessagesPerConversation: 0,
      topSkills: {},
    };
    if (stats.totalConversations > 0) {
      stats.avgMessagesPerConversation = Number((stats.totalMessages / stats.totalConversations).toFixed(2));
    }
    // Aggregate skill usage
    for (const conv of Object.values(conversationAnalytics)) {
      for (const [skill, count] of Object.entries(conv.skillUsage || {})) {
        stats.topSkills[skill] = (stats.topSkills[skill] || 0) + count;
      }
    }
    return res.status(HTTP_OK).json(stats);
  } catch (error) {
    logDebug("[Askio] getStatistics", { error: error.message });
    return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Failed to get statistics"));
  }
}

function clearUserMemory(req, res) {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("User ID is required"));
    }
    delete askioUserMemory[userId];
    for (const conversationId in conversationAnalytics) {
      if (conversationAnalytics[conversationId]?.userId === userId) {
        if (conversationAnalytics[conversationId].issueState) {
          conversationAnalytics[conversationId].issueState = null;
        }
      }
    }
    logDebug("[Askio] clearUserMemory", { userId });
    return res.status(HTTP_OK).json({ message: "User memory and learned terms cleared successfully", userId });
  } catch (error) {
    logDebug("[Askio] clearUserMemory", { error: error.message });
    return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Failed to clear user memory"));
  }
}

function initSession(req, res) {
  try {
    let userId = req.query.userId;
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
    const conversationId = `conv_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    res.setHeader("Set-Cookie", [
      cookie.serialize("novaUserId", userId, { httpOnly: false, path: "/", maxAge: 60 * 60 * 24 * 7, sameSite: "Lax" }),
      cookie.serialize("novaConversationId", conversationId, {
        httpOnly: false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "Lax",
      }),
    ]);

    conversations[conversationId] = [];
    conversationAnalytics[conversationId] = {
      startTime: Date.now(),
      messageCount: 0,
      lastActiveTime: Date.now(),
      name: "New Conversation",
      userId,
      skillUsage: {},
      issueState: null,
    };

    logDebug("[Askio] initSession", { userId, conversationId });

    return res.status(HTTP_OK).json({ userId, conversationId, conversationName: "New Conversation" });
  } catch (error) {
    logDebug("[Askio] initSession", { error: error.message });
    return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Failed to initialize session"));
  }
}

function clearAllConversations(userId) {
  if (!userId) return false;
  let found = false;
  for (const convId of Object.keys(conversationAnalytics)) {
    if (conversationAnalytics[convId]?.userId === userId) {
      if (conversations[convId]) delete conversations[convId];
      delete conversationAnalytics[convId];
      found = true;
    }
  }
  return found;
}

function getUserKnowledge(req, res) {
  try {
    // Prefer explicit userId, else cookie
    let userId = req.query.userId;
    if (!userId && req.headers.cookie) {
      const cookies = cookie.parse(req.headers.cookie);
      userId = cookies.novaUserId;
    }
    if (!userId) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("User ID is required"));
    }
    const mem = getUserMemory(userId);
    const terms = Object.keys(mem.terms || {}).map((t) => ({ term: t, definition: mem.terms[t] }));
    return res.status(HTTP_OK).json({ userId, terms, topics: mem.topics || [], prefs: mem.prefs || {} });
  } catch (error) {
    logDebug("[Askio] getUserKnowledge", { error: error.message });
    return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Failed to get user knowledge"));
  }
}

module.exports = {
  handleMessage,
  getConversationHistory,
  clearConversation,
  renameConversation,
  listConversations,
  getStatistics,
  clearUserMemory,
  initSession,
  clearAllConversations,
  getUserKnowledge,
};
