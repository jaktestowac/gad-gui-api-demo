const { request, learningBaseUrl } = require("../config");

async function authUser() {
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
  authUser,
  authInstructor,
  authLearningUser,
  registerNewLearningUser,
  authAdminUser,
};
