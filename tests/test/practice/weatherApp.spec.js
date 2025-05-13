const { gracefulQuit, setupEnv } = require("../../helpers/helpers.js");
const { practiceBaseUrl, request, expect } = require("../../config.js");

describe("WeatherApp checks", async () => {
  const baseUrl = practiceBaseUrl;
  let userToken = null;
  let adminToken = null;
  let testUsername = null;
  let testPassword = "password123";
  let adminUsername = null;
  let user2Token = null;
  let user2Username = null;
  let user1EventId = null;
  let user2EventId = null;

  before(async () => {
    await setupEnv();

    // Register users first since createMockWeatherAppData isn't being called
    testUsername = `user${Date.now().toString().slice(-5)}`;
    adminUsername = `admin${Date.now().toString().slice(-5)}`;
    user2Username = `user2${Date.now().toString().slice(-5)}`;
  });

  after(() => {
    gracefulQuit();
  });

  // Weather Data Endpoints
  describe("Weather Data Endpoints", () => {
    it("GET /weather/current - should return current weather", async () => {
      const url = `${baseUrl}/v1/weather/current`;

      // Act:
      const response = await request.get(url);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("temp");
      expect(response.body).to.have.property("date");
      expect(response.body).to.have.property("wind");
    });

    it("POST /weather/day - should return weather for specific day", async () => {
      const url = `${baseUrl}/v1/weather/day`;
      const payload = {
        day: "2025-05-10", // Tomorrow's date
      };

      // Act:
      const response = await request.post(url).send(payload);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("temp");
      expect(response.body).to.have.property("date");
      expect(response.body).to.have.property("wind");
    });

    it("POST /weather/day - should error with missing day", async () => {
      const url = `${baseUrl}/v1/weather/day`;

      // Act:
      const response = await request.post(url).send({});

      // Assert:
      expect(response.status).to.equal(400);
      expect(response.body).to.have.property("error");
    });
  });

  // User Authentication Endpoints
  describe("User Authentication Endpoints", () => {
    it("POST /weather/auth/register - should register a regular user", async () => {
      const url = `${baseUrl}/v1/weather/auth/register`;
      const payload = {
        username: testUsername,
        password: testPassword,
      };

      // Act:
      const response = await request.post(url).send(payload);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("message");
      expect(response.body.message).to.equal("Registration successful!");
      expect(response.body).to.have.property("user");
    });

    it("POST /weather/auth/register - should register an admin user", async () => {
      const url = `${baseUrl}/v1/weather/auth/register`;
      const payload = {
        username: adminUsername,
        password: testPassword,
        isAdmin: true,
      };

      // Act:
      const response = await request.post(url).send(payload);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("message");
      expect(response.body.message).to.equal("Registration successful!");
      expect(response.body).to.have.property("user");
      expect(response.body.user).to.have.property("isAdmin");
      expect(response.body.user.isAdmin).to.equal(true);
    });

    it("POST /weather/auth/register - should error with invalid username", async () => {
      const url = `${baseUrl}/v1/weather/auth/register`;
      const payload = {
        username: "u$", // Invalid username (too short + invalid character)
        password: testPassword,
      };

      // Act:
      const response = await request.post(url).send(payload);

      // Assert:
      expect(response.status).to.equal(400);
      expect(response.body).to.have.property("error");
    });

    it("POST /weather/auth/register - should register a second user", async () => {
      const url = `${baseUrl}/v1/weather/auth/register`;
      const payload = {
        username: user2Username,
        password: testPassword,
      };

      // Act:
      const response = await request.post(url).send(payload);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("message");
      expect(response.body.message).to.equal("Registration successful!");
      expect(response.body).to.have.property("user");
      expect(response.body.user.username).to.equal(user2Username);

      // Now login with this user to get token
      const loginResponse = await request.post(`${baseUrl}/v1/weather/auth/login`).send(payload);
      expect(loginResponse.status).to.equal(200);
      user2Token = loginResponse.body.token;
    });

    it("POST /weather/auth/login - should login and return token", async () => {
      const url = `${baseUrl}/v1/weather/auth/login`;
      const payload = {
        username: testUsername, // Using our newly registered user
        password: testPassword,
      };

      // Act:
      const response = await request.post(url).send(payload);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("token");
      expect(response.body).to.have.property("user");
      expect(response.body.user).to.have.property("username");
      expect(response.body.user.username).to.equal(testUsername);

      // Save token for later tests
      userToken = response.body.token;
    });

    it("POST /weather/auth/login - should login as admin", async () => {
      const url = `${baseUrl}/v1/weather/auth/login`;
      const payload = {
        username: adminUsername,
        password: testPassword,
      };

      // Act:
      const response = await request.post(url).send(payload);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("token");
      expect(response.body).to.have.property("user");
      expect(response.body.user).to.have.property("isAdmin");
      expect(response.body.user.isAdmin).to.equal(true);

      // Save admin token for later tests
      adminToken = response.body.token;
    });

    it("POST /weather/auth/login - should error with invalid credentials", async () => {
      const url = `${baseUrl}/v1/weather/auth/login`;
      const payload = {
        username: "nonexistent",
        password: "wrongpassword",
      };

      // Act:
      const response = await request.post(url).send(payload);

      // Assert:
      expect(response.status).to.equal(401);
      expect(response.body).to.have.property("error");
    });

    it("GET /weather/auth/current-user - should return current user info", async () => {
      const url = `${baseUrl}/v1/weather/auth/current-user`;

      // Act:
      const response = await request.get(url).set("Authorization", `Bearer ${userToken}`);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("id");
      expect(response.body).to.have.property("username");
    });

    it("GET /weather/auth/current-user - should fail with no token", async () => {
      const url = `${baseUrl}/v1/weather/auth/current-user`;

      // Act:
      const response = await request.get(url);

      // Assert:
      expect(response.status).to.equal(401);
      expect(response.body).to.have.property("error");
    });
  });

  // Authentication Edge Cases
  describe("Authentication Edge Cases", () => {
    let invalidUsername;
    let veryLongPassword;
    let specialCharsUsername;

    beforeEach(() => {
      invalidUsername = `u${Date.now().toString().slice(-5)}`;
      veryLongPassword = "p".repeat(200); // 200-character password
      specialCharsUsername = `u$@!${Date.now().toString().slice(-5)}`;
    });
    it("POST /weather/auth/register - should accept very long passwords", async () => {
      const url = `${baseUrl}/v1/weather/auth/register`;
      const payload = {
        username: invalidUsername,
        password: veryLongPassword,
      };

      // Act:
      const response = await request.post(url).send(payload);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("message");
      expect(response.body.message).to.equal("Registration successful!");
    });

    it("POST /weather/auth/register - should reject username with special characters", async () => {
      const url = `${baseUrl}/v1/weather/auth/register`;
      const payload = {
        username: specialCharsUsername,
        password: testPassword,
      };

      // Act:
      const response = await request.post(url).send(payload);

      // Assert:
      expect(response.status).to.equal(400);
      expect(response.body).to.have.property("error");
    });
    it("POST /weather/auth/register - should accept empty password", async () => {
      const url = `${baseUrl}/v1/weather/auth/register`;
      const payload = {
        username: invalidUsername,
        password: "", // API treats empty string as defined
      };

      // Act:
      const response = await request.post(url).send(payload);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("message");
      expect(response.body.message).to.equal("Registration successful!");
    });

    it("Auth endpoints - should reject malformed tokens", async () => {
      const url = `${baseUrl}/v1/weather/auth/current-user`;
      const malformedToken = "malformed-token-12345";

      // Act:
      const response = await request.get(url).set("Authorization", `Bearer ${malformedToken}`);

      // Assert:
      expect(response.status).to.equal(401);
      expect(response.body).to.have.property("error");
    });

    it("Auth endpoints - should reject when using token after logout", async () => {
      // First, let's register and login a test user
      const tempUsername = `temp${Date.now().toString().slice(-5)}`;

      // Register
      const registerResponse = await request.post(`${baseUrl}/v1/weather/auth/register`).send({
        username: tempUsername,
        password: testPassword,
      });

      expect(registerResponse.status).to.equal(200);

      // Login
      const loginResponse = await request.post(`${baseUrl}/v1/weather/auth/login`).send({
        username: tempUsername,
        password: testPassword,
      });

      expect(loginResponse.status).to.equal(200);
      const tempToken = loginResponse.body.token;

      // Verify token works
      const verifyResponse = await request
        .get(`${baseUrl}/v1/weather/auth/current-user`)
        .set("Authorization", `Bearer ${tempToken}`);

      expect(verifyResponse.status).to.equal(200);

      // Logout
      const logoutResponse = await request
        .post(`${baseUrl}/v1/weather/auth/logout`)
        .set("Authorization", `Bearer ${tempToken}`);

      expect(logoutResponse.status).to.equal(200);

      // Try to use the token after logout
      const postLogoutResponse = await request
        .get(`${baseUrl}/v1/weather/auth/current-user`)
        .set("Authorization", `Bearer ${tempToken}`);

      expect(postLogoutResponse.status).to.equal(401);
      expect(postLogoutResponse.body).to.have.property("error");
    });
  });

  // Event Access Control Tests
  describe("Event Access Control Tests", () => {
    const today = new Date().toISOString().split("T")[0]; // Today's date

    before(async () => {
      // Create an event for each user to test with
      // User 1 event
      const createUser1EventResponse = await request
        .post(`${baseUrl}/v1/weather/event`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          day: today,
          event: "User 1 Event for Access Control Test",
        });

      expect(createUser1EventResponse.status).to.equal(200);
      user1EventId = createUser1EventResponse.body.id;

      // User 2 event
      const createUser2EventResponse = await request
        .post(`${baseUrl}/v1/weather/event`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          day: today,
          event: "User 2 Event for Access Control Test",
        });

      expect(createUser2EventResponse.status).to.equal(200);
      user2EventId = createUser2EventResponse.body.id;
    });

    it("User 1 should not be able to view User 2's event", async () => {
      const url = `${baseUrl}/v1/weather/event/${user2EventId}`;

      // Act:
      const response = await request.get(url).set("Authorization", `Bearer ${userToken}`);

      // Assert:
      expect(response.status).to.equal(401);
      expect(response.body).to.have.property("error");
    });

    it("User 1 should not be able to update User 2's event", async () => {
      const url = `${baseUrl}/v1/weather/event/${user2EventId}`;
      const payload = {
        event: "Unauthorized update attempt",
      };

      // Act:
      const response = await request.put(url).set("Authorization", `Bearer ${userToken}`).send(payload);

      // Assert:
      expect(response.status).to.equal(401);
      expect(response.body).to.have.property("error");
    });

    it("User 1 should not be able to delete User 2's event", async () => {
      const url = `${baseUrl}/v1/weather/event/${user2EventId}`;

      // Act:
      const response = await request.delete(url).set("Authorization", `Bearer ${userToken}`);

      // Assert:
      expect(response.status).to.equal(401);
      expect(response.body).to.have.property("error");
    });

    it("User 2 should not see User 1's events in their event list", async () => {
      const url = `${baseUrl}/v1/weather/event`;

      // Act:
      const response = await request.get(url).set("Authorization", `Bearer ${user2Token}`);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an("array");

      // Check that user1's events aren't visible to user2
      const hasUser1Events = response.body.some((event) => event.id === user1EventId);
      expect(hasUser1Events).to.be.false;
    });

    it("Admin should be able to view any user's event", async () => {
      const url1 = `${baseUrl}/v1/weather/event/${user1EventId}`;
      const url2 = `${baseUrl}/v1/weather/event/${user2EventId}`;

      // Act:
      const response1 = await request.get(url1).set("Authorization", `Bearer ${adminToken}`);
      const response2 = await request.get(url2).set("Authorization", `Bearer ${adminToken}`);

      // Assert:
      expect(response1.status).to.equal(200);
      expect(response1.body).to.have.property("id");
      expect(response1.body.id).to.equal(user1EventId);

      expect(response2.status).to.equal(200);
      expect(response2.body).to.have.property("id");
      expect(response2.body.id).to.equal(user2EventId);
    });

    it("Admin should be able to update any user's event", async () => {
      const url = `${baseUrl}/v1/weather/event/${user2EventId}`;
      const payload = {
        id: user2EventId,
        event: "Admin updated User 2's event",
      };

      // Act:
      const response = await request.put(url).set("Authorization", `Bearer ${adminToken}`).send(payload);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("id");
      expect(response.body.id).to.equal(user2EventId);
      expect(response.body).to.have.property("event");
      expect(response.body.event).to.equal(payload.event);
    });

    it("Admin should be able to delete any user's event", async () => {
      // First create a temporary event for user2
      const createTempEventResponse = await request
        .post(`${baseUrl}/v1/weather/event`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          day: today,
          event: "Temporary event for admin deletion test",
        });

      const tempEventId = createTempEventResponse.body.id;

      // Admin should be able to delete it
      const url = `${baseUrl}/v1/weather/event/${tempEventId}`;

      // Act:
      const response = await request.delete(url).set("Authorization", `Bearer ${adminToken}`);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("message");
      expect(response.body).to.have.property("event");
      expect(response.body.event.id).to.equal(tempEventId);
    });
  });

  // Date Handling Tests
  describe("Date Handling Tests", () => {
    it("POST /weather/day - should handle past date", async () => {
      const url = `${baseUrl}/v1/weather/day`;
      const payload = {
        day: "2020-01-01", // Past date
      };

      // Act:
      const response = await request.post(url).send(payload);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("temp");
      expect(response.body).to.have.property("date");
      expect(response.body).to.have.property("wind");
      expect(response.body.date).to.equal(payload.day);
    });

    it("POST /weather/day - should handle future date", async () => {
      const url = `${baseUrl}/v1/weather/day`;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split("T")[0];

      const payload = {
        day: futureDate,
      };

      // Act:
      const response = await request.post(url).send(payload);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("temp");
      expect(response.body).to.have.property("date");
      expect(response.body).to.have.property("wind");
      expect(response.body.date).to.equal(payload.day);
    });
    it("POST /weather/day - should handle any string as date", async () => {
      const url = `${baseUrl}/v1/weather/day`;
      const payload = {
        day: "not-a-valid-date", // API doesn't validate date format
      };

      // Act:
      const response = await request.post(url).send(payload);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("temp");
      expect(response.body).to.have.property("date");
      expect(response.body).to.have.property("wind");
    });

    it("POST /weather/event - should create event with past date", async () => {
      const url = `${baseUrl}/v1/weather/event`;
      const payload = {
        day: "2020-01-01", // Past date
        event: "Past weather event",
      };

      // Act:
      const response = await request.post(url).set("Authorization", `Bearer ${userToken}`).send(payload);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("id");
      expect(response.body).to.have.property("day");
      expect(response.body).to.have.property("event");
      expect(response.body.day).to.equal(payload.day);
    });

    it("POST /weather/event - should create event with future date", async () => {
      const url = `${baseUrl}/v1/weather/event`;
      // Generate a date 10 years in the future
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 10);
      const futureDateString = futureDate.toISOString().split("T")[0];

      const payload = {
        day: futureDateString,
        event: "Future weather prediction",
      };

      // Act:
      const response = await request.post(url).set("Authorization", `Bearer ${userToken}`).send(payload);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("id");
      expect(response.body).to.have.property("day");
      expect(response.body).to.have.property("event");
      expect(response.body.day).to.equal(payload.day);
    });
    it("POST /weather/event - should accept any string as date", async () => {
      const url = `${baseUrl}/v1/weather/event`;
      const payload = {
        day: "invalid-date-format", // API doesn't validate date format
        event: "Event with invalid date",
      };

      // Act:
      const response = await request.post(url).set("Authorization", `Bearer ${userToken}`).send(payload);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("id");
      expect(response.body).to.have.property("day");
      expect(response.body).to.have.property("event");
      expect(response.body.day).to.equal(payload.day);
    });

    it("GET /weather/event - should filter events by specific date", async () => {
      // First create events with specific dates
      const dateToFilter = "2022-05-15";

      // Create an event with this specific date
      const createUrl = `${baseUrl}/v1/weather/event`;
      await request.post(createUrl).set("Authorization", `Bearer ${userToken}`).send({
        day: dateToFilter,
        event: "Event for date filtering test",
      });

      // Create another event with a different date
      await request.post(createUrl).set("Authorization", `Bearer ${userToken}`).send({
        day: "2022-06-20",
        event: "Event with different date",
      });

      // Now try to filter by the specific date
      const url = `${baseUrl}/v1/weather/event?day=${dateToFilter}`;

      // Act:
      const response = await request.get(url).set("Authorization", `Bearer ${userToken}`);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an("array");

      // All returned events should have the filtered date
      response.body.forEach((event) => {
        expect(event.day).to.equal(dateToFilter);
      });

      // There should be at least one event with our test date
      expect(response.body.some((event) => event.day === dateToFilter)).to.be.true;
    });
  });

  // NEW: Multi-User Interaction Tests
  describe("Multi-User Interaction Tests", () => {
    const sharedDate = "2023-07-15"; // Same date for all users' events
    let user1EventsForDate = [];
    let user2EventsForDate = [];

    before(async () => {
      // Create multiple events for the same date with different users

      // User 1 creates two events
      const createUrl = `${baseUrl}/v1/weather/event`;

      const createEvent1User1Response = await request.post(createUrl).set("Authorization", `Bearer ${userToken}`).send({
        day: sharedDate,
        event: "User 1 - Event 1 for Multi-User Test",
      });

      expect(createEvent1User1Response.status).to.equal(200);
      user1EventsForDate.push(createEvent1User1Response.body.id);

      const createEvent2User1Response = await request.post(createUrl).set("Authorization", `Bearer ${userToken}`).send({
        day: sharedDate,
        event: "User 1 - Event 2 for Multi-User Test",
      });

      expect(createEvent2User1Response.status).to.equal(200);
      user1EventsForDate.push(createEvent2User1Response.body.id);

      // User 2 creates two events
      const createEvent1User2Response = await request
        .post(createUrl)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          day: sharedDate,
          event: "User 2 - Event 1 for Multi-User Test",
        });

      expect(createEvent1User2Response.status).to.equal(200);
      user2EventsForDate.push(createEvent1User2Response.body.id);

      const createEvent2User2Response = await request
        .post(createUrl)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          day: sharedDate,
          event: "User 2 - Event 2 for Multi-User Test",
        });

      expect(createEvent2User2Response.status).to.equal(200);
      user2EventsForDate.push(createEvent2User2Response.body.id);
    });

    it("User 1 should only see their own events when filtering by date", async () => {
      const url = `${baseUrl}/v1/weather/event?day=${sharedDate}`;

      // Act:
      const response = await request.get(url).set("Authorization", `Bearer ${userToken}`);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an("array");

      // All events should belong to User 1
      response.body.forEach((event) => {
        expect(event.userId).to.equal(response.body[0].userId); // All should have same userId
      });

      // Should contain User 1's events
      const eventIds = response.body.map((event) => event.id);
      expect(eventIds).to.include.members(user1EventsForDate);

      // Should not contain User 2's events
      user2EventsForDate.forEach((id) => {
        expect(eventIds).to.not.include(id);
      });
    });

    it("User 2 should only see their own events when filtering by date", async () => {
      const url = `${baseUrl}/v1/weather/event?day=${sharedDate}`;

      // Act:
      const response = await request.get(url).set("Authorization", `Bearer ${user2Token}`);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an("array");

      // All events should belong to User 2
      response.body.forEach((event) => {
        expect(event.userId).to.equal(response.body[0].userId); // All should have same userId
      });

      // Should contain User 2's events
      const eventIds = response.body.map((event) => event.id);
      expect(eventIds).to.include.members(user2EventsForDate);

      // Should not contain User 1's events
      user1EventsForDate.forEach((id) => {
        expect(eventIds).to.not.include(id);
      });
    });

    it("Admin should see both users' events in admin data endpoint", async () => {
      const url = `${baseUrl}/v1/weather/admin/data`;

      // Act:
      const response = await request.get(url).set("Authorization", `Bearer ${adminToken}`);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("events");
      expect(response.body.events).to.be.an("array");

      // Admin should see all events from both users
      const allEventIds = [...user1EventsForDate, ...user2EventsForDate];
      const responseEventIds = response.body.events.map((event) => event.id);

      allEventIds.forEach((id) => {
        expect(responseEventIds).to.include(id);
      });
    });

    it("Users should be able to update their own events without affecting others", async () => {
      // User 1 updates their event
      const updateUrl = `${baseUrl}/v1/weather/event/${user1EventsForDate[0]}`;
      const updatedText = "User 1 - Updated Event 1";

      const updateResponse = await request.put(updateUrl).set("Authorization", `Bearer ${userToken}`).send({
        id: user1EventsForDate[0],
        event: updatedText,
      });

      expect(updateResponse.status).to.equal(200);
      expect(updateResponse.body.event).to.equal(updatedText);

      // User 2's events should remain unchanged
      const user2EventUrl = `${baseUrl}/v1/weather/event/${user2EventsForDate[0]}`;
      const user2EventResponse = await request.get(user2EventUrl).set("Authorization", `Bearer ${user2Token}`);

      expect(user2EventResponse.status).to.equal(200);
      expect(user2EventResponse.body.event).to.not.equal(updatedText);
    });

    it("Regular users should not see admin endpoints", async () => {
      const url = `${baseUrl}/v1/weather/admin/data`;

      // Act:
      const response = await request.get(url).set("Authorization", `Bearer ${userToken}`);

      // Assert:
      expect(response.status).to.equal(401);
      expect(response.body).to.have.property("error");
    });

    it("Admin should be able to see all user accounts", async () => {
      const url = `${baseUrl}/v1/weather/admin/data`;

      // Act:
      const response = await request.get(url).set("Authorization", `Bearer ${adminToken}`);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("users");
      expect(response.body.users).to.be.an("array");

      // Should find our test users in the list
      const usernames = response.body.users.map((user) => user.username);
      expect(usernames).to.include.members([testUsername, user2Username, adminUsername]);
    });
  });

  // Weather Events Endpoints
  describe("Weather Events Endpoints", () => {
    let eventId = null;
    const eventText = "Heavy rainfall predicted";
    const today = new Date().toISOString().split("T")[0]; // Today's date

    // Create a new event before each test that needs it
    beforeEach(async function () {
      // Skip this setup for the create event test and error tests
      if (
        this.currentTest &&
        (this.currentTest.title.includes("create new weather event") ||
          this.currentTest.title.includes("fail with invalid"))
      ) {
        return;
      }

      // Create an event if we don't have one yet
      if (!eventId) {
        const url = `${baseUrl}/v1/weather/event`;
        const payload = {
          day: today,
          event: eventText,
        };

        const response = await request.post(url).set("Authorization", `Bearer ${userToken}`).send(payload);

        expect(response.status).to.equal(200);
        eventId = response.body.id;
      }
    });

    it("POST /weather/event - should create new weather event", async () => {
      const url = `${baseUrl}/v1/weather/event`;
      const payload = {
        day: today,
        event: eventText,
      };

      // Act:
      const response = await request.post(url).set("Authorization", `Bearer ${userToken}`).send(payload);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("id");
      expect(response.body).to.have.property("day");
      expect(response.body).to.have.property("event");
      expect(response.body).to.have.property("userId");
      expect(response.body.day).to.equal(today);
      expect(response.body.event).to.equal(eventText);

      // Update event ID for other tests
      eventId = response.body.id;
    });

    it("POST /weather/event - should fail with invalid event text", async () => {
      const url = `${baseUrl}/v1/weather/event`;
      const payload = {
        day: today,
        event: "ab", // Too short
      };

      // Act:
      const response = await request.post(url).set("Authorization", `Bearer ${userToken}`).send(payload);

      // Assert:
      expect(response.status).to.equal(400);
      expect(response.body).to.have.property("error");
    });

    it("GET /weather/event - should get user events", async () => {
      const url = `${baseUrl}/v1/weather/event`;

      // Act:
      const response = await request.get(url).set("Authorization", `Bearer ${userToken}`);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.be.an("array");
      expect(response.body.length).to.be.at.least(1);
      expect(response.body[0]).to.have.property("id");
      expect(response.body[0]).to.have.property("event");
    });

    it("GET /weather/event - should filter by day", async () => {
      const url = `${baseUrl}/v1/weather/event?day=${today}`;

      // Act:
      const response = await request.get(url).set("Authorization", `Bearer ${userToken}`);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.be.an("array");
      response.body.forEach((event) => {
        expect(event.day).to.equal(today);
      });
    });

    it("GET /weather/event/:id - should get event by ID", async () => {
      const url = `${baseUrl}/v1/weather/event/${eventId}`;

      // Act:
      const response = await request.get(url).set("Authorization", `Bearer ${userToken}`);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("id");
      expect(response.body.id).to.equal(eventId);
      expect(response.body).to.have.property("event");
    });

    it("GET /weather/event/:id - should fail with invalid ID", async () => {
      const url = `${baseUrl}/v1/weather/event/9999`;

      // Act:
      const response = await request.get(url).set("Authorization", `Bearer ${userToken}`);

      // Assert:
      expect(response.status).to.equal(404);
      expect(response.body).to.have.property("error");
    });

    it("PUT /weather/event/:id - should update event", async () => {
      const updatedEvent = "Updated weather event description";
      const url = `${baseUrl}/v1/weather/event/${eventId}`;
      const payload = {
        event: updatedEvent,
      };

      // Act:
      const response = await request.put(url).set("Authorization", `Bearer ${userToken}`).send(payload);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("id");
      expect(response.body.id).to.equal(eventId);
      expect(response.body).to.have.property("event");
      expect(response.body.event).to.equal(updatedEvent);
    });

    it("DELETE /weather/event/:id - should delete event", async () => {
      const url = `${baseUrl}/v1/weather/event/${eventId}`;

      // Act:
      const response = await request.delete(url).set("Authorization", `Bearer ${userToken}`);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("message");
      expect(response.body).to.have.property("event");
      expect(response.body.event).to.have.property("id");
      expect(response.body.event.id).to.equal(eventId);

      // Mark event as deleted
      eventId = null;
    });

    it("DELETE /weather/event/:id - should fail with already deleted ID", async () => {
      // Create a temporary event just to delete it
      const createUrl = `${baseUrl}/v1/weather/event`;
      const createPayload = {
        day: today,
        event: "Temporary event to delete",
      };

      const createResponse = await request
        .post(createUrl)
        .set("Authorization", `Bearer ${userToken}`)
        .send(createPayload);

      const tempEventId = createResponse.body.id;

      // Delete it first
      await request.delete(`${baseUrl}/v1/weather/event/${tempEventId}`).set("Authorization", `Bearer ${userToken}`);

      // Now try to delete it again
      const url = `${baseUrl}/v1/weather/event/${tempEventId}`;

      // Act:
      const response = await request.delete(url).set("Authorization", `Bearer ${userToken}`);

      // Assert:
      expect(response.status).to.equal(404);
      expect(response.body).to.have.property("error");
    });
  });

  // Admin Endpoints
  describe("Admin Endpoints", () => {
    it("GET /weather/admin/data - should return all data for admin", async () => {
      const url = `${baseUrl}/v1/weather/admin/data`;

      // Act:
      const response = await request.get(url).set("Authorization", `Bearer ${adminToken}`);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("users");
      expect(response.body).to.have.property("events");
      expect(response.body.users).to.be.an("array");
      expect(response.body.events).to.be.an("array");
    });

    it("GET /weather/admin/data - should reject regular user", async () => {
      const url = `${baseUrl}/v1/weather/admin/data`;

      // Act:
      const response = await request.get(url).set("Authorization", `Bearer ${userToken}`);

      // Assert:
      expect(response.status).to.equal(401);
      expect(response.body).to.have.property("error");
    });
  });

  // Logout Test (should be last)
  describe("Logout Endpoint", () => {
    it("POST /weather/auth/logout - should logout user", async () => {
      const url = `${baseUrl}/v1/weather/auth/logout`;

      // Act:
      const response = await request.post(url).set("Authorization", `Bearer ${userToken}`);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("message");
      expect(response.body.message).to.include("successful");
    });

    it("GET /weather/auth/current-user - should fail after logout", async () => {
      const url = `${baseUrl}/v1/weather/auth/current-user`;

      // Act:
      const response = await request.get(url).set("Authorization", `Bearer ${userToken}`);

      // Assert:
      expect(response.status).to.equal(401);
      expect(response.body).to.have.property("error");
    });
  });
});
