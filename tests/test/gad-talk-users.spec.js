const { request, expect } = require("../config.js");

describe("GadTalk Users - username availability", () => {
  it("GET /api/gad-talk/users/available/demo - should return available: false for existing username", async () => {
    const res = await request.get(`/api/gad-talk/users/available/demo`).expect(200);
    expect(res.body).to.have.property("available");
    expect(res.body.available).to.equal(false);
  });

  it("GET /api/gad-talk/users/available/:username - should return available: true for a new username", async () => {
    const uname = `testuser${Date.now().toString().slice(-6)}`;
    const res = await request.get(`/api/gad-talk/users/available/${uname}`).expect(200);
    expect(res.body).to.have.property("available");
    expect(res.body.available).to.equal(true);
  });

  it("GET /api/gad-talk/users/available/:username - invalid username format should return 422", async () => {
    const res = await request.get(`/api/gad-talk/users/available/in!valid`).expect(422);
    expect(res.body).to.have.property("error");
  });

  it("POST /api/gad-talk/auth/signup - should fail with 409 for existing username", async () => {
    const res = await request
      .post(`/api/gad-talk/auth/signup`)
      .send({ email: `duplicate-${Date.now()}@test.local`, username: "demo", password: "demopw" })
      .expect(409);
    expect(res.body).to.have.property("error");
  });
});
