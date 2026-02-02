/*
Fixer for GadTalk demo dataset dates.
 - Leaves user.createdAt unchanged
 - Moves gad.createdAt forward if it's before its author's createdAt or before referenced parent/quoted/original gads
 - Moves like.createdAt forward if it's before its user's createdAt or before the gad's createdAt
 - Ensures editedAt >= createdAt

Produces a new data file: endpoints/gad-talk/gad-talk-demo-data.fixed.js
Run: node scripts/fix-gad-dates.js
*/

const fs = require("fs");
const path = require("path");

const srcPath = path.join(__dirname, "..", "endpoints", "gad-talk", "gad-talk-demo-data.js");
const outPath = path.join(__dirname, "..", "endpoints", "gad-talk", "gad-talk-demo-data.fixed.js");
const original = require(srcPath);

function toTs(v) {
  if (!v) return null;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : null;
}

function iso(ts) {
  return new Date(ts).toISOString();
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

const data = clone(original);
const usersById = new Map();
const gadsById = new Map();

(data.users || []).forEach((u) => usersById.set(u.id, { raw: u, createdAt: toTs(u.createdAt) }));
(data.gads || []).forEach((g) => gadsById.set(g.id, { raw: g, createdAt: toTs(g.createdAt) }));

function validate(d) {
  const errs = [];
  const uById = new Map();
  const gById = new Map();
  (d.users || []).forEach((u) => uById.set(u.id, toTs(u.createdAt)));
  (d.gads || []).forEach((g) => gById.set(g.id, toTs(g.createdAt)));

  (d.gads || []).forEach((gad) => {
    const gadTs = toTs(gad.createdAt);
    const userTs = uById.get(gad.userId);
    if (!userTs) errs.push({ type: "missing-user", details: `Gad ${gad.id} missing user ${gad.userId}` });
    else if (userTs && gadTs && gadTs < userTs)
      errs.push({
        type: "user-after-gad",
        details: `Gad ${gad.id} (${gad.createdAt}) before user ${gad.userId} (${new Date(userTs).toISOString()})`,
      });

    if (gad.editedAt) {
      const edited = toTs(gad.editedAt);
      if (edited && gadTs && edited < gadTs)
        errs.push({
          type: "edited-before-created",
          details: `Gad ${gad.id} editedAt ${gad.editedAt} < createdAt ${gad.createdAt}`,
        });
    }

    if (gad.replyToId) {
      const parentTs = gById.get(gad.replyToId);
      if (!parentTs)
        errs.push({ type: "missing-reply-target", details: `Gad ${gad.id} replies to missing ${gad.replyToId}` });
      else if (gadTs && parentTs && gadTs < parentTs)
        errs.push({
          type: "reply-before-parent",
          details: `Gad ${gad.id} (${gad.createdAt}) replies to ${gad.replyToId} (${iso(parentTs)})`,
        });
    }
    if (gad.quoteOfId) {
      const quotedTs = gById.get(gad.quoteOfId);
      if (!quotedTs)
        errs.push({ type: "missing-quote-target", details: `Gad ${gad.id} quotes missing ${gad.quoteOfId}` });
      else if (gadTs && quotedTs && gadTs < quotedTs)
        errs.push({
          type: "quote-before-original",
          details: `Gad ${gad.id} (${gad.createdAt}) quotes ${gad.quoteOfId} (${iso(quotedTs)})`,
        });
    }
    if (gad.isRepost && gad.repostOfId) {
      const origTs = gById.get(gad.repostOfId);
      if (!origTs)
        errs.push({ type: "missing-repost-target", details: `Gad ${gad.id} reposts missing ${gad.repostOfId}` });
      else if (gadTs && origTs && gadTs < origTs)
        errs.push({
          type: "repost-before-original",
          details: `Gad ${gad.id} (${gad.createdAt}) reposts ${gad.repostOfId} (${iso(origTs)})`,
        });
    }
  });

  (d.likes || []).forEach((like) => {
    const likeTs = toTs(like.createdAt);
    const userTs = uById.get(like.userId);
    const gadTs = gById.get(like.gadId);
    if (!userTs) errs.push({ type: "like-missing-user", details: `Like ${like.id} missing user ${like.userId}` });
    else if (userTs && likeTs && likeTs < userTs)
      errs.push({
        type: "like-before-user-creation",
        details: `Like ${like.id} (${like.createdAt}) by ${like.userId} before creation ${iso(userTs)}`,
      });
    if (!gadTs) errs.push({ type: "like-missing-gad", details: `Like ${like.id} missing gad ${like.gadId}` });
    else if (gadTs && likeTs && likeTs < gadTs)
      errs.push({
        type: "like-before-gad",
        details: `Like ${like.id} (${like.createdAt}) before gad ${like.gadId} (${iso(gadTs)})`,
      });
  });

  return errs;
}

// Collect current errors
const before = validate(data);
console.log(`Found ${before.length} issues before fixes.`);

const fixes = [];

// Fix gads dates relative to user and parent items
const gadMap = new Map((data.gads || []).map((g) => [g.id, g]));
const userMap = new Map((data.users || []).map((u) => [u.id, u]));

// Helper to ensure gad timestamp >= minTs. Will bump to minTs+1s if needed.
function ensureGadAtLeast(gad, minTs, reason) {
  const gadTs = toTs(gad.createdAt) || 0;
  const target = Math.max(minTs + 1000, gadTs);
  if (target !== gadTs) {
    fixes.push({ id: gad.id, field: "createdAt", from: gad.createdAt, to: iso(target), reason });
    gad.createdAt = iso(target);
  }
}

// First ensure user -> gad
(data.gads || []).forEach((gad) => {
  const user = userMap.get(gad.userId);
  if (user) {
    const userTs = toTs(user.createdAt) || 0;
    ensureGadAtLeast(gad, userTs, `author ${gad.userId} createdAt`);
  }
});

// Then ensure reply/quote/repost orderings
(data.gads || []).forEach((gad) => {
  const gadTs = toTs(gad.createdAt) || 0;
  if (gad.replyToId) {
    const parent = gadMap.get(gad.replyToId);
    if (parent) {
      const parentTs = toTs(parent.createdAt) || 0;
      ensureGadAtLeast(gad, parentTs, `reply parent ${gad.replyToId}`);
    }
  }
  if (gad.quoteOfId) {
    const quoted = gadMap.get(gad.quoteOfId);
    if (quoted) {
      const qTs = toTs(quoted.createdAt) || 0;
      ensureGadAtLeast(gad, qTs, `quoted ${gad.quoteOfId}`);
    }
  }
  if (gad.isRepost && gad.repostOfId) {
    const orig = gadMap.get(gad.repostOfId);
    if (orig) {
      const oTs = toTs(orig.createdAt) || 0;
      ensureGadAtLeast(gad, oTs, `repost original ${gad.repostOfId}`);
    }
  }

  // editedAt fix
  if (gad.editedAt) {
    const ed = toTs(gad.editedAt) || 0;
    const gTs = toTs(gad.createdAt) || 0;
    if (ed < gTs) {
      fixes.push({
        id: gad.id,
        field: "editedAt",
        from: gad.editedAt,
        to: gad.createdAt,
        reason: "edited before created",
      });
      gad.editedAt = gad.createdAt;
    }
  }
});

// Fix likes
(data.likes || []).forEach((like) => {
  const user = userMap.get(like.userId);
  const gad = gadMap.get(like.gadId);
  const likeTs = toTs(like.createdAt) || 0;
  const userTs = user ? toTs(user.createdAt) || 0 : 0;
  const gadTs = gad ? toTs(gad.createdAt) || 0 : 0;
  const needTs = Math.max(userTs, gadTs);
  if (likeTs < needTs) {
    const newTs = needTs + 1000;
    fixes.push({
      id: like.id,
      field: "createdAt",
      from: like.createdAt,
      to: iso(newTs),
      reason: `max(user ${like.userId}, gad ${like.gadId})`,
    });
    like.createdAt = iso(newTs);
  }
});

// Re-validate
const after = validate(data);
console.log(`Found ${after.length} issues after fixes.`);

if (after.length === 0) {
  // write fixed file
  const header = `// Auto-generated fixed demo data (dates adjusted to maintain consistency)\n// Original file: ${path.relative(
    process.cwd(),
    srcPath
  )}\n// NOTE: user.createdAt values were NOT modified.\n\n`;
  const content = header + "module.exports = " + JSON.stringify(data, null, 2) + "\n";
  fs.writeFileSync(outPath, content, "utf8");
  console.log(`Written fixed dataset to ${outPath}`);
  console.log(`Applied fixes: ${fixes.length}`);
  fixes.slice(0, 100).forEach((f) => console.log(`- ${f.id} ${f.field}: ${f.from} -> ${f.to} (${f.reason})`));
} else {
  console.error("Unable to fix all issues automatically. Remaining errors:");
  after.forEach((e, i) => console.error(`${i + 1}) [${e.type}] ${e.details}`));
  process.exitCode = 2;
}
