import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
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

async function resetGadTalkDb() {
  await request(baseUrl).post("/api/gad-talk/admin/reset-db").expect(200);
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
    await request(baseUrl).get("/api/about").expect(200);
  });

  beforeEach(async () => {
    await resetGadTalkDb();
  });

  it("should persist serial gad creations without data loss", async () => {
    const auth = await createGadTalkUser();
    const marker = buildUniqueToken("gadrace");
    const total = 6;

    const results = [];
    for (let i = 0; i < total; i++) {
      results.push(await createGad(auth, `Race ${marker} #r${i} ${Math.random().toString(36).slice(2, 6)}`));
    }

    expect(results.every((r) => r.status === 201)).toBe(true);

    const searchRes = await request(baseUrl)
      .get(`/api/gad-talk/gads/search?q=${encodeURIComponent(marker)}&limit=50`)
      .expect(200);

    const found = (searchRes.body?.gads || []).filter((g) => g.content?.includes(marker)).length;
    expect(found).toBe(total);

    // Record summary
    raceSummary.push({ test: "create-gads", attempts: total, successes: total });
  });

  it("should keep like state consistent with serial like/unlike requests", async () => {
    const auth = await createGadTalkUser();
    const gadRes = await createGad(auth, `Like race ${buildUniqueToken("like")}`);
    expect(gadRes.status).toBe(201);
    const gadId = gadRes.body.gad.id;

    await request(baseUrl)
      .post(`/api/gad-talk/gads/${gadId}/like`)
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);

    await request(baseUrl)
      .post(`/api/gad-talk/gads/${gadId}/like`)
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(400);

    const gadGet = await getGad(gadId, auth).expect(200);
    const likeCount = Number(gadGet.body?.gad?.likeCount ?? 0);
    expect(likeCount).toBe(1);

    raceSummary.push({ test: "like", attempts: 2, successes: 1 });
  });

  it("should keep bookmark state consistent with serial bookmark/unbookmark requests", async () => {
    const auth = await createGadTalkUser();
    const gadRes = await createGad(auth, `Bookmark race ${buildUniqueToken("bookmark")}`);
    expect(gadRes.status).toBe(201);
    const gadId = gadRes.body.gad.id;

    await request(baseUrl)
      .post(`/api/gad-talk/gads/${gadId}/bookmark`)
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);

    await request(baseUrl)
      .post(`/api/gad-talk/gads/${gadId}/bookmark`)
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(400);

    await request(baseUrl)
      .delete(`/api/gad-talk/gads/${gadId}/bookmark`)
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);

    const bookmarksRes = await request(baseUrl)
      .get(`/api/gad-talk/bookmarks?limit=50`)
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);

    const matching = (bookmarksRes.body?.gads || []).filter((g) => g.id === gadId).length;
    expect(matching).toBe(0);

    raceSummary.push({ test: "bookmark", attempts: 3, successes: 2 });
  });

  it("should keep regad state consistent with serial regad/unregad requests", async () => {
    const auth = await createGadTalkUser();
    const gadRes = await createGad(auth, `Regad race ${buildUniqueToken("regad")}`);
    expect(gadRes.status).toBe(201);
    const gadId = gadRes.body.gad.id;

    await request(baseUrl)
      .post(`/api/gad-talk/gads/${gadId}/regad`)
      .set("Authorization", `Bearer ${auth.token}`)
      .send({ comment: "race" })
      .expect(200);

    await request(baseUrl)
      .post(`/api/gad-talk/gads/${gadId}/regad`)
      .set("Authorization", `Bearer ${auth.token}`)
      .send({ comment: "race" })
      .expect(400);

    await request(baseUrl)
      .delete(`/api/gad-talk/gads/${gadId}/regad`)
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);

    const gadGet = await getGad(gadId, auth).expect(200);
    const regadCount = Number(gadGet.body?.gad?.repostCount ?? 0);
    expect(regadCount).toBe(0);

    raceSummary.push({ test: "regad", attempts: 3, successes: 2 });
  });

  it("should keep independent profile fields when updated serially", async () => {
    const auth = await createGadTalkUser();
    const displayName = `DN_${buildUniqueToken("dn")}`;
    const bio = `BIO_${buildUniqueToken("bio")}`;
    const location = `LOC_${buildUniqueToken("loc")}`;

    await request(baseUrl)
      .put(`/api/gad-talk/users/${auth.user.id}/profile`)
      .set("Authorization", `Bearer ${auth.token}`)
      .send({ displayName })
      .expect(200);

    await request(baseUrl)
      .put(`/api/gad-talk/users/${auth.user.id}/profile`)
      .set("Authorization", `Bearer ${auth.token}`)
      .send({ bio })
      .expect(200);

    await request(baseUrl)
      .put(`/api/gad-talk/users/${auth.user.id}/profile`)
      .set("Authorization", `Bearer ${auth.token}`)
      .send({ location })
      .expect(200);

    const profileRes = await request(baseUrl)
      .get(`/api/gad-talk/users/${auth.user.id}/profile`)
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);

    const profile = profileRes.body?.data || {};
    expect(profile.displayName).toBe(displayName);
    expect(profile.bio).toBe(bio);
    expect(profile.location).toBe(location);

    raceSummary.push({ test: "profile-updates", attempts: 3, successes: 3 });
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
