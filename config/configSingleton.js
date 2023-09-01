const { config } = require("./config");
const { ConfigKeys } = require("./enums");

const ConfigSingleton = (function () {
  let instance;

  function createInstance() {
    const configCopy = { ...config };

    function getConfigValue(key) {
      if (configCopy[key] === undefined) {
        console.log(`> Config: Warning! Value of "${key}" is "${configCopy[key]}"`);
      }
      return configCopy[key];
    }

    function setConfigValue(key, value) {
      configCopy[key] = value;
      return configCopy[key];
    }

    function resetConfig() {
      for (const key in config) {
        if (configCopy[key] !== config[key]) {
          console.log(`> Config: Reverting: "${key}" - from "${configCopy[key]}" to "${config[key]}"`);
        }
        configCopy[key] = config[key];
      }
    }

    function selfCheck() {
      console.log("> Config: Running Self Check...");
      const emptyList = [];
      for (const key in ConfigKeys) {
        value = configCopy[ConfigKeys[key]];

        if (value === undefined) {
          emptyList.push(key);
        }
      }
      if (emptyList.length > 0) {
        throw new Error(`INVALID KEYS - there are enums but no values in config:\r\n${emptyList}\r\n`);
      }

      const keys = Object.keys(configCopy);
      const enumValues = Object.values(ConfigKeys);
      for (const key of keys) {
        if (!enumValues.includes(key)) {
          emptyList.push(key);
        }
      }
      if (emptyList.length > 0) {
        throw new Error(`INVALID KEYS - there are values in config but not in enums:\r\n${emptyList}\r\n`);
      }
      console.log("> Config: Self Check Done!");
    }

    return {
      getConfigValue,
      setConfigValue,
      resetConfig,
      ConfigKeys,
      selfCheck,
      configCopy,
    };
  }

  return {
    getInstance: function () {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    },
  };
})();

const configInstance = ConfigSingleton.getInstance();
configInstance.selfCheck();

module.exports = {
  configInstance,
  getConfigValue: configInstance.getConfigValue,
  setConfigValue: configInstance.setConfigValue,
  resetConfig: configInstance.resetConfig,
};
