import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import serverManager from "./helpers/server-manager.js";

const baseUrl = serverManager.getBaseUrl();

// Collect per-test concurrency summary
const raceSummary = [];

function buildUniqueToken(prefix) {
  const salt = Math.floor(Math.random() * 100000);
  return `${prefix}_${Date.now()}_${salt}`;
}

async function createGadTalkUser() {
  const maxAttempts = 5;
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
      expect(res.body?.token).toBeDefined();
      expect(res.body?.user?.id).toBeDefined();
      return { token: res.body.token, user: res.body.user };
    }

    // Retry on uniqueness/validation collisions in no-reset environments
    if ([400, 409, 422].includes(res.status)) {
      await new Promise((r) => setTimeout(r, 50));
      continue;
    }

    throw new Error(`unexpected status ${res.status} during signup`);
  }

  throw new Error("Failed to create unique GadTalk user after multiple attempts");
}

async function createGad(auth, content) {
  const res = await request(baseUrl)
    .post("/api/gad-talk/gads")
    .set("Authorization", `Bearer ${auth.token}`)
    .send({ content });

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

describe("GadTalk race & concurrency probes", () => {
  beforeAll(async () => {
    if (!serverManager.isServerReady()) {
      await serverManager.startServer(60000);
    }
  });

  it("should persist all concurrent gad creations (no data loss)", async () => {
    const auth = await createGadTalkUser();
    const marker = buildUniqueToken("gadrace");
    const total = 16;

    const results = await Promise.all(
      Array.from({ length: total }, (_, i) =>
        createGad(auth, `Race ${marker} #r${i} ${Math.random().toString(36).slice(2, 6)}`)
      )
    );

    const successCount = results.filter((r) => r.status === 201).length;
    expect(successCount).toBeGreaterThan(0);
    expect(results.every((r) => r.status < 500)).toBe(true);

    const searchRes = await request(baseUrl)
      .get(`/api/gad-talk/gads/search?q=${encodeURIComponent(marker)}&limit=50`)
      .expect(200);

    const found = (searchRes.body?.gads || []).filter((g) => g.content?.includes(marker)).length;
    expect(found).toBe(successCount);

    // Record summary
    raceSummary.push({ test: "create-gads", attempts: total, successes: successCount });
  });

  it("should allow at most one like per user when requested concurrently", async () => {
    const auth = await createGadTalkUser();
    const gadRes = await createGad(auth, `Like race ${buildUniqueToken("like")}`);
    expect(gadRes.status).toBe(201);
    const gadId = gadRes.body.gad.id;

    const attempts = 16;
    const likeResults = await Promise.all(
      Array.from({ length: attempts }, () =>
        request(baseUrl).post(`/api/gad-talk/gads/${gadId}/like`).set("Authorization", `Bearer ${auth.token}`)
      )
    );

    expect(likeResults.every((r) => r.status < 500)).toBe(true);
    const successCount = likeResults.filter((r) => r.status === 200).length;
    expect(successCount).toBeLessThanOrEqual(1);

    const gadGet = await getGad(gadId, auth).expect(200);
    const likeCount = Number(gadGet.body?.gad?.likeCount ?? 0);
    const expectedLikes = successCount > 0 ? 1 : 0;
    expect(likeCount).toBe(expectedLikes);

    raceSummary.push({ test: "like", attempts, successes: successCount });
  });

  it("should allow at most one bookmark per user when requested concurrently", async () => {
    const auth = await createGadTalkUser();
    const gadRes = await createGad(auth, `Bookmark race ${buildUniqueToken("bookmark")}`);
    expect(gadRes.status).toBe(201);
    const gadId = gadRes.body.gad.id;

    const attempts = 16;
    const bmResults = await Promise.all(
      Array.from({ length: attempts }, () =>
        request(baseUrl).post(`/api/gad-talk/gads/${gadId}/bookmark`).set("Authorization", `Bearer ${auth.token}`)
      )
    );

    expect(bmResults.every((r) => r.status < 500)).toBe(true);
    const successCount = bmResults.filter((r) => r.status === 200).length;
    expect(successCount).toBeLessThanOrEqual(1);

    const bookmarksRes = await request(baseUrl)
      .get(`/api/gad-talk/bookmarks?limit=50`)
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);

    const matching = (bookmarksRes.body?.gads || []).filter((g) => g.id === gadId).length;
    const expected = successCount > 0 ? 1 : 0;
    expect(matching).toBe(expected);

    raceSummary.push({ test: "bookmark", attempts, successes: successCount });
  });

  it("should allow at most one regad per user when requested concurrently", async () => {
    const auth = await createGadTalkUser();
    const gadRes = await createGad(auth, `Regad race ${buildUniqueToken("regad")}`);
    expect(gadRes.status).toBe(201);
    const gadId = gadRes.body.gad.id;

    const attempts = 16;
    const regadResults = await Promise.all(
      Array.from({ length: attempts }, () =>
        request(baseUrl)
          .post(`/api/gad-talk/gads/${gadId}/regad`)
          .set("Authorization", `Bearer ${auth.token}`)
          .send({ comment: "race" })
      )
    );

    expect(regadResults.every((r) => r.status < 500)).toBe(true);
    const successCount = regadResults.filter((r) => r.status === 200).length;
    expect(successCount).toBeLessThanOrEqual(1);

    const gadGet = await getGad(gadId, auth).expect(200);
    const regadCount = Number(gadGet.body?.gad?.repostCount ?? 0);
    const expected = successCount > 0 ? 1 : 0;
    expect(regadCount).toBe(expected);

    raceSummary.push({ test: "regad", attempts, successes: successCount });
  });

  it("should keep independent profile fields when updated concurrently", async () => {
    const auth = await createGadTalkUser();
    const displayName = `DN_${buildUniqueToken("dn")}`;
    const bio = `BIO_${buildUniqueToken("bio")}`;
    const location = `LOC_${buildUniqueToken("loc")}`;

    const [r1, r2, r3] = await Promise.all([
      request(baseUrl)
        .put(`/api/gad-talk/users/${auth.user.id}/profile`)
        .set("Authorization", `Bearer ${auth.token}`)
        .send({ displayName }),
      request(baseUrl)
        .put(`/api/gad-talk/users/${auth.user.id}/profile`)
        .set("Authorization", `Bearer ${auth.token}`)
        .send({ bio }),
      request(baseUrl)
        .put(`/api/gad-talk/users/${auth.user.id}/profile`)
        .set("Authorization", `Bearer ${auth.token}`)
        .send({ location }),
    ]);

    expect([r1.status, r2.status, r3.status].every((s) => s < 500)).toBe(true);
    // At least one update should have succeeded
    expect([r1.status, r2.status, r3.status].some((s) => s === 200)).toBe(true);

    const profileRes = await request(baseUrl)
      .get(`/api/gad-talk/users/${auth.user.id}/profile`)
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);

    const profile = profileRes.body?.data || {};
    if (r1.status === 200) expect(profile.displayName).toBe(displayName);
    if (r2.status === 200) expect(profile.bio).toBe(bio);
    if (r3.status === 200) expect(profile.location).toBe(location);

    const profileSuccess = [r1, r2, r3].filter((r) => r.status === 200).length;
    raceSummary.push({ test: "profile-updates", attempts: 3, successes: profileSuccess });
  });
});

// Small summary logged after the suite runs
/* eslint-disable no-console */
afterAll(() => {
  console.log("GadTalk race tests completed. Summary:");
  for (const s of raceSummary) {
    console.log(`- ${s.test}: attempts=${s.attempts}, successes=${s.successes}`);
  }
});
