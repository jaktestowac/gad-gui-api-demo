const { generateUuid } = require("../../helpers/helpers");
const { logTrace, logDebug, logError } = require("../../helpers/logger-api");
const { areIdsEqual } = require("../../helpers/compare.helpers");

// In-memory storage
const users = new Map();
const challenges = new Map();
const progress = new Map();
const tokens = new Map();

// Initialize some sample challenges
challenges.set("62d12148-2878-40f0-9657-5038e95450b1", {
  id: "62d12148-2878-40f0-9657-5038e95450b1",
  title: "First Challenge",
  description: "Complete your first challenge",
  difficulty: "easy",
});

challenges.set("b1b1b1b1-2878-40f0-9657-5038e95450b1", {
  id: "b1b1b1b1-2878-40f0-9657-5038e95450b1",
  title: "Second Challenge",
  description: "Complete your second challenge",
  difficulty: "medium",
});

function getUserByEmail(email) {
  return Array.from(users.values()).find((user) => user.email === email);
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function createUser(email, password) {
  const id = generateUuid();
  const passwordHash = hashString(password);
  const user = {
    id,
    email,
    password_hash: passwordHash,
    created_at: new Date().toISOString(),
  };
  users.set(id, user);
  return user;
}

function createUserToken(email) {
  const token = generateUuid();
  const user = getUserByEmail(email);
  if (!user) return null;

  const tokenData = {
    token,
    userId: user.id,
    email,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  tokens.set(token, tokenData);
  return tokenData;
}

function getUserByToken(token) {
  const tokenData = tokens.get(token);
  if (!tokenData) return null;

  // Check if token is expired
  if (new Date(tokenData.expires_at) < new Date()) {
    tokens.delete(token);
    return null;
  }

  return users.get(tokenData.userId);
}

function removeToken(token) {
  return tokens.delete(token);
}

function authUser(email, password) {
  const user = getUserByEmail(email);
  logDebug("[Challenges] isUserAuth", { email, password, user });

  if (user && hashString(password) === user.password_hash) {
    const tokenData = createUserToken(email);
    return tokenData ? tokenData.token : null;
  }
  return null;
}

function getAllChallenges() {
  return Array.from(challenges.values());
}

function getChallengeById(id) {
  return challenges.get(id);
}

function submitChallenge(userId, challengeId) {
  const progressId = generateUuid();
  const now = new Date().toISOString();

  const progressEntry = {
    id: progressId,
    user_id: userId,
    challenge_id: challengeId,
    status: "completed",
    started_at: now,
    completed_at: now,
  };

  progress.set(progressId, progressEntry);
  return progressEntry;
}

function getUserProgress(userId) {
  return Array.from(progress.values()).filter((p) => areIdsEqual(p.user_id, userId));
}

module.exports = {
  getUserByEmail,
  createUser,
  getAllChallenges,
  getChallengeById,
  submitChallenge,
  getUserProgress,
  authUser,
  getUserByToken,
  removeToken,
  createUserToken,
};
