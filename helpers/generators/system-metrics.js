const { RandomValueGeneratorWithSeed } = require("./random-data.generator");
const { logDebug } = require("../logger-api");

const DISK_STATES = {
  HEALTHY: { label: "Healthy", color: "green" },
  WARNING: { label: "Warning", color: "yellow" },
  CRITICAL: { label: "Critical", color: "red" },
};

const PROCESS_STATES = {
  RUNNING: { label: "Running", color: "green" },
  SLEEPING: { label: "Sleeping", color: "blue" },
  STOPPED: { label: "Stopped", color: "yellow" },
  ZOMBIE: { label: "Zombie", color: "red" },
};

const GPU_VENDORS = ["NVIDIA", "AMD", "Intel"];
const PROCESS_TYPES = ["System", "User", "Background", "Service"];

const SERVICE_STATES = {
  RUNNING: { label: "Running", color: "green", healthScore: 100 },
  DEGRADED: { label: "Degraded", color: "yellow", healthScore: 50 },
  FAILED: { label: "Failed", color: "red", healthScore: 0 },
  STARTING: { label: "Starting", color: "blue", healthScore: 75 },
  STOPPING: { label: "Stopping", color: "orange", healthScore: 25 },
};

const PROCESS_PRIORITIES = {
  IDLE: { level: -15, label: "Idle" },
  LOW: { level: -5, label: "Low" },
  NORMAL: { level: 0, label: "Normal" },
  HIGH: { level: 5, label: "High" },
  REALTIME: { level: 15, label: "Realtime" },
};

const COMMON_SERVICES = [
  { name: "httpd", type: "Web Server" },
  { name: "mysqld", type: "Database" },
  { name: "sshd", type: "Remote Access" },
  { name: "docker", type: "Container Runtime" },
  { name: "nginx", type: "Web Server" },
  { name: "postgresql", type: "Database" },
  { name: "redis", type: "Cache" },
  { name: "mongodb", type: "Database" },
];

const currentTime = Math.floor(Date.now() / 1000);

const metricState = {
  lastValues: new Map(),
  baseValues: new Map(),
  trends: new Map(),
};

function getSmoothedValue(key, currentValue, maxChange = 5, minValue = 0, maxValue = 100) {
  const lastValue = metricState.lastValues.get(key) ?? currentValue;
  const baseValue = metricState.baseValues.get(key) ?? currentValue;
  let trend = metricState.trends.get(key) ?? (Math.random() > 0.5 ? 1 : -1);

  let newValue = lastValue + trend * (Math.random() * maxChange);

  if (newValue > maxValue || newValue < minValue || Math.abs(newValue - baseValue) > maxValue * 0.3) {
    trend *= -1;
    metricState.trends.set(key, trend);
    metricState.baseValues.set(key, lastValue);
  }

  newValue = Math.max(minValue, Math.min(maxValue, newValue));

  metricState.lastValues.set(key, newValue);
  return Math.round(newValue * 100) / 100;
}

function generateSystemMetrics(timestamp = Date.now(), additionalSeed = "") {
  const generator = new RandomValueGeneratorWithSeed(timestamp + additionalSeed);

  const baseUptime = new RandomValueGeneratorWithSeed(additionalSeed || "base-uptime").getNextValue(0, 86400 * 30);

  const uptime = currentTime - baseUptime;

  const cpuCores = 8;
  const cpuMetrics = {
    usage: {
      total: getSmoothedValue("cpu.total", generator.getNextValue(20, 85), 2),
      cores: Array(cpuCores)
        .fill(0)
        .map((_, i) => getSmoothedValue(`cpu.core.${i}`, generator.getNextValue(15, 90), 3)),
    },
    temperature: getSmoothedValue("cpu.temp", generator.getNextValue(35, 75), 1),
    frequency: {
      current: getSmoothedValue("cpu.freq", generator.getNextValue(2000, 4000), 100, 2000, 4000),
      base: 2400,
      max: 4000,
    },
    processes: getSmoothedValue("processes", generator.getNextValue(100, 300), 5, 100, 300),
  };

  const totalMemory = 16384;
  const memoryMetrics = {
    total: totalMemory,
    used: getSmoothedValue("memory.used", generator.getNextValue(4096, 12288), 256, 1024, totalMemory),
    cached: getSmoothedValue("memory.cached", generator.getNextValue(1024, 4096), 128),
    buffers: getSmoothedValue("memory.buffers", generator.getNextValue(512, 2048), 64),
  };
  memoryMetrics.free = totalMemory - memoryMetrics.used;
  memoryMetrics.percentage = Math.round((memoryMetrics.used / totalMemory) * 100);

  const diskMetrics = {
    reads: generator.getNextValue(50, 200),
    writes: generator.getNextValue(20, 150),
    volumes: [
      {
        name: "C:",
        total: 512000,
        used: generator.getNextValue(256000, 460800),
        type: "SSD",
        status: DISK_STATES.HEALTHY,
      },
      {
        name: "D:",
        total: 1024000,
        used: generator.getNextValue(512000, 921600),
        type: "HDD",
        status: DISK_STATES.HEALTHY,
      },
      {
        name: "E:",
        total: 2048000,
        used: generator.getNextValue(1024000, 1843200),
        type: "SSD",
        status: DISK_STATES.HEALTHY,
      },
      {
        name: "F:",
        total: 2048000,
        used: generator.getNextValue(1024000, 1843200),
        type: "SSD",
        status: DISK_STATES.HEALTHY,
      },
    ],
  };

  diskMetrics.volumes = diskMetrics.volumes.map((volume) => {
    const usagePercent = (volume.used / volume.total) * 100;
    let status = DISK_STATES.HEALTHY;

    if (usagePercent > 90) {
      status = DISK_STATES.CRITICAL;
    } else if (usagePercent > 80) {
      status = DISK_STATES.WARNING;
    }

    return {
      ...volume,
      percentage: Math.round(usagePercent),
      status,
    };
  });

  const networkMetrics = {
    interfaces: [
      {
        name: "eth0",
        bytesReceived: generator.getNextValue(1024 * 1024, 10 * 1024 * 1024),
        bytesSent: generator.getNextValue(512 * 1024, 5 * 1024 * 1024),
        packetsReceived: generator.getNextValue(1000, 5000),
        packetsSent: generator.getNextValue(800, 4000),
        errors: generator.getNextValue(0, 5),
        dropped: generator.getNextValue(0, 10),
      },
      {
        name: "wlan0",
        bytesReceived: generator.getNextValue(512 * 1024, 5 * 1024 * 1024),
        bytesSent: generator.getNextValue(256 * 1024, 2.5 * 1024 * 1024),
        packetsReceived: generator.getNextValue(500, 2500),
        packetsSent: generator.getNextValue(400, 2000),
        errors: generator.getNextValue(0, 10),
        dropped: generator.getNextValue(0, 20),
      },
    ],
    connections: generator.getNextValue(50, 200),
  };

  const gpuMetrics = {
    cards: [
      {
        model: "RTX 3080",
        vendor: GPU_VENDORS[0],
        usage: generator.getNextValue(0, 100),
        temperature: generator.getNextValue(30, 85),
        fanSpeed: generator.getNextValue(0, 100),
        memoryUsed: generator.getNextValue(1024, 8192),
        memoryTotal: 10240,
        powerDraw: generator.getNextValue(100, 320),
        clockSpeed: {
          core: generator.getNextValue(1500, 2100),
          memory: generator.getNextValue(7000, 10000),
        },
        drivers: "527.56",
      },
    ],
    encoderUsage: generator.getNextValue(0, 100),
    decoderUsage: generator.getNextValue(0, 100),
  };

  const processMetrics = {
    total: generator.getNextValue(100, 300),
    byState: {
      running: generator.getNextValue(10, 50),
      sleeping: generator.getNextValue(50, 200),
      stopped: generator.getNextValue(0, 5),
      zombie: generator.getNextValue(0, 2),
    },
    topCpu: Array(5)
      .fill(0)
      .map(() => ({
        name: `Process${generator.getNextValue(1, 999)}`,
        cpu: generator.getNextValue(0, 100),
        memory: generator.getNextValue(50, 500),
        type: PROCESS_TYPES[generator.getNextValue(0, PROCESS_TYPES.length - 1)],
        state: Object.values(PROCESS_STATES)[generator.getNextValue(0, 3)],
        threads: generator.getNextValue(1, 32),
        pid: generator.getNextValue(1000, 9999),
      })),
    threadCount: generator.getNextValue(1000, 3000),
    details: {
      byPriority: Object.keys(PROCESS_PRIORITIES).reduce((acc, priority) => {
        acc[priority.toLowerCase()] = generator.getNextValue(5, 50);
        return acc;
      }, {}),
      byUser: {
        root: generator.getNextValue(10, 30),
        system: generator.getNextValue(20, 50),
        user: generator.getNextValue(50, 200),
      },
      resourceIntensive: Array(5)
        .fill(0)
        .map(() => ({
          name: `Process${generator.getNextValue(1, 999)}`,
          pid: generator.getNextValue(1000, 9999),
          cpu: generator.getNextValue(0, 100),
          memory: generator.getNextValue(50, 2000),
          diskIO: generator.getNextValue(0, 100),
          networkIO: generator.getNextValue(0, 100),
          priority: Object.values(PROCESS_PRIORITIES)[generator.getNextValue(0, 4)],
          threads: generator.getNextValue(1, 64),
          openFiles: generator.getNextValue(10, 1000),
          uptime: generator.getNextValue(0, 86400 * 30),
        })),
    },
  };

  const serviceMetrics = {
    total: generator.getNextValue(50, 150),
    running: generator.getNextValue(40, 120),
    stopped: generator.getNextValue(0, 10),
    failed: generator.getNextValue(0, 5),
    services: COMMON_SERVICES.map((service) => ({
      ...service,
      state: Object.values(SERVICE_STATES)[generator.getNextValue(0, 4)],
      pid: generator.getNextValue(1000, 9999),
      uptime: generator.getNextValue(0, 86400 * 30),
      restarts: generator.getNextValue(0, 5),
      memoryUsage: generator.getNextValue(50, 500),
      cpuUsage: generator.getNextValue(0, 100),
      threadCount: generator.getNextValue(1, 32),
      connections: generator.getNextValue(0, 1000),
      responseTime: generator.getNextValue(1, 1000),
      errorRate: generator.getNextValue(0, 5),
    })),
    health: {
      overall: generator.getNextValue(0, 100),
      metrics: {
        availability: generator.getNextValue(90, 100),
        responseTime: generator.getNextValue(80, 100),
        errorRate: generator.getNextValue(90, 100),
        resourceUsage: generator.getNextValue(70, 100),
      },
    },
  };

  const storageMetrics = {
    iops: {
      read: generator.getNextValue(100, 1000),
      write: generator.getNextValue(50, 500),
    },
    bandwidth: {
      read: generator.getNextValue(50 * 1024 * 1024, 500 * 1024 * 1024),
      write: generator.getNextValue(20 * 1024 * 1024, 200 * 1024 * 1024),
    },
    latency: {
      read: generator.getNextValue(0.1, 10),
      write: generator.getNextValue(0.1, 10),
    },
    queueDepth: generator.getNextValue(0, 32),
  };

  const powerMetrics = {
    total: generator.getNextValue(200, 650),
    components: {
      cpu: generator.getNextValue(65, 125),
      gpu: generator.getNextValue(100, 320),
      memory: generator.getNextValue(10, 30),
      storage: generator.getNextValue(5, 15),
      fans: generator.getNextValue(5, 20),
    },
    temperature: {
      chassis: generator.getNextValue(25, 45),
      psu: generator.getNextValue(30, 50),
    },
    efficiency: generator.getNextValue(80, 95),
  };

  const resourceLimits = {
    maxProcesses: 32768,
    maxOpenFiles: 1048576,
    maxThreads: 16384,
    currentUsage: {
      processes: processMetrics.total,
      openFiles: generator.getNextValue(1000, 100000),
      threads: processMetrics.threadCount,
    },
  };

  const timeFromTimestampISO = new Date(timestamp).toISOString();
  return {
    timestamp,
    time: timeFromTimestampISO,
    cpu: cpuMetrics,
    memory: memoryMetrics,
    disk: diskMetrics,
    network: networkMetrics,
    gpu: gpuMetrics,
    processes: processMetrics,
    services: serviceMetrics,
    storage: storageMetrics,
    power: powerMetrics,
    resourceLimits,
    schedulerMetrics: {
      contextSwitches: generator.getNextValue(1000, 10000),
      interrupts: generator.getNextValue(500, 5000),
      softInterrupts: generator.getNextValue(300, 3000),
      kernelTime: generator.getNextValue(0, 100),
      userTime: generator.getNextValue(0, 100),
      idleTime: generator.getNextValue(0, 100),
      loadAverage: {
        "1min": generator.getNextValue(0, 8),
        "5min": generator.getNextValue(0, 6),
        "15min": generator.getNextValue(0, 4),
      },
    },
    uptime: Math.max(0, uptime),
  };
}

function generateSystemMetricsResponse(samples = 1, interval = 1000, simplified = false) {
  const metrics = [];
  const baseTimestamp = Date.now() - samples * interval;
  const consistencySeed = Date.now().toString();

  const lastRequestTime = metricState.lastValues.get("lastRequestTime") || 0;
  const timeSinceLastRequest = Date.now() - lastRequestTime;
  if (timeSinceLastRequest > 10000) {
    metricState.lastValues.clear();
    metricState.baseValues.clear();
    metricState.trends.clear();
  }
  metricState.lastValues.set("lastRequestTime", Date.now());

  for (let i = 0; i < samples; i++) {
    const timestamp = baseTimestamp + i * interval;
    const timeFromTimestampISO = new Date(timestamp).toISOString();
    const metric = generateSystemMetrics(timestamp, consistencySeed);

    if (simplified) {
      metrics.push({
        timestamp,
        time: timeFromTimestampISO,
        cpu: metric.cpu.usage.total,
        memory: metric.memory.percentage,
        disk: Math.max(...metric.disk.volumes.map((v) => v.percentage)),
        network: {
          bytesReceived: metric.network.interfaces.reduce((sum, iface) => sum + iface.bytesReceived, 0),
          bytesSent: metric.network.interfaces.reduce((sum, iface) => sum + iface.bytesSent, 0),
        },
      });
    } else {
      metrics.push(metric);
    }
  }

  return metrics;
}

module.exports = {
  generateSystemMetrics,
  generateSystemMetricsResponse,
  DISK_STATES,
  PROCESS_STATES,
  GPU_VENDORS,
  PROCESS_TYPES,
  SERVICE_STATES,
  PROCESS_PRIORITIES,
  COMMON_SERVICES,
};
