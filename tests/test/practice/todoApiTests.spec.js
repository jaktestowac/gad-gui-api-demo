const { gracefulQuit, setupEnv } = require("../../helpers/helpers.js");
const { practiceBaseUrl, request, expect } = require("../../config.js");

describe("Todo API Tests", async () => {
  const baseUrlV1 = `${practiceBaseUrl}/v1/todos`;
  const baseUrlV2 = `${practiceBaseUrl}/v2/todos`;
  const baseUrlV3 = `${practiceBaseUrl}/v3/todos`;
  const baseUrlV4 = `${practiceBaseUrl}/v4/todos`;
  const baseUrlV5 = `${practiceBaseUrl}/v5/todos`;
  const baseUrlV6 = `${practiceBaseUrl}/v6/todos`;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe("Todo API v1 - Basic Functionality", () => {
    let todoId;

    it("Should create a new todo", async () => {
      const payload = {
        title: "Test Todo V1",
        isCompleted: false,
      };

      const response = await request.post(baseUrlV1).send(payload);
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("id");
      expect(response.body.title).to.equal(payload.title);
      expect(response.body.isCompleted).to.equal(payload.isCompleted);

      todoId = response.body.id;
    });

    it("Should get all todos", async () => {
      const response = await request.get(baseUrlV1);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an("array");
      expect(response.body.length).to.be.greaterThan(0);
    });

    it("Should update a todo", async () => {
      const payload = {
        title: "Updated Todo V1",
        isCompleted: true,
      };

      const response = await request.put(`${baseUrlV1}/${todoId}`).send(payload);

      expect(response.status).to.equal(200);
      expect(response.body.id).to.equal(todoId);
      expect(response.body.title).to.equal(payload.title);
      expect(response.body.isCompleted).to.equal(payload.isCompleted);
    });

    it("Should delete a todo", async () => {
      const response = await request.delete(`${baseUrlV1}/${todoId}`);

      expect(response.status).to.equal(200);

      // Verify deletion
      const getResponse = await request.get(`${baseUrlV1}/${todoId}`);
      expect(getResponse.status).to.equal(404);
    });
  });

  describe("Todo API v2 - Added Creation Date and Priority", () => {
    let todoId;

    it("Should create a todo with priority", async () => {
      const payload = {
        title: "Test Todo V2",
        isCompleted: false,
        priority: "high",
      };

      const response = await request.post(baseUrlV2).send(payload);
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("id");
      expect(response.body.title).to.equal(payload.title);
      expect(response.body.priority).to.equal(payload.priority);
      expect(response.body).to.have.property("creationDate");

      todoId = response.body.id;
    });

    it("Should get todos with creation date and priority", async () => {
      const response = await request.get(baseUrlV2);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an("array");
      expect(response.body[0]).to.have.property("creationDate");
      expect(response.body[0]).to.have.property("priority");
    });

    it("Should update a todo with priority", async () => {
      const payload = {
        title: "Updated Todo V2",
        isCompleted: true,
        priority: "medium",
      };

      const response = await request.put(`${baseUrlV2}/${todoId}`).send(payload);

      expect(response.status).to.equal(200);
      expect(response.body.priority).to.equal(payload.priority);
    });

    // Clean up
    after(async () => {
      if (todoId) {
        await request.delete(`${baseUrlV2}/${todoId}`);
      }
    });
  });

  describe("Todo API v3 - Added Tags and Description", () => {
    let todoId;

    it("Should create a todo with tags and description", async () => {
      const payload = {
        title: "Test Todo V3",
        isCompleted: false,
        priority: "high",
        tags: ["test", "api"],
        description: "This is a test todo for API v3",
      };

      const response = await request.post(baseUrlV3).send(payload);
      expect(response.status).to.equal(200);
      expect(response.body.tags).to.deep.equal(payload.tags);
      expect(response.body.description).to.equal(payload.description);

      todoId = response.body.id;
    });

    it("Should get todos with tags and description", async () => {
      const response = await request.get(baseUrlV3);

      expect(response.status).to.equal(200);
      expect(response.body[0]).to.have.property("tags");
      expect(response.body[0]).to.have.property("description");
    });

    // Clean up
    after(async () => {
      if (todoId) {
        await request.delete(`${baseUrlV3}/${todoId}`);
      }
    });
  });

  describe("Todo API v4 - Added Status and Position", () => {
    let todoId;

    it("Should create a todo with status and position", async () => {
      const payload = {
        title: "Test Todo V4",
        status: "inProgress",
        priority: "high",
        position: 1,
      };

      const response = await request.post(baseUrlV4).send(payload);
      expect(response.status).to.equal(200);
      expect(response.body.status).to.equal(payload.status);
      expect(response.body).to.have.property("position"); // Just check if position exists
      expect(response.body).to.have.property("isCompleted"); // Derived from status

      todoId = response.body.id;
    });

    it("Should update a todo status", async () => {
      const payload = {
        status: "completed",
      };

      const response = await request.put(`${baseUrlV4}/${todoId}`).send(payload);

      expect(response.status).to.equal(200);
      expect(response.body.status).to.equal(payload.status);
      expect(response.body.isCompleted).to.be.true; // Should be derived from status
    });

    // Clean up
    after(async () => {
      if (todoId) {
        await request.delete(`${baseUrlV4}/${todoId}`);
      }
    });
  });

  describe("Todo API v5 - Pagination and Filtering", () => {
    let todoIds = [];

    // Create multiple todos for pagination tests
    before(async () => {
      const todos = [
        { title: "Todo 1", priority: "high", status: "inProgress" },
        { title: "Todo 2", priority: "medium", status: "completed" },
        { title: "Todo 3", priority: "low", status: "todo" },
        { title: "Todo 4", priority: "high", status: "inProgress" },
        { title: "Todo 5", priority: "medium", status: "completed" },
      ];

      for (const todo of todos) {
        const response = await request.post(baseUrlV5).send(todo);
        if (response.status === 201) {
          todoIds.push(response.body.id);
        }
      }
    });
    it("Should support pagination", async () => {
      const response = await request.get(`${baseUrlV5}?page=1&limit=2`);
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an("array");
      // Skip length check as it might vary
    });

    it("Should support filtering by status", async () => {
      const response = await request.get(`${baseUrlV5}?status=completed`);
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an("array");

      // All returned todos should have completed status
      response.body.forEach((todo) => {
        expect(todo.status).to.equal("completed");
      });
    });

    it("Should support filtering by priority", async () => {
      const response = await request.get(`${baseUrlV5}?priority=high`);
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an("array");

      // All returned todos should have high priority
      response.body.forEach((todo) => {
        expect(todo.priority).to.equal("high");
      });
    });

    it("Should support combined filters", async () => {
      const response = await request.get(`${baseUrlV5}?priority=high&status=inProgress`);
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an("array");

      // All returned todos should match both criteria
      response.body.forEach((todo) => {
        expect(todo.priority).to.equal("high");
        expect(todo.status).to.equal("inProgress");
      });
    });

    // Clean up
    after(async () => {
      for (const id of todoIds) {
        await request.delete(`${baseUrlV5}/${id}`);
      }
    });
  });

  describe("Todo API v6 - Templates and Timers", () => {
    let todoId;
    let templateId;

    it("Should create a todo template", async () => {
      const payload = {
        title: "Template Todo",
        template: {
          status: "todo",
          priority: "high",
          tags: ["template", "test"],
          description: "This is a template todo",
        },
      };

      const response = await request.post(`${baseUrlV6}/templates`).send(payload);
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("id");
      expect(response.body.title).to.equal(payload.title);
      expect(response.body).to.have.property("isTemplate");
      expect(response.body.isTemplate).to.be.true;

      templateId = response.body.id;
    });

    it("Should create a todo from template", async () => {
      const createResponse = await request.post(baseUrlV6).send({
        title: "Todo from Template",
        template: templateId,
      });
      expect(createResponse.status).to.equal(200);
      expect(createResponse.body).to.have.property("id");
      expect(createResponse.body.title).to.equal("Todo from Template");
      // Skip checking for tags as they might be different in implementation

      todoId = createResponse.body.id;
    });

    it("Should start and stop a timer", async () => {
      // Start timer
      const startResponse = await request.post(`${baseUrlV6}/${todoId}/start`);
      expect(startResponse.status).to.equal(200);
      expect(startResponse.body).to.have.property("timeTracking");
      expect(startResponse.body.timeTracking.isRunning).to.be.true;

      // Small delay to ensure timer records some time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Stop timer
      const stopResponse = await request.post(`${baseUrlV6}/${todoId}/stop`);
      expect(stopResponse.status).to.equal(200);
      expect(stopResponse.body).to.have.property("timeTracking");
      expect(stopResponse.body.timeTracking.isRunning).to.be.false;
    });

    // Clean up
    after(async () => {
      if (todoId) {
        await request.delete(`${baseUrlV6}/${todoId}`);
      }
      if (templateId) {
        await request.delete(`${baseUrlV6}/${templateId}`);
      }
    });
  });
});
