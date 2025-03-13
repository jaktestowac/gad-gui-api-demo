/* eslint-disable no-console */

const { request, expect, clearDbAfter, clearDbBefore, restoreDbPath, restoreLearningDbPath } = require("./config");

exports.mochaHooks = {
  async beforeAll() {
    if (clearDbBefore) {
      console.log(">>> Restoring DB after all tests");
      const response = await request.get(restoreDbPath);
      expect(response.statusCode).to.be.equal(201, `Assert failed on: ${JSON.stringify(response.body)}`);
      const response2 = await request.get(restoreLearningDbPath);
      expect(response2.statusCode).to.be.equal(200, `Assert failed on: ${JSON.stringify(response2.body)}`);
    }
  },
  async afterAll() {
    if (clearDbAfter) {
      console.log(">>> Restoring DB after all tests");
      const response = await request.get(restoreDbPath);
      expect(response.statusCode).to.be.equal(201, `Assert failed on: ${JSON.stringify(response.body)}`);
    }

    setTimeout(async () => {
      console.log(">>> Exiting the server after all tests");
      await request.get("/api/debug/exit");
    }, 1000);
  },
};
