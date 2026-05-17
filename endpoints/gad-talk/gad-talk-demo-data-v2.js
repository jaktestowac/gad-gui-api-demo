// GadTalk Demo Dataset
// Provides read-only seed data for demo sessions
// Keep IDs stable so front-end tests can rely on them.

const now = "2026-01-30T12:00:00.000Z";

function ago(date, months = 0, days = 0, hours = 0, minutes = 0) {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  d.setMinutes(d.getMinutes() - minutes);
  return d.toISOString();
}

function fromNowToFuture(now, months = 0, days = 0, hours = 0, minutes = 0) {
  return ago(now, -months, -days, -hours, -minutes);
}

module.exports = {
  users: [],
  gads: [],
  follows: [],
  likes: [],
  notifications: [],
  blocks: [],
  mutes: [],
  bookmarks: [],
  hashtags: [],
  featureFlags: [],
  outbox: [],
  missions: [],
  missionCompletions: [],
};
