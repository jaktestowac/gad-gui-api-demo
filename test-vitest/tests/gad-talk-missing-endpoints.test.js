import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import serverManager from "./helpers/server-manager.js";

const baseUrl = serverManager.getBaseUrl();

function buildUniqueToken(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function bearer(token) {
  return { Authorization: `Bearer ${token}` };
}

async function resetGadTalkDb() {
  await request(baseUrl).post("/api/gad-talk/admin/reset-db").expect(200);
}

async function signupUser(prefix) {
  const token = buildUniqueToken(prefix);
  const payload = {
    username: `gt_${token.slice(-10)}`,
    password: "DemoPass123",
    email: `gt_${token}@test.local`,
    displayName: `GT ${token}`,
  };

  const res = await request(baseUrl).post("/api/gad-talk/auth/signup").send(payload).expect(201);
  expect(res.body?.token).toBeDefined();
  expect(res.body?.user?.id).toBeDefined();
  return { token: res.body.token, user: res.body.user };
}

async function demoLogin() {
  const res = await request(baseUrl).post("/api/gad-talk/auth/demo-login").expect(200);
  expect(res.body?.token).toBeDefined();
  expect(res.body?.user?.id).toBeDefined();
  return res;
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

async function createFeedScenario() {
  const author = await signupUser("author");
  const follower = await signupUser("follower");
  const gad = await createGad(author, `Follow me ${buildUniqueToken("feed")}`);
  return { author, follower, gad };
}

async function createContentScenario() {
  const creator = await signupUser("creator");
  const peer = await signupUser("peer");

  const creatorGad = await createGad(creator, `Creator gad ${buildUniqueToken("g1")}`);
  const replyGad = await createGad(creator, `Creator reply ${buildUniqueToken("r1")}`, {
    replyTo: creatorGad.body.gad.id,
  });
  const peerGad = await createGad(peer, `Peer gad ${buildUniqueToken("g2")}`);

  return { creator, peer, creatorGad, replyGad, peerGad };
}

async function createAnalyticsScenario() {
  const analyst = await signupUser("analyst");
  const peer = await signupUser("analytics-peer");

  const firstGad = await createGad(analyst, `Analytics target #insight ${buildUniqueToken("an")}`);
  const secondGad = await createGad(analyst, `Follow-up #insight ${buildUniqueToken("an2")}`);

  await request(baseUrl).post(`/api/gad-talk/users/${analyst.user.id}/follow`).set(bearer(peer.token)).expect(200);
  await request(baseUrl).post(`/api/gad-talk/gads/${firstGad.body.gad.id}/like`).set(bearer(peer.token)).expect(200);
  await createGad(peer, `Replying to analyst ${buildUniqueToken("reply")}`, { replyTo: firstGad.body.gad.id });

  return { analyst, peer, firstGad, secondGad };
}

describe("GadTalk missing endpoint coverage", () => {
  beforeAll(async () => {
    await request(baseUrl).get("/api/about").expect(200);
  });

  beforeEach(resetGadTalkDb);

  const authCases = [
    {
      title: "supports auth refresh endpoint",
      run: async () => {
        const loginRes = await demoLogin();
        const originalToken = loginRes.body.token;

        const refreshRes = await request(baseUrl)
          .post("/api/gad-talk/auth/refresh")
          .set("Authorization", `Bearer ${originalToken}`)
          .expect(200);

        expect(refreshRes.body?.data?.token).toBeDefined();
        const meRes = await request(baseUrl)
          .get("/api/gad-talk/auth/me")
          .set("Authorization", `Bearer ${refreshRes.body.data.token}`)
          .expect(200);
        expect(meRes.body?.user?.id).toBe(loginRes.body.user.id);
      },
    },
    {
      title: "supports auth logout endpoint",
      run: async () => {
        const loginRes = await demoLogin();
        const cookie = loginRes.headers["set-cookie"]?.[0]?.split(";")[0];

        const logoutRes = await request(baseUrl)
          .post("/api/gad-talk/auth/logout")
          .set("Cookie", cookie || "")
          .expect(200);

        expect(logoutRes.body?.ok).toBe(true);
        expect(logoutRes.body?.data?.message).toMatch(/logged out/i);
      },
    },
  ];

  const userCases = [
    {
      title: "returns user by id",
      run: async () => {
        const author = await signupUser("userid");
        const res = await request(baseUrl).get(`/api/gad-talk/users/${author.user.id}`).expect(200);
        expect(res.body?.data?.username).toBe(author.user.username);
      },
    },
    {
      title: "returns user by username",
      run: async () => {
        const author = await signupUser("username");
        const res = await request(baseUrl)
          .get(`/api/gad-talk/users/username/${author.user.username}`)
          .set(bearer(author.token))
          .expect(200);

        expect(res.body?.data?.username).toBe(author.user.username);
        expect(res.body?.data?.isOwnProfile).toBe(true);
      },
    },
    {
      title: "returns user profile with stats and badges",
      run: async () => {
        const author = await signupUser("profile");
        const res = await request(baseUrl)
          .get(`/api/gad-talk/users/${author.user.id}/profile`)
          .set(bearer(author.token))
          .expect(200);

        expect(res.body?.data?.stats).toBeDefined();
        expect(Array.isArray(res.body?.data?.badges)).toBe(true);
      },
    },
    {
      title: "lists the avatar gallery",
      run: async () => {
        const res = await request(baseUrl).get("/api/gad-talk/users/gallery").expect(200);
        expect(Array.isArray(res.body?.files)).toBe(true);
      },
    },
    {
      title: "uploads avatar placeholder",
      run: async () => {
        const author = await signupUser("avatar");
        const res = await request(baseUrl)
          .post(`/api/gad-talk/users/${author.user.id}/avatar`)
          .set(bearer(author.token))
          .expect(200);

        expect(res.body?.data?.avatarUrl).toMatch(/\.jpg$/);
      },
    },
    {
      title: "uploads header placeholder",
      run: async () => {
        const author = await signupUser("header");
        const res = await request(baseUrl)
          .post(`/api/gad-talk/users/${author.user.id}/header`)
          .set(bearer(author.token))
          .expect(200);

        expect(res.body?.data?.headerUrl).toMatch(/\.jpg$/);
      },
    },
    {
      title: "searches users",
      run: async () => {
        const author = await signupUser("searchuser-a");
        await signupUser("searchuser-b");
        const res = await request(baseUrl)
          .get("/api/gad-talk/users/search?q=gt&limit=5")
          .set(bearer(author.token))
          .expect(200);

        expect(Array.isArray(res.body?.users)).toBe(true);
      },
    },
    {
      title: "returns user suggestions",
      run: async () => {
        const auth = await demoLogin();
        const res = await request(baseUrl)
          .get("/api/gad-talk/users/suggestions?limit=5&includeStats=true")
          .set(bearer(auth.body.token))
          .expect(200);

        expect(Array.isArray(res.body?.users)).toBe(true);
        expect(res.body?.users?.length).toBeGreaterThan(0);
      },
    },
    {
      title: "returns user recommendations",
      run: async () => {
        const auth = await demoLogin();
        const res = await request(baseUrl)
          .get("/api/gad-talk/users/recommendations?limit=5")
          .set(bearer(auth.body.token))
          .expect(200);

        expect(Array.isArray(res.body?.users)).toBe(true);
      },
    },
  ];

  const networkCases = [
    {
      title: "follows a user",
      run: async () => {
        const { author, follower } = await createFeedScenario();
        await request(baseUrl)
          .post(`/api/gad-talk/users/${author.user.id}/follow`)
          .set(bearer(follower.token))
          .expect(200);
      },
    },
    {
      title: "lists followers",
      run: async () => {
        const { author, follower } = await createFeedScenario();
        await request(baseUrl)
          .post(`/api/gad-talk/users/${author.user.id}/follow`)
          .set(bearer(follower.token))
          .expect(200);

        const res = await request(baseUrl)
          .get(`/api/gad-talk/users/${author.user.id}/followers?limit=20`)
          .set(bearer(follower.token))
          .expect(200);

        expect((res.body?.followers || []).some((entry) => entry?.user?.id === follower.user.id)).toBe(true);
      },
    },
    {
      title: "lists following",
      run: async () => {
        const { author, follower } = await createFeedScenario();
        await request(baseUrl)
          .post(`/api/gad-talk/users/${author.user.id}/follow`)
          .set(bearer(follower.token))
          .expect(200);

        const res = await request(baseUrl)
          .get(`/api/gad-talk/users/${follower.user.id}/following?limit=20`)
          .set(bearer(follower.token))
          .expect(200);

        expect((res.body?.following || []).some((entry) => entry?.user?.id === author.user.id)).toBe(true);
      },
    },
    {
      title: "returns user stats",
      run: async () => {
        const { author, follower } = await createFeedScenario();
        await request(baseUrl)
          .post(`/api/gad-talk/users/${author.user.id}/follow`)
          .set(bearer(follower.token))
          .expect(200);
        const res = await request(baseUrl).get(`/api/gad-talk/users/${author.user.id}/stats`).expect(200);
        expect(res.body?.data?.followersCount).toBe(1);
        expect(res.body?.data?.gadsCount).toBe(1);
      },
    },
    {
      title: "shows timeline feed",
      run: async () => {
        const { author, follower, gad } = await createFeedScenario();
        await request(baseUrl)
          .post(`/api/gad-talk/users/${author.user.id}/follow`)
          .set(bearer(follower.token))
          .expect(200);
        const res = await request(baseUrl)
          .get("/api/gad-talk/gads/timeline?limit=10")
          .set(bearer(follower.token))
          .expect(200);
        expect((res.body?.gads || []).some((item) => item.id === gad.body.gad.id)).toBe(true);
      },
    },
    {
      title: "shows for-you feed",
      run: async () => {
        const { follower } = await createFeedScenario();
        const res = await request(baseUrl)
          .get("/api/gad-talk/gads/foryou?limit=10")
          .set(bearer(follower.token))
          .expect(200);
        expect(Array.isArray(res.body?.gads)).toBe(true);
        expect(res.body?.gads.length).toBeGreaterThan(0);
      },
    },
    {
      title: "lists notifications",
      run: async () => {
        const { author, follower, gad } = await createFeedScenario();
        await request(baseUrl)
          .post(`/api/gad-talk/gads/${gad.body.gad.id}/like`)
          .set(bearer(follower.token))
          .expect(200);
        const res = await request(baseUrl).get("/api/gad-talk/notifications").set(bearer(author.token)).expect(200);
        expect(Array.isArray(res.body?.notifications)).toBe(true);
        expect(res.body?.notifications.length).toBe(1);
      },
    },
    {
      title: "returns unread notification count",
      run: async () => {
        const { author, follower, gad } = await createFeedScenario();
        await request(baseUrl)
          .post(`/api/gad-talk/gads/${gad.body.gad.id}/like`)
          .set(bearer(follower.token))
          .expect(200);
        const res = await request(baseUrl)
          .get("/api/gad-talk/notifications/unread/count")
          .set(bearer(author.token))
          .expect(200);
        expect(res.body?.count).toBe(1);
      },
    },
    {
      title: "marks a notification read",
      run: async () => {
        const { author, follower, gad } = await createFeedScenario();
        await request(baseUrl)
          .post(`/api/gad-talk/gads/${gad.body.gad.id}/like`)
          .set(bearer(follower.token))
          .expect(200);
        const notificationsRes = await request(baseUrl)
          .get("/api/gad-talk/notifications")
          .set(bearer(author.token))
          .expect(200);
        const notificationId = notificationsRes.body.notifications[0].id;
        await request(baseUrl)
          .post(`/api/gad-talk/notifications/${notificationId}/read`)
          .set(bearer(author.token))
          .expect(200);
        const unreadRes = await request(baseUrl)
          .get("/api/gad-talk/notifications/unread/count")
          .set(bearer(author.token))
          .expect(200);
        expect(unreadRes.body?.count).toBe(0);
      },
    },
    {
      title: "marks all notifications read",
      run: async () => {
        const { author, follower, gad } = await createFeedScenario();
        await request(baseUrl)
          .post(`/api/gad-talk/gads/${gad.body.gad.id}/like`)
          .set(bearer(follower.token))
          .expect(200);
        await request(baseUrl).post("/api/gad-talk/notifications/read-all").set(bearer(author.token)).expect(200);
      },
    },
    {
      title: "unfollows a user",
      run: async () => {
        const { author, follower } = await createFeedScenario();
        await request(baseUrl)
          .post(`/api/gad-talk/users/${author.user.id}/follow`)
          .set(bearer(follower.token))
          .expect(200);
        await request(baseUrl)
          .delete(`/api/gad-talk/users/${author.user.id}/follow`)
          .set(bearer(follower.token))
          .expect(200);
      },
    },
    {
      title: "blocks and unblocks a user",
      run: async () => {
        const { author, follower } = await createFeedScenario();
        await request(baseUrl)
          .post(`/api/gad-talk/users/${author.user.id}/block`)
          .set(bearer(follower.token))
          .expect(200);
        await request(baseUrl)
          .delete(`/api/gad-talk/users/${author.user.id}/block`)
          .set(bearer(follower.token))
          .expect(200);
      },
    },
    {
      title: "mutes and unmutes a user",
      run: async () => {
        const { author, follower } = await createFeedScenario();
        await request(baseUrl)
          .post(`/api/gad-talk/users/${author.user.id}/mute`)
          .set(bearer(follower.token))
          .expect(200);
        await request(baseUrl)
          .delete(`/api/gad-talk/users/${author.user.id}/mute`)
          .set(bearer(follower.token))
          .expect(200);
      },
    },
  ];

  const searchCases = [
    {
      title: "returns search suggestions",
      run: async () => {
        const auth = await demoLogin();
        const res = await request(baseUrl)
          .get("/api/gad-talk/search/suggestions?q=demo&limit=5")
          .set(bearer(auth.body.token))
          .expect(200);
        expect(Array.isArray(res.body?.suggestions)).toBe(true);
        expect(res.body?.query).toBe("demo");
      },
    },
    {
      title: "searches users from the combined search endpoint",
      run: async () => {
        const auth = await demoLogin();
        const res = await request(baseUrl)
          .get("/api/gad-talk/search?q=demo&type=users&limit=5")
          .set(bearer(auth.body.token))
          .expect(200);
        expect(res.body?.type).toBe("users");
        expect(Array.isArray(res.body?.users)).toBe(true);
      },
    },
    {
      title: "searches gads from the combined search endpoint",
      run: async () => {
        const auth = await demoLogin();
        const res = await request(baseUrl)
          .get("/api/gad-talk/search?q=demo&type=gads&limit=5")
          .set(bearer(auth.body.token))
          .expect(200);
        expect(res.body?.type).toBe("gads");
        expect(Array.isArray(res.body?.gads)).toBe(true);
      },
    },
    {
      title: "searches hashtags from the combined search endpoint",
      run: async () => {
        const auth = await demoLogin();
        const res = await request(baseUrl)
          .get("/api/gad-talk/search?q=testing&type=hashtags&limit=5")
          .set(bearer(auth.body.token))
          .expect(200);
        expect(res.body?.type).toBe("hashtags");
        expect(Array.isArray(res.body?.hashtags)).toBe(true);
      },
    },
    {
      title: "returns explore topics",
      run: async () => {
        const res = await request(baseUrl).get("/api/gad-talk/explore/topics?limit=3").expect(200);
        expect(Array.isArray(res.body?.topics)).toBe(true);
      },
    },
    {
      title: "returns explore popular gads",
      run: async () => {
        const res = await request(baseUrl).get("/api/gad-talk/explore/popular?limit=3&window=day").expect(200);
        expect(Array.isArray(res.body?.gads)).toBe(true);
      },
    },
  ];

  const gadCases = [
    {
      title: "updates a gad",
      run: async () => {
        const author = await signupUser("editor");
        const originalContent = `Original ${buildUniqueToken("orig")}`;
        const updatedContent = `Updated ${buildUniqueToken("upd")}`;
        const createRes = await createGad(author, originalContent);
        const gadId = createRes.body.gad.id;

        const updateRes = await request(baseUrl)
          .put(`/api/gad-talk/gads/${gadId}`)
          .set(bearer(author.token))
          .send({ content: updatedContent })
          .expect(200);

        expect(updateRes.body?.gad?.content).toBe(updatedContent);
      },
    },
    {
      title: "returns an updated gad",
      run: async () => {
        const author = await signupUser("editor-read");
        const createRes = await createGad(author, `Original ${buildUniqueToken("orig")}`);
        const gadId = createRes.body.gad.id;
        await request(baseUrl)
          .put(`/api/gad-talk/gads/${gadId}`)
          .set(bearer(author.token))
          .send({ content: "Updated content" })
          .expect(200);

        const getRes = await request(baseUrl).get(`/api/gad-talk/gads/${gadId}`).set(bearer(author.token)).expect(200);
        expect(getRes.body?.gad?.content).toBe("Updated content");
      },
    },
    {
      title: "deletes a gad",
      run: async () => {
        const author = await signupUser("deleter");
        const createRes = await createGad(author, `Delete me ${buildUniqueToken("del")}`);
        await request(baseUrl)
          .delete(`/api/gad-talk/gads/${createRes.body.gad.id}`)
          .set(bearer(author.token))
          .expect(200);
      },
    },
    {
      title: "marks a gad as deleted after delete",
      run: async () => {
        const author = await signupUser("deleted-view");
        const createRes = await createGad(author, `Delete me ${buildUniqueToken("delv")}`);
        const gadId = createRes.body.gad.id;
        await request(baseUrl).delete(`/api/gad-talk/gads/${gadId}`).set(bearer(author.token)).expect(200);

        const deletedRes = await request(baseUrl)
          .get(`/api/gad-talk/gads/${gadId}`)
          .set(bearer(author.token))
          .expect(200);
        expect(deletedRes.body?.gad?.id).toBe(gadId);
        expect(deletedRes.body?.gad?.deleted).toBe(true);
      },
    },
    {
      title: "lists authored gads",
      run: async () => {
        const { creator, creatorGad } = await createContentScenario();
        const res = await request(baseUrl)
          .get(`/api/gad-talk/users/${creator.user.id}/gads?limit=20`)
          .set(bearer(creator.token))
          .expect(200);
        expect((res.body?.gads || []).some((gad) => gad.id === creatorGad.body.gad.id)).toBe(true);
      },
    },
    {
      title: "lists authored replies",
      run: async () => {
        const { creator, replyGad } = await createContentScenario();
        const res = await request(baseUrl)
          .get(`/api/gad-talk/users/${creator.user.id}/replies?limit=20`)
          .set(bearer(creator.token))
          .expect(200);
        expect((res.body?.gads || []).some((gad) => gad.id === replyGad.body.gad.id)).toBe(true);
      },
    },
    {
      title: "lists authored likes",
      run: async () => {
        const { creator, peerGad } = await createContentScenario();
        await request(baseUrl)
          .post(`/api/gad-talk/gads/${peerGad.body.gad.id}/like`)
          .set(bearer(creator.token))
          .expect(200);
        const res = await request(baseUrl)
          .get(`/api/gad-talk/users/${creator.user.id}/likes?limit=20`)
          .set(bearer(creator.token))
          .expect(200);
        expect((res.body?.gads || []).some((gad) => gad.id === peerGad.body.gad.id)).toBe(true);
      },
    },
    {
      title: "bookmarks a gad and lists bookmarks",
      run: async () => {
        const { creator, creatorGad } = await createContentScenario();
        await request(baseUrl)
          .post(`/api/gad-talk/gads/${creatorGad.body.gad.id}/bookmark`)
          .set(bearer(creator.token))
          .expect(200);
        const res = await request(baseUrl)
          .get("/api/gad-talk/bookmarks?limit=20")
          .set(bearer(creator.token))
          .expect(200);
        expect((res.body?.gads || []).some((gad) => gad.id === creatorGad.body.gad.id)).toBe(true);
      },
    },
    {
      title: "returns who liked a gad",
      run: async () => {
        const { creator, peerGad } = await createContentScenario();
        await request(baseUrl)
          .post(`/api/gad-talk/gads/${peerGad.body.gad.id}/like`)
          .set(bearer(creator.token))
          .expect(200);
        const res = await request(baseUrl)
          .get(`/api/gad-talk/gads/${peerGad.body.gad.id}/likes?limit=10`)
          .set(bearer(creator.token))
          .expect(200);
        expect((res.body?.users || []).some((user) => user.id === creator.user.id)).toBe(true);
      },
    },
    {
      title: "returns who regadded a gad",
      run: async () => {
        const { creator, peer, creatorGad } = await createContentScenario();
        await request(baseUrl)
          .post(`/api/gad-talk/gads/${creatorGad.body.gad.id}/regad`)
          .set(bearer(peer.token))
          .expect(200);
        const res = await request(baseUrl)
          .get(`/api/gad-talk/gads/${creatorGad.body.gad.id}/regads?limit=10`)
          .set(bearer(creator.token))
          .expect(200);
        expect((res.body?.users || []).some((user) => user.id === peer.user.id)).toBe(true);
      },
    },
    {
      title: "returns replies to a gad",
      run: async () => {
        const { creator, replyGad, creatorGad } = await createContentScenario();
        const res = await request(baseUrl)
          .get(`/api/gad-talk/gads/${creatorGad.body.gad.id}/replies?limit=10`)
          .set(bearer(creator.token))
          .expect(200);
        expect((res.body?.gads || []).some((gad) => gad.id === replyGad.body.gad.id)).toBe(true);
      },
    },
    {
      title: "searches gads directly",
      run: async () => {
        const { creator } = await createContentScenario();
        const res = await request(baseUrl)
          .get("/api/gad-talk/gads/search?q=creator&limit=10")
          .set(bearer(creator.token))
          .expect(200);
        expect(res.body?.query).toBe("creator");
        expect(Array.isArray(res.body?.gads)).toBe(true);
      },
    },
    {
      title: "returns popular gads",
      run: async () => {
        const { creator } = await createContentScenario();
        const res = await request(baseUrl)
          .get("/api/gad-talk/gads/popular?limit=10")
          .set(bearer(creator.token))
          .expect(200);
        expect(Array.isArray(res.body?.gads)).toBe(true);
      },
    },
    {
      title: "returns gads for a hashtag",
      run: async () => {
        const { creator } = await createContentScenario();
        const res = await request(baseUrl)
          .get("/api/gad-talk/hashtags/creator?limit=10")
          .set(bearer(creator.token))
          .expect(200);
        expect(res.body?.hashtag).toBe("creator");
        expect(Array.isArray(res.body?.gads)).toBe(true);
      },
    },
    {
      title: "blocks a user",
      run: async () => {
        const { creator, peer } = await createContentScenario();
        await request(baseUrl).post(`/api/gad-talk/users/${peer.user.id}/block`).set(bearer(creator.token)).expect(200);
      },
    },
    {
      title: "unblocks a user",
      run: async () => {
        const { creator, peer } = await createContentScenario();
        await request(baseUrl).post(`/api/gad-talk/users/${peer.user.id}/block`).set(bearer(creator.token)).expect(200);
        await request(baseUrl)
          .delete(`/api/gad-talk/users/${peer.user.id}/block`)
          .set(bearer(creator.token))
          .expect(200);
      },
    },
    {
      title: "mutes a user",
      run: async () => {
        const { creator, peer } = await createContentScenario();
        await request(baseUrl).post(`/api/gad-talk/users/${peer.user.id}/mute`).set(bearer(creator.token)).expect(200);
      },
    },
    {
      title: "unmutes a user",
      run: async () => {
        const { creator, peer } = await createContentScenario();
        await request(baseUrl).post(`/api/gad-talk/users/${peer.user.id}/mute`).set(bearer(creator.token)).expect(200);
        await request(baseUrl)
          .delete(`/api/gad-talk/users/${peer.user.id}/mute`)
          .set(bearer(creator.token))
          .expect(200);
      },
    },
  ];

  const analyticsCases = [
    {
      title: "returns activity heatmap",
      run: async () => {
        const { analyst } = await createAnalyticsScenario();
        const res = await request(baseUrl)
          .get(`/api/gad-talk/analytics/user/${analyst.user.id}/activity-heatmap?days=14`)
          .set(bearer(analyst.token))
          .expect(200);
        expect(res.body?.userId).toBe(analyst.user.id);
        expect(Array.isArray(res.body?.heatmap?.data)).toBe(true);
      },
    },
    {
      title: "returns engagement timeline",
      run: async () => {
        const { analyst } = await createAnalyticsScenario();
        const res = await request(baseUrl)
          .get(`/api/gad-talk/analytics/user/${analyst.user.id}/engagement-timeline?days=30`)
          .set(bearer(analyst.token))
          .expect(200);
        expect(res.body?.userId).toBe(analyst.user.id);
        expect(Array.isArray(res.body?.timeline?.labels)).toBe(true);
      },
    },
    {
      title: "returns follower growth",
      run: async () => {
        const { analyst } = await createAnalyticsScenario();
        const res = await request(baseUrl)
          .get(`/api/gad-talk/analytics/user/${analyst.user.id}/follower-growth?weeks=4`)
          .set(bearer(analyst.token))
          .expect(200);
        expect(res.body?.userId).toBe(analyst.user.id);
        expect(Array.isArray(res.body?.growth?.counts)).toBe(true);
      },
    },
    {
      title: "returns hashtag distribution",
      run: async () => {
        const { analyst } = await createAnalyticsScenario();
        const res = await request(baseUrl)
          .get(`/api/gad-talk/analytics/user/${analyst.user.id}/hashtag-distribution?limit=3`)
          .set(bearer(analyst.token))
          .expect(200);
        expect(res.body?.userId).toBe(analyst.user.id);
        expect(Array.isArray(res.body?.hashtags?.hashtags)).toBe(true);
      },
    },
  ];

  const adminCases = [
    {
      title: "submits the contact form",
      run: async () => {
        const contactIp = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;
        const res = await request(baseUrl)
          .post("/api/gad-talk/contact")
          .set("x-forwarded-for", contactIp)
          .send({
            name: "Gad Tester",
            email: `tester-${buildUniqueToken("contact")}@example.com`,
            subject: "Coverage request",
            message: "Please log this contact request.",
            source: "gad-talk-tests",
          })
          .expect(200);

        expect(res.body?.ok).toBe(true);
        expect(res.body?.data?.message).toMatch(/logged|received/i);
      },
    },
    {
      title: "returns admin logs for contact submissions",
      run: async () => {
        const contactIp = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;
        await request(baseUrl)
          .post("/api/gad-talk/contact")
          .set("x-forwarded-for", contactIp)
          .send({
            name: "Gad Tester",
            email: `tester-${buildUniqueToken("logs")}@example.com`,
            subject: "Coverage request",
            message: "Please log this contact request.",
            source: "gad-talk-tests",
          })
          .expect(200);

        const res = await request(baseUrl)
          .get("/api/gad-talk/admin/logs?eventType=contact.form_submitted&limit=10")
          .expect(200);
        expect(Array.isArray(res.body?.data)).toBe(true);
        expect(res.body?.data?.[0]?.eventType).toBe("contact.form_submitted");
      },
    },
    {
      title: "returns admin metrics",
      run: async () => {
        const res = await request(baseUrl).get("/api/gad-talk/admin/metrics").expect(200);
        expect(res.body?.data?.database).toBeDefined();
        expect(res.body?.data?.websocket).toBeDefined();
      },
    },
    {
      title: "returns feature flags",
      run: async () => {
        const res = await request(baseUrl).get("/api/gad-talk/admin/feature-flags").expect(200);
        expect(Array.isArray(res.body?.data)).toBe(true);
        expect(res.body?.data.some((flag) => flag.key === "charts")).toBe(true);
      },
    },
    {
      title: "seeds demo data",
      run: async () => {
        const res = await request(baseUrl).post("/api/gad-talk/admin/seed-demo-data").expect(200);
        expect(res.body?.data?.message).toMatch(/reset with demo data/i);
      },
    },
    {
      title: "initializes databases",
      run: async () => {
        const res = await request(baseUrl).post("/api/gad-talk/admin/init-db").expect(200);
        expect(res.body?.data?.message).toMatch(/initialized/i);
      },
    },
    {
      title: "restores the default database",
      run: async () => {
        const res = await request(baseUrl)
          .post("/api/gad-talk/admin/restore-db")
          .send({ dataset: "default" })
          .expect(200);
        expect(res.body?.data?.message).toMatch(/restored/i);
      },
    },
    {
      title: "returns chaos status",
      run: async () => {
        const res = await request(baseUrl).get("/api/gad-talk/admin/chaos/status").expect(200);
        expect(res.body?.data?.message).toMatch(/chaos mode/i);
      },
    },
    {
      title: "returns chaos config",
      run: async () => {
        const res = await request(baseUrl).get("/api/gad-talk/admin/chaos/config").expect(200);
        expect(res.body?.data?.features).toBeDefined();
      },
    },
    {
      title: "returns chaos presets",
      run: async () => {
        const res = await request(baseUrl).get("/api/gad-talk/admin/chaos/presets").expect(200);
        expect(res.body?.data?.presets?.mild).toBeDefined();
      },
    },
  ];

  authCases.forEach(({ title, run }) => it(title, run));
  userCases.forEach(({ title, run }) => it(title, run));
  networkCases.forEach(({ title, run }) => it(title, run));
  searchCases.forEach(({ title, run }) => it(title, run));
  gadCases.forEach(({ title, run }) => it(title, run));
  analyticsCases.forEach(({ title, run }) => it(title, run));
  adminCases.forEach(({ title, run }) => it(title, run));
});
