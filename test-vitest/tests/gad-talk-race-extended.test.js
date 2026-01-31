import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import serverManager from "./helpers/server-manager.js";

const baseUrl = serverManager.getBaseUrl();

// Collect per-test concurrency summary
const extendedSummary = [];

function buildUniqueToken(prefix) {
  const salt = Math.floor(Math.random() * 100000);
  return `${prefix}_${Date.now()}_${salt}`;
}

async function createGadTalkUser() {
  const maxAttempts = 15;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const token = buildUniqueToken("gtuser");
    const user = {
      username: `gt_${token.slice(-10)}`,
      password: "DemoPass123",
      email: `gt_${token}@test.local`,
      displayName: `GT ${token}`,
    };

    const res = await request(baseUrl).post("/api/gad-talk/auth/signup").send(user);

    if (res.status === 201) {
      return { token: res.body.token, user: res.body.user };
    }

    if ([400, 409, 422].includes(res.status)) {
      await new Promise((r) => setTimeout(r, 50));
      continue;
    }

    throw new Error(`unexpected status ${res.status} during signup`);
  }

  throw new Error("Failed to create unique GadTalk user after multiple attempts");
}

async function createGad(auth, content, extra = {}) {
  const res = await request(baseUrl)
    .post("/api/gad-talk/gads")
    .set("Authorization", `Bearer ${auth.token}`)
    .send({ content, ...extra });

  expect(res.status).toBe(201);
  expect(res.body?.gad?.id).toBeDefined();
  return res;
}

function getGad(gadId, auth) {
  const req = request(baseUrl).get(`/api/gad-talk/gads/${gadId}`);
  if (auth?.token) {
    req.set("Authorization", `Bearer ${auth.token}`);
  }
  return req;
}

describe("GadTalk extended concurrency probes", () => {
  beforeAll(async () => {
    if (!serverManager.isServerReady()) {
      await serverManager.startServer(60000);
    }
  });

  it("should allow only one signup per unique email/username under concurrency", async () => {
    const token = buildUniqueToken("signup");
    const payload = {
      username: `gt_${token.slice(-10)}`,
      password: "DemoPass123",
      email: `gt_${token}@test.local`,
      displayName: `GT ${token}`,
    };

    const attempts = 16;
    const results = await Promise.all(
      Array.from({ length: attempts }, () => request(baseUrl).post("/api/gad-talk/auth/signup").send(payload))
    );

    const successCount = results.filter((r) => r.status === 201).length;
    expect(successCount).toBeLessThanOrEqual(1);
    expect(results.every((r) => r.status < 500)).toBe(true);

    const searchRes = await request(baseUrl)
      .get(`/api/gad-talk/users/search?q=${encodeURIComponent(payload.username)}`)
      .expect(200);

    const matches = (searchRes.body?.users || []).filter((u) => u.username === payload.username).length;
    expect(matches).toBeLessThanOrEqual(1);

    extendedSummary.push({ test: "signup-collision", attempts, successes: successCount });
  });

  it("should keep final like state consistent under like/unlike races", async () => {
    const auth = await createGadTalkUser();
    const gadRes = await createGad(auth, `Like/Unlike race ${buildUniqueToken("lu")}`);
    const gadId = gadRes.body.gad.id;

    const operations = [
      () => request(baseUrl).post(`/api/gad-talk/gads/${gadId}/like`).set("Authorization", `Bearer ${auth.token}`),
      () => request(baseUrl).delete(`/api/gad-talk/gads/${gadId}/like`).set("Authorization", `Bearer ${auth.token}`),
    ];

    const attempts = 20;
    const results = await Promise.all(Array.from({ length: attempts }, (_, i) => operations[i % operations.length]()));

    expect(results.every((r) => r.status < 500)).toBe(true);

    const successOps = results.filter((r) => r.status >= 200 && r.status < 400).length;
    extendedSummary.push({ test: "like-unlike", attempts, successes: successOps });

    const gadGet = await getGad(gadId, auth).expect(200);
    const likeCount = Number(gadGet.body?.gad?.likeCount ?? 0);
    expect([0, 1]).toContain(likeCount);
  });

  it("should not create duplicate follows under concurrent follow/unfollow", async () => {
    const follower = await createGadTalkUser();
    const followee = await createGadTalkUser();

    const actions = [
      () =>
        request(baseUrl)
          .post(`/api/gad-talk/users/${followee.user.id}/follow`)
          .set("Authorization", `Bearer ${follower.token}`),
      () =>
        request(baseUrl)
          .delete(`/api/gad-talk/users/${followee.user.id}/follow`)
          .set("Authorization", `Bearer ${follower.token}`),
    ];

    const results = await Promise.all(Array.from({ length: 8 }, (_, i) => actions[i % actions.length]()));

    expect(results.every((r) => r.status < 500)).toBe(true);

    const followersRes = await request(baseUrl)
      .get(`/api/gad-talk/users/${followee.user.id}/followers?limit=100`)
      .set("Authorization", `Bearer ${follower.token}`)
      .expect(200);

    const followerMatches = (followersRes.body?.followers || []).filter(
      (f) => f?.user?.id === follower.user.id || f?.followerId === follower.user.id
    );
    expect(followerMatches.length).toBeLessThanOrEqual(1);

    // Record summary
    extendedSummary.push({
      test: "follow-toggle",
      attempts: results.length,
      successes: results.filter((r) => r.status >= 200 && r.status < 400).length,
    });
  });

  it("should keep reply counts aligned with successful concurrent replies", async () => {
    const auth = await createGadTalkUser();
    const parentRes = await createGad(auth, `Parent ${buildUniqueToken("reply")}`);
    const parentId = parentRes.body.gad.id;
    const marker = buildUniqueToken("replymarker");

    const attempts = 15;
    const results = await Promise.all(
      Array.from({ length: attempts }, (_, i) => createGad(auth, `Reply ${marker} ${i}`, { replyTo: parentId }))
    );

    const successCount = results.filter((r) => r.status === 201).length;
    expect(successCount).toBe(attempts);

    const repliesRes = await request(baseUrl)
      .get(`/api/gad-talk/gads/${parentId}/replies?limit=50`)
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);

    const replyMatches = (repliesRes.body?.gads || []).filter((g) => g.content?.includes(marker)).length;
    expect(replyMatches).toBe(successCount);

    extendedSummary.push({ test: "reply-storm", attempts, successes: successCount });
  });

  it("should keep regad state consistent under regad/unregad races", async () => {
    const auth = await createGadTalkUser();
    const gadRes = await createGad(auth, `Regad mix ${buildUniqueToken("rmix")}`);
    const gadId = gadRes.body.gad.id;

    const operations = [
      () =>
        request(baseUrl)
          .post(`/api/gad-talk/gads/${gadId}/regad`)
          .set("Authorization", `Bearer ${auth.token}`)
          .send({ comment: "race" }),
      () => request(baseUrl).delete(`/api/gad-talk/gads/${gadId}/regad`).set("Authorization", `Bearer ${auth.token}`),
    ];

    const results = await Promise.all(Array.from({ length: 8 }, (_, i) => operations[i % operations.length]()));

    expect(results.every((r) => r.status < 500)).toBe(true);

    extendedSummary.push({
      test: "regad-toggle",
      attempts: results.length,
      successes: results.filter((r) => r.status >= 200 && r.status < 400).length,
    });

    const gadGet = await getGad(gadId, auth).expect(200);
    const regadCount = Number(gadGet.body?.gad?.repostCount ?? 0);
    expect([0, 1]).toContain(regadCount);
  });
});

// Small summary logged after the extended suite runs
/* eslint-disable no-console */
afterAll(() => {
  console.log("GadTalk extended race tests completed. Summary:");
  for (const s of extendedSummary) {
    console.log(`- ${s.test}: attempts=${s.attempts}, successes=${s.successes}`);
  }
});
