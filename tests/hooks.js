/* eslint-disable no-console */

const { request, expect } = require("./config");

exports.mochaHooks = {
  async afterAll() {
    console.log("Restoring DB after all tests");
    const response = await request.get("/restoreDB");
    expect(response.statusCode).to.be.equal(201, `Assert failed on: ${JSON.stringify(response.body)}`);
  },
};
