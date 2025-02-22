const fs = require("fs");
const path = require("path");
const mockData = require("./learning-data.mock");

class DataProxy {
  static instance = null;

  constructor() {
    if (DataProxy.instance) {
      return DataProxy.instance;
    }

    this.dbPath = path.join(__dirname, "..", "..", "db", "db-learning-tmp.json");

    if (!fs.existsSync(this.dbPath)) {
      this.saveData(mockData);
    }

    this.initInnerProxy();

    DataProxy.instance = this;
  }

  createNestedProxy(obj, path = []) {
    return new Proxy(obj, {
      get: (target, property) => {
        // if (typeof target[property] === "object" && target[property] !== null) {
        //   return this.createNestedProxy(target[property], [...path, property]);
        // }
        return target[property];
      },
      set: (target, property, value) => {
        const currentData = this.loadData();
        let current = currentData;

        // Navigate to nested location
        for (let i = 0; i < path.length; i++) {
          if (!current[path[i]]) {
            current[path[i]] = {};
          }
          current = current[path[i]];
        }

        // Set the value
        current[property] = value;
        this.saveData(currentData);
        return true;
      },
      deleteProperty: (target, property) => {
        const currentData = this.loadData();
        let current = currentData;

        // Navigate to nested location
        for (let i = 0; i < path.length; i++) {
          current = current[path[i]];
        }

        delete current[property];
        this.saveData(currentData);
        return true;
      },
    });
  }

  initInnerProxy() {
    this.proxy = new Proxy(
      {},
      {
        get: (target, property) => {
          const data = this.loadData();
          if (typeof data[property] === "object" && data[property] !== null) {
            return this.createNestedProxy(data[property], [property]);
          }
          return data[property];
        },
        set: (target, property, value) => {
          const data = this.loadData();
          data[property] = value;
          this.saveData(data);
          return true;
        },
        deleteProperty: (target, property) => {
          const data = this.loadData();
          delete data[property];
          this.saveData(data);
          return true;
        },
      }
    );
  }

  loadData() {
    try {
      const data = JSON.parse(fs.readFileSync(this.dbPath, "utf8"));
      return this.mergeWithMockData(data);
    } catch (error) {
      console.error("Error loading data:", error);
      return { ...mockData };
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
    const result = JSON.parse(JSON.stringify(mockData)); // Deep clone
    return this.deepMerge(result, savedData);
  }

  saveData(data) {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error saving data:", error);
    }
  }

  restoreToDefault() {
    try {
      // Reset file data
      this.saveData(mockData);
      this.initInnerProxy();
      // create { key: number } object where key is root key and number is number of items in the collection
      const collections = Object.keys(mockData).reduce((acc, key) => {
        if (Array.isArray(mockData[key])) {
          acc[key] = mockData[key].length;
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
    return this.loadData();
  }

  getData() {
    return this.proxy;
  }
}

module.exports = DataProxy;
