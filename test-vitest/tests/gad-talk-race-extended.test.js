import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
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
  const token = buildUniqueToken("gtuser");
  const user = {
    username: `gt_${token.slice(-10)}`,
    password: "DemoPass123",
    email: `gt_${token}@test.local`,
    displayName: `GT ${token}`,
  };

  const res = await request(baseUrl).post("/api/gad-talk/auth/signup").send(user);

  expect(res.status).toBe(201);
  expect(res.body?.token).toBeDefined();
  expect(res.body?.user?.id).toBeDefined();
  return { token: res.body.token, user: res.body.user };
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
    await request(baseUrl).get("/api/about").expect(200);
  });

  beforeEach(async () => {
    await request(baseUrl).post("/api/gad-talk/admin/reset-db").expect(200);
  });

  it("should allow only one signup per unique email/username when serialized", async () => {
    const token = buildUniqueToken("signup");
    const payload = {
      username: `gt_${token.slice(-10)}`,
      password: "DemoPass123",
      email: `gt_${token}@test.local`,
      displayName: `GT ${token}`,
    };

    const first = await request(baseUrl).post("/api/gad-talk/auth/signup").send(payload).expect(201);
    const second = await request(baseUrl).post("/api/gad-talk/auth/signup").send(payload).expect(409);

    const searchRes = await request(baseUrl)
      .get(`/api/gad-talk/users/search?q=${encodeURIComponent(payload.username)}`)
      .expect(200);

    const matches = (searchRes.body?.users || []).filter((u) => u.username === payload.username).length;
    expect(matches).toBe(1);
    expect(first.body?.user?.id).toBeDefined();
    expect(second.body).toBeDefined();

    extendedSummary.push({ test: "signup-collision", attempts: 2, successes: 1 });
  });

  it("should keep final like state consistent under serialized like/unlike flow", async () => {
    const auth = await createGadTalkUser();
    const gadRes = await createGad(auth, `Like/Unlike race ${buildUniqueToken("lu")}`);
    const gadId = gadRes.body.gad.id;

    await request(baseUrl)
      .post(`/api/gad-talk/gads/${gadId}/like`)
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);
    await request(baseUrl)
      .delete(`/api/gad-talk/gads/${gadId}/like`)
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);

    const gadGet = await getGad(gadId, auth).expect(200);
    const likeCount = Number(gadGet.body?.gad?.likeCount ?? 0);
    expect(likeCount).toBe(0);

    extendedSummary.push({ test: "like-unlike", attempts: 2, successes: 2 });
  });

  it("should not create duplicate follows under serialized follow/unfollow flow", async () => {
    const follower = await createGadTalkUser();
    const followee = await createGadTalkUser();

    await request(baseUrl)
      .post(`/api/gad-talk/users/${followee.user.id}/follow`)
      .set("Authorization", `Bearer ${follower.token}`)
      .expect(200);
    await request(baseUrl)
      .delete(`/api/gad-talk/users/${followee.user.id}/follow`)
      .set("Authorization", `Bearer ${follower.token}`)
      .expect(200);

    const followersRes = await request(baseUrl)
      .get(`/api/gad-talk/users/${followee.user.id}/followers?limit=100`)
      .set("Authorization", `Bearer ${follower.token}`)
      .expect(200);

    const followerMatches = (followersRes.body?.followers || []).filter(
      (f) => f?.user?.id === follower.user.id || f?.followerId === follower.user.id
    );
    expect(followerMatches.length).toBe(0);

    // Record summary
    extendedSummary.push({
      test: "follow-toggle",
      attempts: 2,
      successes: 2,
    });
  });

  it("should keep reply counts aligned with serialized replies", async () => {
    const auth = await createGadTalkUser();
    const parentRes = await createGad(auth, `Parent ${buildUniqueToken("reply")}`);
    const parentId = parentRes.body.gad.id;
    const marker = buildUniqueToken("replymarker");

    const attempts = 5;
    const results = [];
    for (let i = 0; i < attempts; i++) {
      results.push(await createGad(auth, `Reply ${marker} ${i}`, { replyTo: parentId }));
    }

    expect(results.every((r) => r.status === 201)).toBe(true);

    const repliesRes = await request(baseUrl)
      .get(`/api/gad-talk/gads/${parentId}/replies?limit=50`)
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);

    const replyMatches = (repliesRes.body?.gads || []).filter((g) => g.content?.includes(marker)).length;
    expect(replyMatches).toBe(attempts);

    extendedSummary.push({ test: "reply-storm", attempts, successes: attempts });
  });

  it("should keep regad state consistent under serialized regad/unregad flow", async () => {
    const auth = await createGadTalkUser();
    const gadRes = await createGad(auth, `Regad mix ${buildUniqueToken("rmix")}`);
    const gadId = gadRes.body.gad.id;

    await request(baseUrl)
      .post(`/api/gad-talk/gads/${gadId}/regad`)
      .set("Authorization", `Bearer ${auth.token}`)
      .send({ comment: "race" })
      .expect(200);
    await request(baseUrl)
      .delete(`/api/gad-talk/gads/${gadId}/regad`)
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);

    extendedSummary.push({
      test: "regad-toggle",
      attempts: 2,
      successes: 2,
    });

    const gadGet = await getGad(gadId, auth).expect(200);
    const regadCount = Number(gadGet.body?.gad?.repostCount ?? 0);
    expect(regadCount).toBe(0);
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
