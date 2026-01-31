const { expect, request } = require("../config");
const { gracefulQuit, setupEnv } = require("../helpers/helpers");

describe("Admin backend pages", async () => {
  before(async () => {
    await setupEnv();
  });

  after(async () => {
    gracefulQuit();
  });

  it("GET /api/gad-talk/admin/backend returns backend page", async () => {
    const response = await request.get(`/api/gad-talk/admin/backend`);
    expect(response.status).to.equal(200);
    expect(response.text).to.contain("GadTalk Backend");
  });

  it("GET /api/gad-talk/admin/swagger returns placeholder page", async () => {
    const response = await request.get(`/api/gad-talk/admin/swagger`);
    expect(response.status).to.equal(200);
    expect(response.text).to.contain("Swagger UI");
  });

  it("GET /api/gad-talk/admin/features-description returns placeholder page", async () => {
    const response = await request.get(`/api/gad-talk/admin/features-description`);
    expect(response.status).to.equal(200);
    expect(response.text).to.contain("Features Description");
  });
});
