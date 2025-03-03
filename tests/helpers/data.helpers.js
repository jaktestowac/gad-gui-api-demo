const {
  request,
  learningBaseUrl,
  expect,
  faker,
  baseUsersUrl,
  baseArticlesUrl,
  baseCommentsUrl,
  sleepTime,
  existingUserEmail,
  existingUserPass,
  existingUserId,
  existingUserEmail2,
  existingUserPass2,
  existingUserId2,
  existingUserId3,
  existingUserEmail3,
  existingUserPass3,
  existingUserId4,
  existingUserEmail4,
  existingUserPass4,
  restoreDbPath,
  existingUserBookShopAdminEmail,
  existingUserBookShopAdminPass,
  existingUserEmail5,
  existingUserPass5,
  existingUserId5,
} = require("../config");
const { sleep, invokeRequestUntil } = require("./helpers");

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

function generateValidUserLoginData() {
  const testData = {
    email: existingUserEmail,
    password: existingUserPass,
  };
  return testData;
}

function generateValidUserLoginData2() {
  const testData = {
    email: existingUserEmail2,
    password: existingUserPass2,
  };
  return testData;
}

function generateValidUserLoginData3() {
  const testData = {
    email: existingUserEmail3,
    password: existingUserPass3,
  };
  return testData;
}

function generateValidUserLoginData4() {
  const testData = {
    email: existingUserEmail4,
    password: existingUserPass4,
  };
  return testData;
}

function generateValidUserLoginData5() {
  const testData = {
    email: existingUserEmail5,
    password: existingUserPass5,
  };
  return testData;
}

function generateValidUserLoginDataBookShopAdmin() {
  const testData = {
    email: existingUserBookShopAdminEmail,
    password: existingUserBookShopAdminPass,
  };
  return testData;
}

function generateValidUserData() {
  const testData = {
    email: faker.internet.email({ provider: "example.test.test" }),
    firstname: faker.person.firstName(),
    lastname: faker.person.lastName(),
    password: faker.internet.password(),
    avatar: "string",
  };
  return testData;
}

function generateLikesBody(user_id, comment_id, article_id) {
  const like = {
    user_id: user_id,
    comment_id: comment_id,
    article_id: article_id,
    date: "2023-09-25T10:00:00Z",
  };
  return like;
}

function generateSurveyBody(user_id, type, answers = []) {
  const surveyBody = {
    user_id: user_id,
    type: type,
    date: "2023-09-25T10:00:00Z",
    answers: answers,
  };
  return surveyBody;
}

function generateValidCommentData() {
  const testData = {
    article_id: 1,
    user_id: 1,
    body: faker.lorem.sentences(),
    date: "2021-11-30T14:44:22Z",
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
  const restoreResponse = await request.get(restoreDbPath);
  expect(restoreResponse.status).to.equal(201);

  const userData = generateValidUserLoginData();
  const userId = existingUserId;
  const response = await request.post("/api/login").send(userData);
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

async function authUser2() {
  const restoreResponse = await request.get(restoreDbPath);
  expect(restoreResponse.status).to.equal(201);

  const userData = generateValidUserLoginData2();
  const userId = existingUserId2;
  const response = await request.post("/api/login").send(userData);
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

async function authUser3() {
  const restoreResponse = await request.get(restoreDbPath);
  expect(restoreResponse.status).to.equal(201);

  const userData = generateValidUserLoginData3();
  const userId = existingUserId3;
  const response = await request.post("/api/login").send(userData);
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

async function authUser4() {
  const restoreResponse = await request.get(restoreDbPath);
  expect(restoreResponse.status).to.equal(201);

  const userData = generateValidUserLoginData4();
  const userId = existingUserId4;
  const response = await request.post("/api/login").send(userData);
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

async function authUser5WithoutBookShopAccount() {
  const restoreResponse = await request.get(restoreDbPath);
  expect(restoreResponse.status).to.equal(201);

  const userData = generateValidUserLoginData5();
  const userId = existingUserId5;
  const response = await request.post("/api/login").send(userData);
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

async function authUserBookShopAdmin() {
  const restoreResponse = await request.get(restoreDbPath);
  expect(restoreResponse.status).to.equal(201);

  const userData = generateValidUserLoginDataBookShopAdmin();
  const userId = existingUserId4;
  const response = await request.post("/api/login").send(userData);
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
  const restoreResponse = await request.get(restoreDbPath);
  expect(restoreResponse.status).to.equal(201);

  const testUserData = {
    email: faker.internet.email({ provider: "example.test.test" }),
    firstname: faker.person.firstName(),
    lastname: faker.person.lastName(),
    password: faker.internet.password(),
    avatar: "string",
  };
  const response = await request.post(baseUsersUrl).send(testUserData);
  expect(response.status).to.equal(201);
  const userId = response.body.id;

  await sleep(sleepTime); // wait for user registration // server is slow

  const responseLogin = await invokeRequestUntil(
    testUserData.email,
    async () => {
      const getResponse = await request.get("/api/users/" + userId).send();
      console.log(`[${testUserData.email}] getResponse: ${JSON.stringify(getResponse.body)}`);
      return await request.post("/api/login").send({
        email: testUserData.email,
        password: testUserData.password,
      });
    },
    (response) => {
      return response.status === 200;
    }
  ).then((response) => {
    expect(response.status, `${JSON.stringify(response.body)} after sending: ${JSON.stringify(testUserData)}`).to.equal(
      200
    );
    return response;
  });

  // const responseLogin = await request.post("/api/login").send({
  //   email: testUserData.email,
  //   password: testUserData.password,
  // });

  // expect(
  //   responseLogin.status,
  //   `${JSON.stringify(responseLogin.body)} after sending: ${JSON.stringify(testUserData)}`
  // ).to.equal(200);

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

async function prepareUniqueArticle(headers, userId) {
  const testData = generateValidArticleData();
  testData.user_id = userId;

  const response = await request.post(baseArticlesUrl).set(headers).send(testData);

  expect(response.status).to.equal(201);
  const articleId = response.body.id;
  testData.id = articleId;

  await sleep(sleepTime); // wait for user registration // server is slow

  return {
    testData,
    articleId,
  };
}

async function prepareUniqueComment(headers, userId, articleId) {
  const testData = generateValidCommentData();
  testData.user_id = userId;
  testData.article_id = articleId;

  const response = await request.post(baseCommentsUrl).set(headers).send(testData);

  expect(response.status, JSON.stringify(response.body)).to.equal(201);
  const commentId = response.body.id;
  testData.id = commentId;

  await sleep(sleepTime); // wait for user registration // server is slow

  return {
    testData,
    commentId,
  };
}

function generateUniqueCardData() {
  const testData = {
    card_number: faker.finance.creditCardNumber({ issuer: "####################" }),
    expiration_date: faker.date.future().toISOString().split("T")[0],
    cvv: 11 + faker.finance.creditCardCVV(),
  };
  return testData;
}

async function authDefaultLearningUser() {
  return authLearningUser("user", "demo");
}

async function authInstructor() {
  return authLearningUser("john_doe", "demo");
}

async function authAdminUser() {
  return authLearningUser("admin", "1234");
}

async function authLearningUser(username, password) {
  const loginResponse = await request.post(`${learningBaseUrl}/auth/login`).send({
    username,
    password,
  });

  if (loginResponse.status !== 200) {
    throw new Error(`Auth failed: ${JSON.stringify(loginResponse.body)}`);
  }

  const token = loginResponse.body.access_token;
  return {
    headers: { authorization: `Bearer ${token}` },
    userId: loginResponse.body.id,
    token,
  };
}

async function registerNewLearningUser() {
  const timestamp = Date.now();
  const userData = {
    username: `test_user_${timestamp}`,
    password: "test123",
    email: `test${timestamp}@test.com`,
    firstName: "Test",
    lastName: "User",
  };

  const response = await request.post(`${learningBaseUrl}/auth/register`).send(userData);

  if (response.status !== 200) {
    throw new Error(`Registration failed: ${JSON.stringify(response.body)}`);
  }

  // Login with new user
  const loginResponse = await request.post(`${learningBaseUrl}/auth/login`).send({
    username: userData.username,
    password: userData.password,
  });

  if (loginResponse.status !== 200) {
    throw new Error(`Login failed: ${JSON.stringify(loginResponse.body)}`);
  }

  return {
    headers: { authorization: `Bearer ${loginResponse.body.access_token}` },
    userId: loginResponse.body.id,
    token: loginResponse.body.access_token,
    username: userData.username,
  };
}

module.exports = {
  authDefaultLearningUser,
  authInstructor,
  authLearningUser,
  registerNewLearningUser,
  authAdminUser,
  prepareUniqueLoggedUser,
  prepareUniqueArticle,
  prepareUniqueComment,
  authUser,
  authUser2,
  authUser3,
  authUser4,
  authUser5WithoutBookShopAccount,
  authUserBookShopAdmin,
  generateValidUserData,
  generateValidArticleData,
  generateValidCommentData,
  validExistingUser,
  validExistingComment,
  validExistingArticle,
  generateValidUserLoginData,
  generateLikesBody,
  generateSurveyBody,
  generateUniqueCardData,
};
