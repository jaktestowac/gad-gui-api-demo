const { request, expect, faker, baseUsersUrl } = require("../config");
const { sleep } = require("./helpers");

async function authUser() {
  const restoreResponse = await request.get("/api/restoreDB");
  expect(restoreResponse.status).to.equal(201);

  const email = "Danial.Dicki@dicki.test";
  const password = "test2";
  const response = await request.post("/api/login").send({
    email,
    password,
  });
  expect(response.status).to.equal(200);

  const token = response.body.access_token;
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  return {
    headers,
  };
}

async function prepareUniqueLoggedUser() {
  const restoreResponse = await request.get("/api/restoreDB");
  expect(restoreResponse.status).to.equal(201);

  const testUserData = {
    email: faker.internet.email({ provider: "example.test.test" }),
    firstname: "string",
    lastname: "string",
    password: "string",
    avatar: "string",
  };
  const response = await request.post(baseUsersUrl).send(testUserData);
  expect(response.status).to.equal(201);
  const userId = response.body.id;

  await sleep(100); // wait for user registration // server is slow

  const responseLogin = await request.post("/api/login").send({
    email: testUserData.email,
    password: testUserData.password,
  });

  expect(responseLogin.status, JSON.stringify(responseLogin.body)).to.equal(200);

  const token = responseLogin.body.access_token;
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  return {
    headers,
    userId,
    testUserData,
  };
}

module.exports = {
  prepareUniqueLoggedUser,
  authUser,
};
