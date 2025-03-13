const {
  HTTP_OK,
  HTTP_NOT_FOUND,
  HTTP_BAD_REQUEST,
  HTTP_UNAUTHORIZED,
  HTTP_UNPROCESSABLE_ENTITY,
} = require("../../helpers/response.helpers");
const { formatErrorResponse } = require("../../helpers/helpers");
const dataProvider = require("./challenges-data-v1.provider");

function handleV1Endpoints(endpointParts, req, res) {
  // Handle auth endpoints without token verification
  if (endpointParts.length === 2 && endpointParts[0] === "auth") {
    if (endpointParts[1] === "register" && req.method === "POST") {
      return handleRegister(req, res, dataProvider);
    }
    if (endpointParts[1] === "login" && req.method === "POST") {
      return handleLogin(req, res, dataProvider);
    }
    if (endpointParts[1] === "logout" && req.method === "POST") {
      return handleLogout(req, res, dataProvider);
    }
    res.status(HTTP_NOT_FOUND).send({ success: false, error: "Auth endpoint not found" });
    return;
  }

  // Check if endpoint exists and validate resource exists for GET requests
  const method = req.method.toUpperCase();
  if (endpointParts.length === 1 && method === "GET") {
    const challenge = dataProvider.getChallengeById(endpointParts[0]);
    if (!challenge) {
      res.status(HTTP_NOT_FOUND).send({ success: false, error: "Challenge not found" });
      return;
    }
  }

  const isValidEndpoint =
    (endpointParts.length === 0 && method === "GET") ||
    (endpointParts.length === 1 && method === "GET") ||
    (endpointParts.length === 1 && endpointParts[0] === "submit" && method === "POST");

  if (!isValidEndpoint) {
    res.status(HTTP_NOT_FOUND).send({ success: false, error: "Endpoint not found" });
    return;
  }

  // Validate token for valid endpoints
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(HTTP_UNAUTHORIZED).send({ success: false, error: "No token provided" });
    return;
  }

  const user = dataProvider.getUserByToken(token);
  if (!user) {
    res.status(HTTP_UNAUTHORIZED).send({ success: false, error: "Invalid or expired token" });
    return;
  }

  // Handle different endpoints
  if (endpointParts.length === 0) {
    // GET /challenges
    const challenges = dataProvider.getAllChallenges();
    res.status(HTTP_OK).send({ success: true, data: challenges });
    return;
  }

  if (endpointParts.length === 1) {
    if (endpointParts[0] === "submit" && method === "POST") {
      // POST /challenges/submit
      return handleSubmitChallenge(req, res, dataProvider, user.id);
    } else if (method === "GET") {
      // GET /challenges/{id}
      return handleGetChallenge(endpointParts[0], res, dataProvider);
    }
  }

  res.status(HTTP_NOT_FOUND).send({ success: false, error: "Endpoint not found" });
  return;
}

function handleRegister(req, res, dataProvider) {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Missing email or password"));
    return;
  }

  if (dataProvider.getUserByEmail(email)) {
    res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Email already exists"));
    return;
  }

  const user = dataProvider.createUser(email, password);
  res.status(HTTP_OK).send({
    success: true,
    data: { id: user.id, email: user.email, created_at: user.created_at },
  });
  return;
}

function handleLogin(req, res, dataProvider) {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(HTTP_BAD_REQUEST).send({ success: false, error: "Missing email or password" });
    return;
  }

  const token = dataProvider.authUser(email, password);
  if (token !== null) {
    res.status(HTTP_OK).send({
      success: true,
      data: { token },
    });
    return;
  }
  res.status(HTTP_UNAUTHORIZED).send({ success: false, error: "Invalid credentials" });
  return;
}

function handleLogout(req, res, dataProvider) {
  const token = req.headers.authorization;
  if (token) {
    dataProvider.removeToken(token);
  }
  res.status(HTTP_OK).send({ success: true });
  return;
}

function handleGetChallenge(challengeId, res, dataProvider) {
  const challenge = dataProvider.getChallengeById(challengeId);
  if (!challenge) {
    res.status(HTTP_NOT_FOUND).send({ success: false, error: "Challenge not found" });
    return;
  }
  res.status(HTTP_OK).send({ success: true, data: challenge });
  return;
}

function handleSubmitChallenge(req, res, dataProvider, userId) {
  const { challenge_id, solution } = req.body;
  if (!challenge_id || !solution) {
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Missing required fields"));
    return;
  }

  const result = dataProvider.submitChallenge(userId, challenge_id, solution);
  res.status(HTTP_OK).send({ success: true, data: result });
  return;
}

module.exports = handleV1Endpoints;
