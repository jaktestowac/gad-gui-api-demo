const { logDebug } = require("../../helpers/logger-api");

class DroneSimulatorContext {
  constructor(wss) {
    this.wss = wss;
    this.baseAreas = [
      { x: 0, y: 13, type: "landing", name: "Landing Zone" },
      { x: 0, y: 14, type: "base", name: "Home Base", chargeRate: 2 },
      { x: 1, y: 14, type: "hangar", name: "Hangar Bay" },
      { x: 2, y: 14, type: "repair", name: "Repair Station" },
      { x: 2, y: 13, type: "storage", name: "Drone Storage" },
    ];

    this.chargingAreas = [
      { x: 0, y: 14, type: "base", name: "Home Base", chargeRate: 2 },
      { x: 19, y: 14, type: "station", name: "Charging Station 1", chargeRate: 1 },
      { x: 10, y: 0, type: "station", name: "Charging Station 2", chargeRate: 1 },
      { x: 19, y: 0, type: "solar", name: "Solar Station", chargeRate: 1.5 },
      { x: 0, y: 0, type: "emergency", name: "Emergency Charger", chargeRate: 3 },
    ];

    this.drones = [
      { id: 1, x: 0, y: 14, busy: false, battery: 100, name: "Alpha", type: "Scout", speed: 2, missions: 0 },
      { id: 2, x: 1, y: 14, busy: false, battery: 100, name: "Beta", type: "Transport", speed: 1, missions: 0 },
      { id: 3, x: 0, y: 13, busy: false, battery: 100, name: "Gamma", type: "Combat", speed: 3, missions: 0 },
    ];

    this.initialDrones = [
      { id: 1, x: 0, y: 14, busy: false, battery: 100, name: "Alpha", type: "Scout", speed: 2, missions: 0 },
      { id: 2, x: 1, y: 14, busy: false, battery: 100, name: "Beta", type: "Transport", speed: 1, missions: 0 },
      { id: 3, x: 0, y: 13, busy: false, battery: 100, name: "Gamma", type: "Combat", speed: 3, missions: 0 },
    ];

    this.obstacles = [
      { x: 5, y: 5, width: 3, height: 2, type: "building", name: "Tower Block" },
      { x: 15, y: 3, width: 2, height: 4, type: "noFlyZone", name: "Restricted Area" },
      { x: 8, y: 8, width: 1, height: 3, type: "antenna", name: "Communication Tower" },
      { x: 12, y: 5, width: 2, height: 2, type: "radar", name: "Radar Station" },
      { x: 3, y: 7, width: 2, height: 2, type: "powerPlant", name: "Power Plant" },
      { x: 17, y: 8, width: 3, height: 1, type: "windFarm", name: "Wind Turbines" },
    ];

    this.mapElements = [
      { x: 3, y: 3, type: "tree", name: "Dense Forest" },
      { x: 4, y: 3, type: "tree", name: "Dense Forest" },
      { x: 3, y: 4, type: "tree", name: "Dense Forest" },
      { x: 4, y: 4, type: "tree", name: "Dense Forest" },
      { x: 12, y: 12, type: "water", name: "Lake Alpha" },
      { x: 13, y: 12, type: "water", name: "Lake Alpha" },
      { x: 12, y: 13, type: "water", name: "Lake Alpha" },
      { x: 13, y: 13, type: "water", name: "Lake Alpha" },
      { x: 7, y: 2, type: "helipad", name: "Emergency Helipad" },
      { x: 16, y: 1, type: "beacon", name: "Navigation Beacon" },
      { x: 9, y: 13, type: "warehouse", name: "Supply Warehouse" },
      { x: 18, y: 7, type: "satellite", name: "Satellite Uplink" },
      { x: 6, y: 11, type: "weather", name: "Weather Station" },
      { x: 14, y: 9, type: "turbulence", name: "Turbulent Area" },
      { x: 15, y: 9, type: "turbulence", name: "Turbulent Area" },
      { x: 16, y: 9, type: "turbulence", name: "Turbulent Area" },
      { x: 17, y: 9, type: "turbulence", name: "Turbulent Area" },
      { x: 18, y: 9, type: "turbulence", name: "Turbulent Area" },
      { x: 2, y: 9, type: "thermal", name: "Thermal Vent" },
    ];

    this.dangerZones = [
      { x: 14, y: 9, type: "turbulence", name: "Turbulent Area", riskFactor: 0.2 },
      { x: 15, y: 9, type: "turbulence", name: "Turbulent Area", riskFactor: 0.3 },
      { x: 16, y: 9, type: "turbulence", name: "Turbulent Area", riskFactor: 0.4 },
      { x: 17, y: 9, type: "turbulence", name: "Turbulent Area", riskFactor: 0.5 },
      { x: 18, y: 9, type: "turbulence", name: "Turbulent Area", riskFactor: 0.6 },
      { x: 2, y: 9, type: "thermal", name: "Thermal Vent", riskFactor: 0.2 },
      { x: 15, y: 3, width: 2, height: 4, type: "noFlyZone", name: "Restricted Area", riskFactor: 0.8 },
      { x: 17, y: 8, width: 3, height: 1, type: "windFarm", name: "Wind Turbines", riskFactor: 0.4 },
    ];

    this.moveIntervals = new Map(); // Add this to track movement intervals

    setInterval(() => {
      this.drones.forEach((drone) => {
        if (drone.busy) {
          drone.battery = Math.max(0, drone.battery - 0.5);
          this.checkDangerZone(drone);
        } else {
          const chargingArea = this.chargingAreas.find((area) => area.x === drone.x && area.y === drone.y);
          if (chargingArea) {
            drone.battery = Math.min(100, drone.battery + chargingArea.chargeRate);
            this.broadcastDronePositions();
          }
        }
      });
    }, 1000);
  }

  checkDangerZone(drone) {
    for (const zone of this.dangerZones) {
      const inZone = zone.width
        ? drone.x >= zone.x && drone.x < zone.x + zone.width && drone.y >= zone.y && drone.y < zone.y + zone.height
        : drone.x === zone.x && drone.y === zone.y;

      if (inZone && Math.random() < zone.riskFactor) {
        this.destroyDrone(drone, zone);
        break;
      }
    }
  }

  destroyDrone(drone, zone) {
    this.broadcastError(drone.id, `Drone ${drone.name} was lost in ${zone.name}!`);
    this.drones = this.drones.filter((d) => d.id !== drone.id);
    this.broadcastDronePositions();
  }

  updateDrone(droneId, x, y) {
    const drone = this.drones.find((d) => d.id === droneId);
    if (drone) {
      drone.x = x;
      drone.y = y;
      this.broadcastDronePositions();
    }
  }

  broadcastDronePositions() {
    const message = JSON.stringify({
      type: "practiceDronePositions",
      drones: this.drones,
      chargingAreas: this.chargingAreas,
      baseAreas: this.baseAreas,
      obstacles: this.obstacles,
      mapElements: this.mapElements,
      dangerZones: this.dangerZones,
    });
    this.wss.clients.forEach((client) => client.send(message));
  }

  isValidPosition(x, y) {
    if (x < 0 || x >= 20 || y < 0 || y >= 15) return false;

    for (const obstacle of this.obstacles) {
      if (x >= obstacle.x && x < obstacle.x + obstacle.width && y >= obstacle.y && y < obstacle.y + obstacle.height) {
        return false;
      }
    }
    return true;
  }

  isValidPath(startX, startY, endX, endY) {
    if (!this.isValidPosition(endX, endY)) return false;

    const dx = Math.sign(endX - startX);
    const dy = Math.sign(endY - startY);
    let currentX = startX;
    let currentY = startY;

    while (currentX !== endX || currentY !== endY) {
      if (currentX !== endX) {
        if (!this.isValidPosition(currentX + dx, currentY)) {
          return false;
        }
        currentX += dx;
      }
      if (currentY !== endY) {
        if (!this.isValidPosition(currentX, currentY + dy)) {
          return false;
        }
        currentY += dy;
      }
    }
    return true;
  }

  isValidDiagonalMove(x1, y1, x2, y2) {
    return this.isValidPosition(x1, y2) && this.isValidPosition(x2, y1);
  }

  findPath(startX, startY, endX, endY) {
    const MAX_PATH_LENGTH = 100; // Maximum allowed path length
    const MAX_ITERATIONS = 1000; // Maximum allowed iterations
    let iterations = 0;

    const openSet = [{ x: startX, y: startY, g: 0, h: 0, f: 0, parent: null }];
    const closedSet = new Set();
    const getKey = (x, y) => `${x},${y}`;

    while (openSet.length > 0) {
      iterations++;
      if (iterations > MAX_ITERATIONS) {
        logDebug("[DroneSimulator] Path finding exceeded maximum iterations");
        return null;
      }

      let current = openSet.reduce((min, node) => (node.f < min.f ? node : min), openSet[0]);
      openSet.splice(openSet.indexOf(current), 1);
      closedSet.add(getKey(current.x, current.y));

      if (current.x === endX && current.y === endY) {
        const path = [];
        while (current) {
          path.unshift({ x: current.x, y: current.y });
          current = current.parent;
        }

        if (path.length > MAX_PATH_LENGTH) {
          logDebug("[DroneSimulator] Path exceeds maximum length");
          return null;
        }

        return path;
      }

      const neighbors = [
        { x: current.x, y: current.y - 1, cost: 1 }, // Up
        { x: current.x + 1, y: current.y - 1, cost: 1.4 }, // Up-Right
        { x: current.x + 1, y: current.y, cost: 1 }, // Right
        { x: current.x + 1, y: current.y + 1, cost: 1.4 }, // Down-Right
        { x: current.x, y: current.y + 1, cost: 1 }, // Down
        { x: current.x - 1, y: current.y + 1, cost: 1.4 }, // Down-Left
        { x: current.x - 1, y: current.y, cost: 1 }, // Left
        { x: current.x - 1, y: current.y - 1, cost: 1.4 }, // Up-Left
      ];

      for (const neighbor of neighbors) {
        if (!this.isValidPosition(neighbor.x, neighbor.y)) continue;
        if (neighbor.cost > 1 && !this.isValidDiagonalMove(current.x, current.y, neighbor.x, neighbor.y)) continue;
        if (closedSet.has(getKey(neighbor.x, neighbor.y))) continue;

        const g = current.g + neighbor.cost;
        const h = Math.sqrt(Math.pow(endX - neighbor.x, 2) + Math.pow(endY - neighbor.y, 2));
        const f = g + h;

        const existing = openSet.find((node) => node.x === neighbor.x && node.y === neighbor.y);
        if (!existing) {
          openSet.push({ x: neighbor.x, y: neighbor.y, g, h, f, parent: current });
        } else if (g < existing.g) {
          existing.g = g;
          existing.f = f;
          existing.parent = current;
        }
      }
    }

    return null;
  }

  movePracticeDrone(droneId, x, y) {
    const drone = this.drones.find((d) => d.id === droneId);
    if (drone) {
      // Clear existing movement if any
      if (this.moveIntervals.has(droneId)) {
        clearInterval(this.moveIntervals.get(droneId));
        this.moveIntervals.delete(droneId);
      }

      if (!drone.battery > 10) {
        this.broadcastError(droneId, "Insufficient battery for movement");
        return;
      }

      // Check if destination is in a danger zone
      const dangerZone = this.dangerZones.find((zone) =>
        zone.width
          ? x >= zone.x && x < zone.x + zone.width && y >= zone.y && y < zone.y + zone.height
          : x === zone.x && y === zone.y
      );

      if (dangerZone) {
        this.broadcastError(
          droneId,
          `Warning: Moving into ${dangerZone.name} - Risk factor ${Math.round(dangerZone.riskFactor * 100)}%`
        );
      }

      const path = this.findPath(drone.x, drone.y, x, y);
      if (!path) {
        this.broadcastError(droneId, "Cannot find a valid path to destination");
        return;
      }

      drone.busy = true;
      drone.missions++;
      let pathIndex = 1;

      const moveInterval = setInterval(() => {
        if (drone.battery <= 10) {
          clearInterval(moveInterval);
          this.moveIntervals.delete(droneId);
          drone.busy = false;
          this.broadcastError(droneId, "Mission aborted: Low battery");
          this.broadcastDronePositions();
          return;
        }

        if (pathIndex >= path.length) {
          clearInterval(moveInterval);
          this.moveIntervals.delete(droneId);
          drone.busy = false;
          this.broadcastDronePositions();
          return;
        }

        const nextPos = path[pathIndex];
        const isDiagonal = nextPos.x !== drone.x && nextPos.y !== drone.y;
        drone.x = nextPos.x;
        drone.y = nextPos.y;

        drone.battery -= isDiagonal ? 0.7 : 0.5;
        pathIndex++;

        this.broadcastDronePositions();
      }, 500);

      this.moveIntervals.set(droneId, moveInterval);
    }
  }

  resetSimulator() {
    // Clear all ongoing movements
    this.moveIntervals.forEach((interval) => clearInterval(interval));
    this.moveIntervals.clear();

    // Reset drones to initial state
    this.drones = this.initialDrones.map((drone) => ({ ...drone }));
    this.broadcastDronePositions();
  }

  broadcastError(droneId, message) {
    const errorMessage = JSON.stringify({
      type: "practiceDroneError",
      droneId,
      message,
    });
    this.wss.clients.forEach((client) => client.send(errorMessage));
  }
}

const droneHandlers = {
  getPracticeDronePositions: (context, ws) => {
    context.broadcastDronePositions();
  },

  getPracticeDrones: (context, ws) => {
    context.broadcastDronePositions();
  },

  movePracticeDrone: (context, ws, data) => {
    const { droneId, x, y } = data;
    context.movePracticeDrone(droneId, x, y);
  },

  simulatorPracticeDroneReset: (context, ws) => {
    context.resetSimulator();
    ws.send(
      JSON.stringify({
        type: "simulatorPracticeDroneReset",
        message: "Simulator has been reset",
      })
    );
  },
};

module.exports = { DroneSimulatorContext, droneHandlers };
