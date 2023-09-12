const { request, expect, faker, baseUsersUrl } = require("../config");
const { sleep } = require("./helpers");

const validExistingUser = {
  avatar: ".\\data\\users\\face_1591133479.7144732.jpg",
  email: "****",
  firstname: "Moses",
  id: 1,
  lastname: "****",
  password: "****",
};

const validExistingArticle = {
  id: 1,
  title: "How to write effective test cases",
  body: "Test cases are the backbone of any testing process. They define what to test, how to test, and what to expect. Writing effective test cases can save time, effort, and resources. Here are some tips for writing effective test cases:\n- Use clear and concise language\n- Follow a consistent format and structure\n- Include preconditions, steps, expected results, and postconditions\n- Cover positive, negative, and boundary scenarios\n- Prioritize test cases based on risk and importance\n- Review and update test cases regularly",
  user_id: 1,
  date: "2021-07-13T16:35:00Z",
  image: ".\\data\\images\\256\\chuttersnap-9cCeS9Sg6nU-unsplash.jpg",
};

const validExistingComment = {
  id: 1,
  article_id: 1,
  user_id: 3,
  body: "I loved your insights on usability testing. It's crucial to ensure that the software meets the needs of the end users. Have you encountered any interesting user feedback during usability testing that led to significant improvements in the product?",
  date: "2021-11-30T14:44:22Z",
};

function generateValidUserData() {
  const testData = {
    email: faker.internet.email({ provider: "example.test.test" }),
    firstname: "string",
    lastname: "string",
    password: "string",
    avatar: "string",
  };
  return testData;
}

function generateValidArticleData(titleLength, bodyLength) {
  const testData = {
    title: faker.lorem.sentence(),
    body: "Test cases are the backbone of any testing process. They define what to test, how to test, and what to expect. Writing effective test cases can save time, effort, and resources. Here are some tips for writing effective test cases:\n- Use clear and concise language\n- Follow a consistent format and structure\n- Include preconditions, steps, expected results, and postconditions\n- Cover positive, negative, and boundary scenarios\n- Prioritize test cases based on risk and importance\n- Review and update test cases regularly",
    user_id: 1,
    date: "2021-07-13T16:35:00Z",
    image: ".\\data\\images\\256\\chuttersnap-9cCeS9Sg6nU-unsplash.jpg",
  };

  if (titleLength !== undefined) {
    testData.title = faker.string.alphanumeric(titleLength);
  }
  if (bodyLength !== undefined) {
    testData.body = faker.string.alphanumeric(bodyLength);
  }
  return testData;
}

async function authUser() {
  const restoreResponse = await request.get("/api/restoreDB");
  expect(restoreResponse.status).to.equal(201);

  const email = "Danial.Dicki@dicki.test";
  const password = "test2";
  const userId = 2;
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
    userId,
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

  await sleep(200); // wait for user registration // server is slow

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
  generateValidUserData,
  generateValidArticleData,
  validExistingUser,
  validExistingComment,
  validExistingArticle,
};
