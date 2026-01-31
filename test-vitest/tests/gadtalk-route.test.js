import { describe, it, expect } from "vitest";
import request from "supertest";
import serverManager from "./helpers/server-manager.js";

const baseUrl = serverManager.getBaseUrl();

describe("GadTalk routing", () => {
  it("should serve profile page for /gad-talk/@username", async () => {
    const response = await request(baseUrl).get("/gad-talk/@demo").expect(200);

    expect(response.headers).toBeDefined();
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.text).toMatch(/GadTalk|profile|gt-profile/i);
  });
});
