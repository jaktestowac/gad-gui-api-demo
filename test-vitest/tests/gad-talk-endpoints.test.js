import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import serverManager from "./helpers/server-manager.js";

const baseUrl = serverManager.getBaseUrl();

function buildUniqueToken(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

async function resetGadTalkDb() {
  await request(baseUrl).post("/api/gad-talk/admin/reset-db").expect(200);
}

describe("GadTalk endpoint smoke tests", () => {
  beforeAll(async () => {
    await request(baseUrl).get("/api/about").expect(200);
  });

  beforeEach(resetGadTalkDb);

  it("exposes public health information", async () => {
    const response = await request(baseUrl).get("/api/gad-talk/health").expect(200);

    expect(response.body?.ok).toBe(true);
    expect(response.body?.data?.module?.name).toBe("gad-talk");
    expect(response.body?.data?.module?.version).toBeDefined();
    expect(response.body?.data?.initialized).toBe(true);
  });

  it("supports demo login and current-user lookup", async () => {
    const loginRes = await request(baseUrl).post("/api/gad-talk/auth/demo-login").expect(200);

    expect(loginRes.body?.token).toBeDefined();
    expect(loginRes.body?.user?.id).toBeDefined();

    const meRes = await request(baseUrl)
      .get("/api/gad-talk/auth/me")
      .set("Authorization", `Bearer ${loginRes.body.token}`)
      .expect(200);

    expect(meRes.body?.user?.id).toBe(loginRes.body.user.id);
  });

  it("supports password reset flow end-to-end", async () => {
    const forgotRes = await request(baseUrl)
      .post("/api/gad-talk/auth/forgot-password")
      .send({ email: "demo@gadtalk.local" })
      .expect(200);

    const resetToken = new URL(forgotRes.body?.data?.resetUrl, "http://localhost").searchParams.get("token");
    expect(resetToken).toBeDefined();

    const newPassword = `Reset_${buildUniqueToken("pw")}`;
    await request(baseUrl)
      .post("/api/gad-talk/auth/reset-password")
      .send({ token: resetToken, password: newPassword })
      .expect(200);

    const loginRes = await request(baseUrl)
      .post("/api/gad-talk/auth/login")
      .send({ email: "demo@gadtalk.local", password: newPassword })
      .expect(200);

    expect(loginRes.body?.token).toBeDefined();
  });

  it("exposes admin database status and feature flags", async () => {
    const statusRes = await request(baseUrl).get("/api/gad-talk/admin/db-status").expect(200);
    const flagsRes = await request(baseUrl).get("/api/gad-talk/admin/feature-flags").expect(200);

    expect(statusRes.body?.ok).toBe(true);
    expect(statusRes.body?.data).toBeDefined();
    expect(flagsRes.body?.ok).toBe(true);
    expect(flagsRes.body?.data).toBeDefined();
  });

  it("exposes search, explore, hashtags and notifications endpoints", async () => {
    const demoLogin = await request(baseUrl).post("/api/gad-talk/auth/demo-login").expect(200);
    const authHeader = { Authorization: `Bearer ${demoLogin.body.token}` };

    const searchRes = await request(baseUrl).get("/api/gad-talk/search?q=demo").set(authHeader).expect(200);
    const exploreRes = await request(baseUrl).get("/api/gad-talk/explore").set(authHeader).expect(200);
    const hashtagRes = await request(baseUrl).get("/api/gad-talk/hashtags/trending").set(authHeader).expect(200);
    const notificationsRes = await request(baseUrl).get("/api/gad-talk/notifications").set(authHeader).expect(200);

    expect(searchRes.body?.gads || searchRes.body?.users || searchRes.body?.hashtags).toBeDefined();
    expect(exploreRes.body?.trending || exploreRes.body?.suggestedUsers || exploreRes.body?.popularGads).toBeDefined();
    expect(Array.isArray(hashtagRes.body?.hashtags)).toBe(true);
    expect(Array.isArray(notificationsRes.body?.notifications)).toBe(true);
  });

  it("exposes OAuth placeholder endpoint", async () => {
    const response = await request(baseUrl).post("/api/gad-talk/auth/oauth/google").expect(200);

    expect(response.body?.ok).toBe(true);
    expect(response.body?.data?.hint).toBeDefined();
  });
});
