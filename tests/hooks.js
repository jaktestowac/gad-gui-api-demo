/* eslint-disable no-console */

const { request, expect, clearDbAfter, clearDbBefore } = require("./config");

exports.mochaHooks = {
  async beforeAll() {
    if (clearDbBefore) {
      console.log("Restoring DB after all tests");
      const response = await request.get("/restoreDB");
      expect(response.statusCode).to.be.equal(201, `Assert failed on: ${JSON.stringify(response.body)}`);
    }
  },
  async afterAll() {
    if (clearDbAfter) {
      console.log("Restoring DB after all tests");
      const response = await request.get("/restoreDB");
      expect(response.statusCode).to.be.equal(201, `Assert failed on: ${JSON.stringify(response.body)}`);
    }
  },
};
