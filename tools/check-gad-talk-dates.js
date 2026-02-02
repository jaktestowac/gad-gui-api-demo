/*
Simple data consistency checker for GadTalk demo dataset
Checks:
 - each `gad` has an existing `userId` and gad.createdAt >= user.createdAt
 - each `like` has existing `userId` and `gadId` and like.createdAt >= user.createdAt and >= gad.createdAt
 - reply/quote/repost relationships reference existing gads and have appropriate timestamps
 - editedAt (if present) is not before createdAt

Run with: node scripts/check-gad-dates.js
*/

const path = require("path");
const fs = require("fs");

function toTs(value) {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : null;
}

function loadData(dataPath) {
  let p = dataPath || path.join(__dirname, "..", "endpoints", "gad-talk", "gad-talk-demo-data.js");
  // if a relative path (no ./ or /), resolve from project root
  if (!path.isAbsolute(p) && !p.startsWith(".")) {
    p = path.join(process.cwd(), p);
  }
  // require the JS module (it exports an object)
  delete require.cache[require.resolve(p)];
  return require(p);
}

function runCheckWithData(data) {
  const errors = [];
  const usersById = new Map();
  const gadsById = new Map();

  (data.users || []).forEach((u) => usersById.set(u.id, { raw: u, createdAt: toTs(u.createdAt) }));
  (data.gads || []).forEach((g) => gadsById.set(g.id, { raw: g, createdAt: toTs(g.createdAt) }));

  function pushError(type, details) {
    errors.push({ type, details });
  }

  // Check gads
  let gadChecks = 0;
  (data.gads || []).forEach((gad) => {
    gadChecks++;
    const gadTs = toTs(gad.createdAt);
    const user = usersById.get(gad.userId);
    if (!user) {
      pushError("missing-user", `Gad ${gad.id} references missing userId ${gad.userId}`);
    } else if (user.createdAt && gadTs && gadTs < user.createdAt) {
      pushError(
        "user-after-gad",
        `Gad ${gad.id} (createdAt=${gad.createdAt}) is before its author ${gad.userId} (createdAt=${user.raw.createdAt})`
      );
    }

    // editedAt check
    if (gad.editedAt) {
      const editedTs = toTs(gad.editedAt);
      if (editedTs && gadTs && editedTs < gadTs) {
        pushError(
          "edited-before-created",
          `Gad ${gad.id} editedAt=${gad.editedAt} is before createdAt=${gad.createdAt}`
        );
      }
    }

    // reply/quote/repost checks
    if (gad.replyToId) {
      const parent = gadsById.get(gad.replyToId);
      if (!parent) pushError("missing-reply-target", `Gad ${gad.id} replies to missing gad ${gad.replyToId}`);
      else if (toTs(parent.raw.createdAt) && gadTs && gadTs < toTs(parent.raw.createdAt)) {
        pushError(
          "reply-before-parent",
          `Gad ${gad.id} (createdAt=${gad.createdAt}) replies to ${gad.replyToId} (createdAt=${parent.raw.createdAt}) which is later`
        );
      }
    }
    if (gad.quoteOfId) {
      const quoted = gadsById.get(gad.quoteOfId);
      if (!quoted) pushError("missing-quote-target", `Gad ${gad.id} quotes missing gad ${gad.quoteOfId}`);
      else if (toTs(quoted.raw.createdAt) && gadTs && gadTs < toTs(quoted.raw.createdAt)) {
        pushError(
          "quote-before-original",
          `Gad ${gad.id} (createdAt=${gad.createdAt}) quotes ${gad.quoteOfId} (createdAt=${quoted.raw.createdAt}) which is later`
        );
      }
    }
    if (gad.isRepost && gad.repostOfId) {
      const original = gadsById.get(gad.repostOfId);
      if (!original) pushError("missing-repost-target", `Gad ${gad.id} reposts missing gad ${gad.repostOfId}`);
      else if (toTs(original.raw.createdAt) && gadTs && gadTs < toTs(original.raw.createdAt)) {
        pushError(
          "repost-before-original",
          `Gad ${gad.id} (createdAt=${gad.createdAt}) reposts ${gad.repostOfId} (createdAt=${original.raw.createdAt}) which is later`
        );
      }
    }
  });

  // Check likes
  let likeChecks = 0;
  (data.likes || []).forEach((like) => {
    likeChecks++;
    const likeTs = toTs(like.createdAt);
    const user = usersById.get(like.userId);
    const gad = gadsById.get(like.gadId);
    if (!user) pushError("like-missing-user", `Like ${like.id} references missing user ${like.userId}`);
    else if (user.createdAt && likeTs && likeTs < user.createdAt) {
      pushError(
        "like-before-user-creation",
        `Like ${like.id} (createdAt=${like.createdAt}) by ${like.userId} is before user's creation ${user.raw.createdAt}`
      );
    }
    if (!gad) pushError("like-missing-gad", `Like ${like.id} references missing gad ${like.gadId}`);
    else if (toTs(gad.raw.createdAt) && likeTs && likeTs < toTs(gad.raw.createdAt)) {
      pushError(
        "like-before-gad",
        `Like ${like.id} (createdAt=${like.createdAt}) is before gad ${like.gadId} (createdAt=${gad.raw.createdAt})`
      );
    }
  });

  // Check notifications (basic)
  let notifChecks = 0;
  (data.notifications || []).forEach((n) => {
    notifChecks++;
    const actor = usersById.get(n.actorId);
    if (n.actorId && !actor) pushError("notif-missing-actor", `Notification ${n.id} actor ${n.actorId} missing`);
    if (n.userId && !usersById.get(n.userId))
      pushError("notif-missing-target-user", `Notification ${n.id} target user ${n.userId} missing`);
  });

  return {
    gadChecks: (data.gads || []).length,
    likeChecks: (data.likes || []).length,
    notifChecks: (data.notifications || []).length,
    errors,
  };
}

function runCheck(dataPath) {
  const data = loadData(dataPath);
  return runCheckWithData(data);
}

if (require.main === module) {
  const file = process.argv[2];
  const res = runCheck(file);

  console.log("\nData consistency check - GadTalk demo dataset");
  console.log("------------------------------------------------");
  console.log(`Gads checked: ${res.gadChecks}`);
  console.log(`Likes checked: ${res.likeChecks}`);
  console.log(`Notifications checked: ${res.notifChecks}`);
  console.log(`Total errors: ${res.errors.length}\n`);

  if (res.errors.length > 0) {
    res.errors.forEach((e, i) => console.log(`${i + 1}) [${e.type}] ${e.details}`));
    process.exitCode = 2;
  } else {
    console.log("✅ No date-order or reference errors found.");
  }
}

module.exports = { runCheck };
