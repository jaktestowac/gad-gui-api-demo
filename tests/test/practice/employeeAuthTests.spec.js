const { gracefulQuit, setupEnv } = require("../../helpers/helpers.js");
const { practiceBaseUrl, request, expect } = require("../../config.js");

describe("Employee Management System Auth Tests", () => {
  const baseUrl = practiceBaseUrl + "/v1";
  let adminToken = null;
  let userToken = null;
  let userId = null;

  before(async () => {
    await setupEnv();

    // Login with admin user
    const adminLoginResponse = await request.post(`${baseUrl}/auth/login`).send({
      username: "admin",
      password: "1234", // Default admin credentials
    });

    expect(adminLoginResponse.status).to.equal(200);
    expect(adminLoginResponse.body).to.have.property("token");
    adminToken = adminLoginResponse.body.token;

    // Login with regular user
    const userLoginResponse = await request.post(`${baseUrl}/auth/login`).send({
      username: "user",
      password: "user123", // Default user credentials
    });

    expect(userLoginResponse.status).to.equal(200);
    expect(userLoginResponse.body).to.have.property("token");
    userToken = userLoginResponse.body.token;
    userId = userLoginResponse.body.userId;
  });

  after(() => {
    gracefulQuit();
  });

  describe("Authentication Tests", () => {
    it("Should return user permissions", async () => {
      const response = await request.get(`${baseUrl}/auth/permissions`).set("Authorization", `Bearer ${userToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("permissions");
      expect(response.body.permissions).to.be.an("array");
      expect(response.body.permissions).to.include("VIEW");
    });

    it("Should return admin permissions", async () => {
      const response = await request.get(`${baseUrl}/auth/permissions`).set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("permissions");
      expect(response.body.permissions).to.be.an("array");
      expect(response.body.permissions).to.include.members(["CREATE", "UPDATE", "DELETE", "VIEW"]);
    });
    it("Should reject requests without auth token", async () => {
      const response = await request.get(`${baseUrl}/auth/permissions`);

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property("error");
      expect(response.body.error?.message).to.equal("Authentication required. Please log in.");
    });
    it("Should reject requests with invalid auth token", async () => {
      const response = await request.get(`${baseUrl}/auth/permissions`).set("Authorization", "Bearer invalid-token");

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property("error");
      expect(response.body.error?.message).to.equal("Authentication required. Please log in.");
    });
  });

  describe("Authorization Tests", () => {
    it("Admin should have access to all endpoints", async () => {
      // Test access to employees endpoint
      const employeesResponse = await request.get(`${baseUrl}/employees`).set("Authorization", `Bearer ${adminToken}`);
      expect(employeesResponse.status).to.equal(200);

      // Test access to departments endpoint
      const departmentsResponse = await request
        .get(`${baseUrl}/departments`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(departmentsResponse.status).to.equal(200);

      // Test access to roles endpoint
      const rolesResponse = await request.get(`${baseUrl}/roles`).set("Authorization", `Bearer ${adminToken}`);
      expect(rolesResponse.status).to.equal(200);

      // Test access to attendance endpoint
      const attendanceResponse = await request
        .get(`${baseUrl}/attendance`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(attendanceResponse.status).to.equal(200);
    });

    it("Regular user should have limited access", async () => {
      // Test access to read operations (should work)
      const getEmployeesResponse = await request
        .get(`${baseUrl}/employees`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(getEmployeesResponse.status).to.equal(200); // Test access to create operations (should fail)
      const createEmployeeResponse = await request
        .post(`${baseUrl}/employees`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
          position: "Tester",
        });
      expect(createEmployeeResponse.status).to.equal(403);
      expect(createEmployeeResponse.body).to.have.property("error");
      expect(createEmployeeResponse.body.error?.message).to.include("Permission denied");
    });

    it("User should be denied access to create, update, and delete operations", async () => {
      // Create
      const createDepartmentResponse = await request
        .post(`${baseUrl}/departments`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          name: "Test Department",
        });
      expect(createDepartmentResponse.status).to.equal(403);

      // Update (first need to get an existing ID)
      const getRolesResponse = await request.get(`${baseUrl}/roles`).set("Authorization", `Bearer ${userToken}`);

      const roleId = getRolesResponse.body[0]?.id || 1;

      const updateRoleResponse = await request
        .put(`${baseUrl}/roles/${roleId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          role: "Modified Role",
          permissions: ["VIEW"],
        });
      expect(updateRoleResponse.status).to.equal(403);

      // Delete
      const deleteAttendanceResponse = await request
        .delete(`${baseUrl}/attendance/1`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(deleteAttendanceResponse.status).to.equal(403);
    });
  });

  describe("Logout and Session Invalidation", () => {
    it("Should invalidate token on logout", async () => {
      // First, get a fresh token
      const loginResponse = await request.post(`${baseUrl}/auth/login`).send({
        username: "user",
        password: "user123",
      });

      const tempToken = loginResponse.body.token;

      // Verify token works
      const verifyResponse = await request
        .get(`${baseUrl}/auth/permissions`)
        .set("Authorization", `Bearer ${tempToken}`);
      expect(verifyResponse.status).to.equal(200);

      // Logout
      const logoutResponse = await request.post(`${baseUrl}/auth/logout`).set("Authorization", `Bearer ${tempToken}`);
      expect(logoutResponse.status).to.equal(200);

      // Try to use token after logout
      const afterLogoutResponse = await request
        .get(`${baseUrl}/auth/permissions`)
        .set("Authorization", `Bearer ${tempToken}`);
      expect(afterLogoutResponse.status).to.equal(401);
    });

    it("Should allow login after logout", async () => {
      // Login again
      const loginResponse = await request.post(`${baseUrl}/auth/login`).send({
        username: "user",
        password: "user123",
      });

      expect(loginResponse.status).to.equal(200);
      expect(loginResponse.body).to.have.property("token");

      // Get permissions with new token
      const permissionsResponse = await request
        .get(`${baseUrl}/auth/permissions`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);
      expect(permissionsResponse.status).to.equal(200);
    });
  });
});
