const { formatErrorResponse } = require("../../../helpers/helpers");
const { logDebug } = require("../../../helpers/logger-api");
const { HTTP_BAD_REQUEST, HTTP_OK } = require("../../../helpers/response.helpers");

// In-memory store for demo purposes
const store = {
  methods: [], // {id, name, type, desc}
  hintIndex: {}, // { [type]: number }
};
const service = {
  name: "Chibi",
  version: "1.0.0",
  persistence: "memory",
  capabilities: ["arithmetic", "linear", "quadratic"],
  startedAt: Date.now(),
};

// ---- Utils ----
function normalize(s = "") {
  return String(s).replace(/\s+/g, "").replace(/−/g, "-").replace(/×/g, "*").replace(/÷/g, "/").toLowerCase();
}
function isEquation(s) {
  return s.includes("=");
}
function detectType(input = "") {
  const s = normalize(input);
  if (!s) return "unknown";
  if (!isEquation(s)) return "arithmetic";
  if (/x\^2|x²/.test(s)) return "quadratic";
  if (/x/.test(s)) return "linear";
  return "unsupported";
}

function splitSides(eq) {
  const [L, R] = String(eq).split("=");
  if (R === undefined) throw new Error("Equation must contain = sign.");
  return [normalize(L), normalize(R)];
}
function parseLinearSide(side) {
  let s = side.replace(/\+/g, "+").replace(/(?<!^)-/g, "+-");
  if (s[0] === "+") s = s.slice(1);
  const terms = s.length ? s.split("+") : [];
  let ax = 0,
    c = 0;
  for (let t of terms) {
    if (!t) continue;
    if (t.includes("x")) {
      t = t.replace("x", "");
      if (t === "" || t === "+") t = "1";
      if (t === "-") t = "-1";
      ax += parseFloat(t);
    } else {
      c += parseFloat(t);
    }
  }
  if (!isFinite(ax)) ax = 0;
  if (!isFinite(c)) c = 0;
  return { a: ax, b: c };
}
function parseQuadraticSide(side) {
  const s = side.replace(/x²/g, "x^2");
  let temp = s.replace(/\+/g, "+").replace(/(?<!^)-/g, "+-");
  if (temp[0] === "+") temp = temp.slice(1);
  const terms = temp.length ? temp.split("+") : [];
  let a = 0,
    b = 0,
    c = 0;
  for (let t of terms) {
    if (!t) continue;
    if (t.includes("x^2")) {
      t = t.replace("x^2", "");
      if (t === "" || t === "+") t = "1";
      if (t === "-") t = "-1";
      a += parseFloat(t);
    } else if (t.includes("x")) {
      t = t.replace("x", "");
      if (t === "" || t === "+") t = "1";
      if (t === "-") t = "-1";
      b += parseFloat(t);
    } else {
      c += parseFloat(t);
    }
  }
  if (!isFinite(a)) a = 0;
  if (!isFinite(b)) b = 0;
  if (!isFinite(c)) c = 0;
  return { a, b, c };
}
function sanitizeArithmetic(expr) {
  const allowed = /^[0-9+\-*/().\s]+$/;
  if (!allowed.test(expr)) throw new Error("Only digits and + - * / ( ) are allowed for arithmetic.");
  return expr;
}
function evalSafe(expr) {
  const clean = sanitizeArithmetic(expr);
  // eslint-disable-next-line no-new-func
  return Function('"use strict"; return (' + clean + ")")();
}
function num(n) {
  return (Math.round(n * 1e10) / 1e10).toString();
}
function fmtLinear({ a, b }) {
  const terms = [];
  if (Math.abs(a) >= 1e-12) terms.push(`${num(a)}x`);
  if (Math.abs(b) >= 1e-12) terms.push(`${b >= 0 && terms.length ? "+ " : ""}${num(b)}`);
  return (
    terms
      .join(" ")
      .replace(/^\+\s*/, "")
      .trim() || "0"
  );
}
function fmtQuad({ a, b, c }) {
  const parts = [];
  if (Math.abs(a) >= 1e-12) parts.push(`${num(a)}x^2`);
  if (Math.abs(b) >= 1e-12) parts.push(`${b >= 0 && parts.length ? "+ " : ""}${num(b)}x`);
  if (Math.abs(c) >= 1e-12) parts.push(`${c >= 0 && parts.length ? "+ " : ""}${num(c)}`);
  return parts.join(" ").trim() || "0";
}

// ---- Hints ----
function builtinHints(type) {
  const base = {
    arithmetic: [
      "Compute inside parentheses first, then × and ÷, then + and −.",
      "Combine like operations step by step to avoid mistakes.",
      "Check your arithmetic — small slips often happen with subtraction.",
    ],
    linear: [
      "Try isolating x: move x-terms to one side and constants to the other.",
      "Add or subtract the same value on both sides to keep equality.",
      "Divide both sides by the coefficient of x at the end.",
    ],
    quadratic: [
      "Bring everything to one side so it equals 0.",
      "Consider the discriminant Δ = b² − 4ac to determine the number of real roots.",
      "If factoring is easy, try that; otherwise use the quadratic formula.",
    ],
  };
  return base[type] || ["Re-check your expression and try to simplify."];
}
function learnedHints(type) {
  return store.methods.filter((m) => m.type === type).map((m) => `Learned method: ${m.name} — ${m.desc}`);
}

// ---- Learned method integration ----
function splitMethodDesc(desc = "") {
  return String(desc)
    .split(/\r?\n|;/)
    .map((s) => s.trim())
    .filter(Boolean);
}
function buildMethodSteps(method, difficulty = "medium") {
  const parts = splitMethodDesc(method.desc);
  const steps = [`Apply learned method: ${method.name}`];
  if (difficulty === "hard") {
    if (parts[0]) steps.push(`Method note: ${parts[0]}`);
    return steps;
  }
  if (difficulty === "medium") {
    steps.push(...parts.slice(0, 2).map((p) => `Method: ${p}`));
    return steps;
  }
  // easy -> include all provided lines
  steps.push(...parts.map((p) => `Method: ${p}`));
  return steps;
}

// ---- Solvers ----
function solveArithmetic(expr, difficulty) {
  const steps = [];
  steps.push("Recognize arithmetic expression.");
  if (difficulty === "easy") steps.push("Identify operator precedence and parentheses (if any).");
  else if (difficulty === "hard") steps.push("Apply operator precedence; compress obvious simplifications.");
  else steps.push("Apply standard arithmetic rules.");
  let value;
  try {
    value = evalSafe(expr);
  } catch {
    throw new Error("Invalid arithmetic expression.");
  }
  steps.push("Compute value.");
  return { result: String(value), steps };
}
function solveLinear(eq, difficulty) {
  const steps = [];
  steps.push("Recognize linear equation in x.");
  const [L, R] = splitSides(eq);
  const left = parseLinearSide(L);
  const right = parseLinearSide(R);
  steps.push(`Left side: ${fmtLinear(left)} | Right side: ${fmtLinear(right)}`);
  const a = left.a - right.a; // ax terms to left
  const c = right.b - left.b; // constants to right
  steps.push("Move x-terms to the left, constants to the right.");
  steps.push(`Which gives: ${fmtLinear({ a, b: 0 })} = ${c}`);
  if (Math.abs(a) < 1e-12 && Math.abs(c) < 1e-12) {
    steps.push("Both sides simplify to 0 = 0.");
    return { result: "Infinitely many solutions", steps };
  }
  if (Math.abs(a) < 1e-12) {
    steps.push("Coefficient of x is 0 while constant is non-zero.");
    return { result: "No solution", steps };
  }
  const x = c / a;
  if (difficulty === "easy") steps.push("Isolate x by dividing both sides by the coefficient of x.");
  steps.push(`x = ${num(x)}`);
  return { result: `x = ${num(x)}`, steps };
}
function solveQuadratic(eq, difficulty) {
  const steps = [];
  steps.push("Recognize quadratic equation in x.");
  const [L, R] = splitSides(eq);
  const A = parseQuadraticSide(L);
  const B = parseQuadraticSide(R);
  const a = A.a - B.a,
    b = A.b - B.b,
    c = A.c - B.c;
  steps.push(`Bring all terms to one side: ${fmtQuad({ a, b, c })} = 0`);
  if (Math.abs(a) < 1e-12) {
    steps.push("a = 0 ➜ reduces to linear.");
    return solveLinear(`${b}x + ${c} = 0`, difficulty);
  }
  const D = b * b - 4 * a * c;
  steps.push(`Compute discriminant: Δ = b² - 4ac = ${num(b * b)} - 4·${num(a)}·${num(c)} = ${num(D)}`);
  if (D < 0) {
    steps.push("Δ < 0 ➜ No real roots.");
    return { result: "No real solutions", steps };
  } else if (Math.abs(D) < 1e-12) {
    const x = -b / (2 * a);
    steps.push("Δ = 0 ➜ One real root.");
    steps.push(`x = -b / (2a) = ${num(x)}`);
    return { result: `x = ${num(x)}`, steps };
  } else {
    const sqrtD = Math.sqrt(D);
    const x1 = (-b + sqrtD) / (2 * a);
    const x2 = (-b - sqrtD) / (2 * a);
    steps.push("Δ > 0 ➜ Two real roots.");
    steps.push(`x₁ = (-b + √Δ) / (2a) = ${num(x1)}`);
    steps.push(`x₂ = (-b - √Δ) / (2a) = ${num(x2)}`);
    return { result: `x₁ = ${num(x1)}, x₂ = ${num(x2)}`, steps };
  }
}

// ---- Public API Handlers ----
async function solve(req, res) {
  try {
    const body = req.body || {};
    const problem = body.problem && String(body.problem);
    const difficulty = body.difficulty || "medium";
    if (!problem) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Missing problem"));
    }
    const type = detectType(problem);
    if (type === "unknown" || type === "unsupported") {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Unsupported or empty problem."));
    }
    let out;
    if (type === "arithmetic") out = solveArithmetic(problem, difficulty);
    else if (type === "linear") out = solveLinear(problem, difficulty);
    else if (type === "quadratic") out = solveQuadratic(problem, difficulty);
    else return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Unsupported problem type."));

    // Integrate learned methods into steps/visualization
    const methods = store.methods.filter((m) => m.type === type);
    if (methods.length) {
      const featured = methods[0];
      const mSteps = buildMethodSteps(featured, difficulty);
      const insertAt = type === "linear" ? Math.min(out.steps.length, 3) : 1; // after recognition/early context
      out.steps.splice(insertAt, 0, ...mSteps);
    }

    // Build hints: prioritize learned, then one builtin; add advanced note for hard
    const hints = [...learnedHints(type)];
    const base = builtinHints(type);
    if (base[0]) hints.push(base[0]);
    if (difficulty === "hard") hints.push("Advanced note: Ensure numeric stability with very small coefficients.");

    return res.status(HTTP_OK).json({ type, result: out.result, steps: out.steps, hints });
  } catch (e) {
    logDebug("chibi:solve:error", { error: e.message });
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(e.message || "Failed to solve"));
  }
}

async function getHint(req, res) {
  try {
    const url = req.url;
    const problem = decodeURIComponent((url.split("?")[1] || "").split("problem=")[1] || "").split("&")[0];
    const type = detectType(problem);
    const all = [...learnedHints(type), ...builtinHints(type)];
    if (!all.length) return res.status(HTTP_OK).json({ type, hint: "No hints available." });
    const idx = store.hintIndex[type] || 0;
    const hint = all[idx % all.length];
    store.hintIndex[type] = idx + 1;
    return res.status(HTTP_OK).json({ type, hint });
  } catch (e) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Failed to get hint"));
  }
}

async function teachSave(req, res) {
  const body = req.body || {};
  const name = (body.name || "").trim();
  const type = body.type || "arithmetic";
  const desc = (body.desc || "").trim();
  if (!name || !desc) return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Provide name and description."));
  const item = { id: Date.now(), name, type, desc };
  store.methods.push(item);
  return res.status(HTTP_OK).json({ success: true, item });
}
async function teachClear(req, res) {
  store.methods = [];
  return res.status(HTTP_OK).json({ success: true });
}
async function listMethods(req, res) {
  return res.status(HTTP_OK).json({ methods: store.methods });
}

async function checkAnswer(req, res) {
  try {
    const body = req.body || {};
    const problem = body.problem && String(body.problem);
    const userAns = body.userAnswer && String(body.userAnswer);
    if (!problem || userAns === undefined) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Missing problem or userAnswer"));
    }
    const type = detectType(problem);
    if (type === "arithmetic") {
      const correct = evalSafe(problem);
      const ua = Number(userAns);
      if (!isFinite(ua)) return res.status(HTTP_OK).json({ ok: false, msg: "Enter a numeric answer." });
      const ok = Math.abs(ua - correct) < 1e-9;
      return res.status(HTTP_OK).json({ ok, msg: ok ? "Correct!" : `Not quite. Expected ${num(correct)}.` });
    }
    if (type === "linear") {
      const { result } = solveLinear(problem, "medium");
      const m = /x\s*=\s*([-+]?\d*\.?\d+(?:e[-+]?\d+)?)/i.exec(String(userAns).replace(/\s+/g, ""));
      if (!m) return res.status(HTTP_OK).json({ ok: false, msg: "Use format x=number, e.g., x=2." });
      const ua = Number(m[1]);
      const sol = Number((/x\s*=\s*([^,]+)/.exec(result) || [])[1]);
      const ok = Math.abs(ua - sol) < 1e-8;
      return res.status(HTTP_OK).json({ ok, msg: ok ? "Correct!" : `Not quite. Expected ${result}.` });
    }
    if (type === "quadratic") {
      const { result } = solveQuadratic(problem, "medium");
      if (/No real/.test(result))
        return res
          .status(HTTP_OK)
          .json({ ok: /none|no/i.test(userAns) || String(userAns).trim() === "", msg: "No real roots." });
      const parts = String(userAns).replace(/\s+/g, "").split(/[;,]/).filter(Boolean).map(Number);
      if (!parts.length)
        return res.status(HTTP_OK).json({ ok: false, msg: "Provide one or two roots, e.g., x=2,3 or 2,3." });
      const sols = (result.match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/g) || []).map(Number);
      const ok = parts.length === sols.length && parts.every((p) => sols.some((s) => Math.abs(p - s) < 1e-6));
      return res.status(HTTP_OK).json({ ok, msg: ok ? "Correct!" : `Expected ${result}.` });
    }
    return res.status(HTTP_OK).json({ ok: false, msg: "Unsupported problem for checking." });
  } catch (e) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Could not check"));
  }
}

async function sample(req, res) {
  const url = req.url;
  const difficulty =
    decodeURIComponent((url.split("?")[1] || "").split("difficulty=")[1] || "").split("&")[0] || "medium";
  const samples = {
    easy: ["2 + 2", "7 - 3", "3 + 4 * 2", "x + 5 = 11"],
    medium: ["12 / 3 + 2", "3x + 5 = 11", "2x - 7 = 9", "x^2 - 5x + 6 = 0"],
    hard: ["(14 - 2*3) / 4", "5x - 3 = 2x + 12", "2x^2 - 3x - 2 = 0"],
  };
  const arr = samples[difficulty] || samples.medium;
  const problem = arr[Math.floor(Math.random() * arr.length)];
  return res.status(HTTP_OK).json({ problem, type: detectType(problem) });
}

async function detect(req, res) {
  const url = req.url;
  const input = decodeURIComponent((url.split("?")[1] || "").split("input=")[1] || "").split("&")[0] || "";
  return res.status(HTTP_OK).json({ type: detectType(input) });
}

async function info(req, res) {
  // Compose status payload
  const uptimeSec = Math.floor((Date.now() - service.startedAt) / 1000);
  return res.status(HTTP_OK).json({
    name: service.name,
    version: service.version,
    status: "ok",
    uptimeSec,
    methodsCount: store.methods.length,
    capabilities: service.capabilities,
    persistence: service.persistence,
    now: new Date().toISOString(),
  });
}

module.exports = {
  solve,
  getHint,
  teachSave,
  teachClear,
  listMethods,
  checkAnswer,
  sample,
  detect,
  info,
};
