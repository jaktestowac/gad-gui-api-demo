const WebSocket = require("ws");
const { gracefulQuit, setupEnv } = require("../helpers/helpers.js");
const { expect, serverWsAddress } = require("../config.js");

describe("Websocket base tests", async () => {
  let ws;

  beforeEach(async () => {
    await setupEnv();
    ws = new WebSocket(serverWsAddress);
    await new Promise((resolve) => ws.on("open", resolve));
  });

  afterEach(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  });

  after(() => {
    gracefulQuit();
  });

  it("should successfully connect to websocket server", async () => {
    expect(ws.readyState).to.equal(WebSocket.OPEN);
  });

  it("should send and receive messages", (done) => {
    const testMessage = JSON.stringify({
      type: "ping",
    });

    ws.on("message", (data) => {
      const obj = JSON.parse(data.toString());
      expect(obj, JSON.stringify(obj)).to.have.property("type");
      expect(obj, JSON.stringify(obj)).to.have.property("data");
      expect(obj.data, JSON.stringify(obj)).to.have.property("version");
      done();
    });

    ws.send(testMessage);
  });

  it("should handle connection closure properly", (done) => {
    ws.on("close", () => {
      expect(ws.readyState).to.equal(WebSocket.CLOSED);
      done();
    });

    ws.close();
  });

  it("should handle invalid message type", (done) => {
    const testMessage = JSON.stringify({
      type: "invalid type",
    });

    ws.on("message", (data) => {
      const obj = JSON.parse(data.toString());
      expect(obj, JSON.stringify(obj)).to.have.property("type", "error");
      expect(obj.data, JSON.stringify(obj)).to.have.property("message");
      done();
    });

    ws.send(testMessage);
  });

  it("should reconnect after connection loss", async () => {
    await new Promise((resolve) => {
      ws.close();
      ws = new WebSocket(serverWsAddress);
      ws.on("open", () => {
        expect(ws.readyState).to.equal(WebSocket.OPEN);
        resolve();
      });
    });
  });

  describe("Message type smoke tests", async () => {
    it("should handle weather messages", async () => {
      const messages = [{ type: "getWeather" }, { type: "getFullWeather" }];

      ws.on("message", (data) => {
        const response = JSON.parse(data.toString());
        expect(response, JSON.stringify(response)).to.have.property("type");
        expect(response, JSON.stringify(response)).to.have.property("weather");
      });

      messages.forEach((msg) => ws.send(JSON.stringify(msg)));
    });

    it("should handle cinema messages", async () => {
      const message = {
        type: "cinemaGetRooms",
      };

      ws.on("message", (data) => {
        const response = JSON.parse(data.toString());
        expect(response, JSON.stringify(response)).to.have.property("type");
        expect(response, JSON.stringify(response)).to.have.property("rooms");
      });

      ws.send(JSON.stringify(message));
    });

    it("should handle practice chat messages", async () => {
      const message = {
        type: "practiceChatJoin",
        data: { message: "test message" },
      };

      ws.on("message", (data) => {
        const response = JSON.parse(data.toString());
        expect(response, JSON.stringify(response)).to.have.property("type");
        expect(response.data, JSON.stringify(response)).to.have.property("message");
      });

      ws.send(JSON.stringify(message));
    });

    it("should handle document editor messages", async () => {
      const message = {
        type: "docCreate",
      };

      ws.on("message", (data) => {
        const response = JSON.parse(data.toString());
        expect(response, JSON.stringify(response)).to.have.property("type");
        expect(response, JSON.stringify(response)).to.have.property("title");
      });

      ws.send(JSON.stringify(message));
    });

    it("should handle drone simulator messages", async () => {
      const message = {
        type: "getPracticeDronePositions",
      };

      ws.on("message", (data) => {
        const response = JSON.parse(data.toString());
        expect(response, JSON.stringify(response)).to.have.property("type");
        expect(response, JSON.stringify(response)).to.have.property("drones");
      });

      ws.send(JSON.stringify(message));
    });
  });

  describe("Error handling", () => {
    it("should handle malformed JSON", (done) => {
      ws.on("message", (data) => {
        const response = JSON.parse(data.toString());
        expect(response.type).to.equal("error");
        expect(response.data).to.have.property("message");
        expect(response.data.message).to.include("Malformed JSON");
        done();
      });

      ws.send("malformed json{");
    });

    it("should handle empty messages", (done) => {
      ws.on("message", (data) => {
        const response = JSON.parse(data.toString());
        expect(response.type).to.equal("error");
        expect(response.data).to.have.property("message");
        expect(response.data.message).to.include("Invalid message format");
        done();
      });

      ws.send("");
    });

    it("should handle missing type field", (done) => {
      ws.on("message", (data) => {
        const response = JSON.parse(data.toString());
        expect(response.type).to.equal("error");
        expect(response.data).to.have.property("message");
        expect(response.data.message).to.include("Missing type");
        done();
      });

      ws.send(JSON.stringify({ data: "test" }));
    });
  });

  describe("Connection handling", () => {
    it("should handle multiple concurrent connections", async () => {
      const connections = Array(5)
        .fill(null)
        .map(() => new WebSocket(serverWsAddress));
      await Promise.all(connections.map((conn) => new Promise((resolve) => conn.on("open", resolve))));

      connections.forEach((conn) => {
        expect(conn.readyState).to.equal(WebSocket.OPEN);
      });

      connections.forEach((conn) => conn.close());
    });

    it("should maintain session after reconnect", async () => {
      const testMessage = JSON.stringify({ type: "ping" });

      // First connection
      await new Promise((resolve) => {
        ws.on("message", (data) => {
          const response = JSON.parse(data.toString());
          expect(response.type).to.equal("pong");
          resolve();
        });
        ws.send(testMessage);
      });

      // Reconnect
      ws.close();
      ws = new WebSocket(serverWsAddress);
      await new Promise((resolve) => ws.on("open", resolve));

      // Test after reconnect
      await new Promise((resolve) => {
        ws.on("message", (data) => {
          const response = JSON.parse(data.toString());
          expect(response.type).to.equal("pong");
          resolve();
        });
        ws.send(testMessage);
      });
    });
  });

  describe("Message format validation", () => {
    it("should handle binary messages", (done) => {
      ws.on("message", (data) => {
        const response = JSON.parse(data.toString());
        expect(response.type).to.equal("error");
        expect(response.data.message).to.include("Invalid message format");
        done();
      });

      const buffer = Buffer.from([1, 2, 3, 4]);
      ws.send(buffer);
    });
  });

  describe("Service specific messages", () => {
    it("should handle weather subscription messages", (done) => {
      const message = {
        type: "getWeather",
        data: { location: "London" },
      };

      ws.on("message", (data) => {
        const response = JSON.parse(data.toString());
        expect(response.type, JSON.stringify(response)).to.equal("weatherData");
        expect(response, JSON.stringify(response)).to.have.property("weather");
        done();
      });

      ws.send(JSON.stringify(message));
    });

    it("should handle chat room messages", (done) => {
      const message = {
        type: "practiceChatJoin",
        username: "TestUser",
        version: "v1",
      };

      let messageCount = 0;
      ws.on("message", (data) => {
        const response = JSON.parse(data.toString());

        if (messageCount === 0) {
          expect(response.type, JSON.stringify(response)).to.equal("practiceChatMessage");
          expect(response.message, JSON.stringify(response)).to.include("joined");
          messageCount++;
        } else {
          expect(response.type, JSON.stringify(response)).to.equal("practiceChatUserList");
          expect(response.users, JSON.stringify(response)).to.not.be.empty;
          done();
        }
      });

      ws.send(JSON.stringify(message));
    });
  });
});
