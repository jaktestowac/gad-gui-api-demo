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
      expect(obj, JSON.stringify(obj)).to.have.property("message");
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
        expect(response, JSON.stringify(response)).to.have.property("message");
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
});
