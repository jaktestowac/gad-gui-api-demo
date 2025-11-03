const fs = require("fs");
const path = require("path");
const defaultMockData = require("./learning-data.mock");

class DataProxy {
  static instance = null;
  static saveLock = false; // Simple in-memory lock for file saves

  constructor(mockDataSource = defaultMockData, dbName = "db-learning-tmp.json") {
    if (DataProxy.instance) {
      return DataProxy.instance;
    }

    this.setMockDataSource(mockDataSource);
    this.dbPath = path.join(__dirname, "..", "..", "db", dbName);

    // Keep data in memory
    this.memoryData = null;
    this.isInitialized = false;

    this.initInnerProxy();

    DataProxy.instance = this;
  }

  // Initialize memory data from mock or saved data
  initializeMemoryData() {
    if (this.isInitialized) {
      return this.memoryData;
    }

    try {
      // Try to load from saved file first
      if (fs.existsSync(this.dbPath)) {
        const fileContent = fs.readFileSync(this.dbPath, "utf8");
        if (fileContent && fileContent.trim() !== "") {
          const savedData = JSON.parse(fileContent);
          this.memoryData = this.mergeWithMockData(savedData);
        } else {
          this.memoryData = { ...this.mockDataSource };
          console.log("File was empty, using mock data");
        }
      } else {
        this.memoryData = { ...this.mockDataSource };
        console.log("No saved file found, using mock data");
      }
    } catch (error) {
      console.error("Error loading saved data, using mock data:", error);
      this.memoryData = { ...this.mockDataSource };
    }

    this.isInitialized = true;
    return this.memoryData;
  }

  createNestedProxy(obj, path = []) {
    return new Proxy(obj, {
      get: (target, property) => {
        return target[property];
      },
      set: (target, property, value) => {
        // Update memory data
        let current = this.memoryData;

        // Navigate to nested location
        for (let i = 0; i < path.length; i++) {
          if (!current[path[i]]) {
            current[path[i]] = {};
          }
          current = current[path[i]];
        }

        // Set the value in memory
        try {
          current[property] = value;
        } catch (error) {
          // TODO: workaround for Proxy set errors
          // TODO: concurrent modification detected, handle appropriately
          return false;
        }

        // Persist to file
        this.persistToFile();
        return true;
      },
      deleteProperty: (target, property) => {
        // Update memory data
        let current = this.memoryData;

        // Navigate to nested location
        for (let i = 0; i < path.length; i++) {
          current = current[path[i]];
        }

        delete current[property];

        // Persist to file
        this.persistToFile();
        return true;
      },
    });
  }

  initInnerProxy() {
    this.proxy = new Proxy(
      {},
      {
        get: (target, property) => {
          const data = this.getMemoryData();
          if (typeof data[property] === "object" && data[property] !== null) {
            return this.createNestedProxy(data[property], [property]);
          }
          return data[property];
        },
        set: (target, property, value) => {
          const data = this.getMemoryData();
          data[property] = value;
          this.memoryData = data;

          // Persist to file
          this.persistToFile();
          return true;
        },
        deleteProperty: (target, property) => {
          const data = this.getMemoryData();
          delete data[property];
          this.memoryData = data;

          // Persist to file
          this.persistToFile();
          return true;
        },
      }
    );
  }

  getMemoryData() {
    if (!this.isInitialized) {
      return this.initializeMemoryData();
    }
    return this.memoryData;
  }

  persistToFile() {
    // Use simple in-memory lock to prevent concurrent writes
    if (DataProxy.saveLock) {
      console.log("Save already in progress, skipping...");
      return;
    }

    DataProxy.saveLock = true;

    try {
      const jsonString = JSON.stringify(this.memoryData, null, 2);
      fs.writeFileSync(this.dbPath, jsonString, "utf8");
    } catch (error) {
      console.error("Error persisting data to file:", error);

      // Try to save to a backup file
      try {
        const backupPath = this.dbPath + ".backup";
        fs.writeFileSync(backupPath, JSON.stringify(this.memoryData, null, 2), "utf8");
        console.log("Saved backup to:", backupPath);
      } catch (backupError) {
        console.error("Failed to save backup:", backupError);
      }
    } finally {
      DataProxy.saveLock = false;
    }
  }

  deepMerge(target, source) {
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === "object") {
        if (Array.isArray(source[key])) {
          target[key] = [...source[key]];
        } else {
          if (!target[key]) {
            target[key] = {};
          }
          this.deepMerge(target[key], source[key]);
        }
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  mergeWithMockData(savedData) {
    const result = JSON.parse(JSON.stringify(this.mockDataSource)); // Deep clone
    return this.deepMerge(result, savedData);
  }

  setMockDataSource(mockDataSource) {
    this.mockDataSource = mockDataSource;
    return this;
  }

  restoreToDefault() {
    try {
      // Reset memory data to mock data
      this.memoryData = { ...this.mockDataSource };
      this.isInitialized = true;

      // Persist to file
      this.persistToFile();

      // create { key: number } object where key is root key and number is number of items in the collection
      const collections = Object.keys(this.mockDataSource).reduce((acc, key) => {
        if (Array.isArray(this.mockDataSource[key])) {
          acc[key] = this.mockDataSource[key].length;
        }
        return acc;
      }, {});

      return { success: true, collections };
    } catch (error) {
      console.error("Error restoring data:", error);
      throw new Error("Failed to restore database");
    }
  }

  getAllData() {
    return this.getMemoryData();
  }

  getData() {
    return this.proxy;
  }

  static resetInstance() {
    DataProxy.instance = null;
  }

  static resetAndReinitialize(mockDataSource = defaultMockData, dbName = "db-learning-tmp.json") {
    DataProxy.resetInstance();
    return new DataProxy(mockDataSource, dbName);
  }

  clearAndReinitialize() {
    this.memoryData = null;
    this.isInitialized = false;
    return this.initializeMemoryData();
  }
}

module.exports = DataProxy;
