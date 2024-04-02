const {
  request,
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
} = require("../config");
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
  const restoreResponse = await request.get("/api/restoreDB");
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
  const restoreResponse = await request.get("/api/restoreDB");
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

async function prepareUniqueLoggedUser() {
  const restoreResponse = await request.get("/api/restoreDB");
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

module.exports = {
  prepareUniqueLoggedUser,
  prepareUniqueArticle,
  prepareUniqueComment,
  authUser,
  authUser2,
  generateValidUserData,
  generateValidArticleData,
  generateValidCommentData,
  validExistingUser,
  validExistingComment,
  validExistingArticle,
  generateValidUserLoginData,
  generateLikesBody,
  generateSurveyBody,
};
