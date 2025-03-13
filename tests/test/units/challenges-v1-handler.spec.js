const { expect } = require("../../config.js");
const { gracefulQuit } = require("../../helpers/helpers.js");
const handleV1Endpoints = require("../../../endpoints/challenges/v1.handler.js");
const dataProvider = require("../../../endpoints/challenges/challenges-data-v1.provider.js");

describe("Challenges V1 Endpoint Handler Tests", () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      send: function (data) {
        this.sentData = data;
        return this;
      },
      statusCode: null,
      sentData: null,
    };
  });

  after(() => {
    gracefulQuit();
  });

  describe("Authentication Endpoints", () => {
    it("should register new user", () => {
      // Arrange
      mockReq = {
        method: "POST",
        body: {
          email: "newuser@test.com",
          password: "password123",
        },
      };

      // Act
      handleV1Endpoints(["auth", "register"], mockReq, mockRes);

      // Assert
      expect(mockRes.statusCode).to.equal(200);
      expect(mockRes.sentData.success).to.be.true;
      expect(mockRes.sentData.data).to.have.property("email", "newuser@test.com");
    });

    it("should login existing user", () => {
      // Arrange
      const email = "login@test.com";
      const password = "password123";
      dataProvider.createUser(email, password);

      mockReq = {
        method: "POST",
        body: { email, password },
      };

      // Act
      handleV1Endpoints(["auth", "login"], mockReq, mockRes);

      // Assert
      expect(mockRes.statusCode).to.equal(200);
      expect(mockRes.sentData.success).to.be.true;
      expect(mockRes.sentData.data).to.have.property("token");
    });

    it("should reject invalid login", () => {
      // Arrange
      mockReq = {
        method: "POST",
        body: {
          email: "wrong@test.com",
          password: "wrongpass",
        },
      };

      // Act
      handleV1Endpoints(["auth", "login"], mockReq, mockRes);

      // Assert
      expect(mockRes.statusCode).to.equal(401);
      expect(mockRes.sentData.success).to.be.false;
    });
  });

  describe("Protected Endpoints", () => {
    let authToken;
    let userId;

    beforeEach(() => {
      // Create test user and get auth token
      const email = "protected@test.com";
      const password = "password123";
      dataProvider.createUser(email, password);
      authToken = dataProvider.authUser(email, password);
      // Get user from token to ensure we have the correct ID
      const user = dataProvider.getUserByToken(authToken);
      userId = user.id;
    });

    it("should get all challenges with valid token", () => {
      // Arrange
      mockReq = {
        method: "GET",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      };

      // Act
      handleV1Endpoints([], mockReq, mockRes);

      // Assert
      expect(mockRes.statusCode).to.equal(200);
      expect(mockRes.sentData.success).to.be.true;
      expect(mockRes.sentData.data).to.be.an("array");
    });

    it("should get specific challenge", () => {
      // Arrange
      const challenges = dataProvider.getAllChallenges();
      const challengeId = challenges[0].id;

      mockReq = {
        method: "GET",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      };

      // Act
      handleV1Endpoints([challengeId], mockReq, mockRes);

      // Assert
      expect(mockRes.statusCode).to.equal(200);
      expect(mockRes.sentData.success).to.be.true;
      expect(mockRes.sentData.data.id).to.equal(challengeId);
    });

    it("should submit challenge solution", () => {
      // Arrange
      const challenges = dataProvider.getAllChallenges();
      const challengeId = challenges[0].id;

      mockReq = {
        method: "POST",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        body: {
          challenge_id: challengeId,
          solution: "test solution",
        },
      };

      // Act
      handleV1Endpoints(["submit"], mockReq, mockRes);

      // Assert
      expect(mockRes.statusCode).to.equal(200);
      expect(mockRes.sentData.success).to.be.true;
      expect(mockRes.sentData.data).to.have.property("user_id", userId);
      expect(mockRes.sentData.data).to.have.property("challenge_id", challengeId);
    });
  });

  describe("Error Handling", () => {
    it("should reject requests without token", () => {
      // Arrange
      mockReq = {
        method: "GET",
        headers: {},
      };

      // Act
      handleV1Endpoints([], mockReq, mockRes);

      // Assert
      expect(mockRes.statusCode).to.equal(401);
      expect(mockRes.sentData.success).to.be.false;
    });

    it("should reject invalid endpoints", () => {
      // Arrange
      mockReq = {
        method: "GET",
        headers: {
          authorization: "Bearer validtoken",
        },
      };

      // Act
      handleV1Endpoints(["invalid", "endpoint"], mockReq, mockRes);

      // Assert
      expect(mockRes.statusCode).to.equal(404);
      expect(mockRes.sentData.success).to.be.false;
    });

    it("should handle missing challenge", () => {
      // Arrange
      const email = "challenge@test.com";
      const password = "password123";
      const token = dataProvider.authUser(email, password);

      mockReq = {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
        },
      };

      // Act
      handleV1Endpoints(["nonexistent-id"], mockReq, mockRes);

      // Assert
      expect(mockRes.statusCode).to.equal(404);
      expect(mockRes.sentData.success).to.be.false;
    });
  });
});
