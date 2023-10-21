/* eslint-disable no-console */
const { config, configToModify } = require("./config-general");
const { bugConfig } = require("./config-bugs");
const { ConfigKeys, BugConfigKeys } = require("./enums");

const ConfigManager = (function () {
  let instance;

  function createInstance() {
    const configCopy = { ...config };
    const configToModifyCopy = { ...configToModify };
    const bugConfigCopy = { ...bugConfig };

    function getConfigValue(key) {
      const tmpConfig = { ...configToModifyCopy, ...configCopy };

      if (tmpConfig[key] === undefined) {
        console.log(`> Config: Warning! Value of "${key}" is "${tmpConfig[key]}"`);
      }
      return tmpConfig[key];
    }

    function getBugConfigValue(key) {
      if (bugConfigCopy[key] === undefined) {
        console.log(`> BugConfig: Warning! Value of "${key}" is "${bugConfigCopy[key]}"`);
      }
      return bugConfigCopy[key];
    }

    function setConfigValue(key, value) {
      configToModifyCopy[key] = value;
      return configToModifyCopy[key];
    }

    function setBugConfigValue(key, value) {
      bugConfigCopy[key] = value;
      return bugConfigCopy[key];
    }

    function resetConfig() {
      reset(configCopy, config);
      reset(configToModifyCopy, configToModify);
      reset(bugConfigCopy, bugConfig);
    }

    function reset(configCopy, config) {
      for (const key in config) {
        if (configCopy[key] !== config[key]) {
          console.log(`> Config: Reverting: "${key}" - from "${configCopy[key]}" to "${config[key]}"`);
        }
        configCopy[key] = config[key];
      }
    }

    function fullSelfCheck() {
      const tmpConfig = { ...configToModifyCopy, ...configCopy };
      selfCheck(ConfigKeys, tmpConfig, "Config");
      selfCheck(BugConfigKeys, bugConfigCopy, "BugConfig");
    }

    function selfCheck(configKeys, configCopy, msg) {
      console.log(`> ${msg}: Running Self Check...`);
      const emptyList = [];
      for (const key in configKeys) {
        let value = configCopy[configKeys[key]];

        if (value === undefined) {
          emptyList.push(key);
        }
      }
      if (emptyList.length > 0) {
        throw new Error(`INVALID KEYS - there are enums but no values in config:\r\n${emptyList}\r\n`);
      }

      const keys = Object.keys(configCopy);
      const enumValues = Object.values(configKeys);
      for (const key of keys) {
        if (!enumValues.includes(key)) {
          emptyList.push(key);
        }
      }
      if (emptyList.length > 0) {
        throw new Error(`INVALID KEYS - there are values in config but not in enums:\r\n${emptyList}\r\n`);
      }
      console.log(`> ${msg}: Self Check Done...`);
    }

    return {
      configToModifyCopy,
      bugConfigCopy,
      getConfigValue,
      setConfigValue,
      resetConfig,
      getBugConfigValue,
      setBugConfigValue,
      fullSelfCheck,
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

const configInstance = ConfigManager.getInstance();
configInstance.fullSelfCheck();

function isBugDisabled(bugEnum) {
  return configInstance.getBugConfigValue(bugEnum) === false;
}

function isBugEnabled(bugEnum) {
  return configInstance.getBugConfigValue(bugEnum) === true;
}

module.exports = {
  configInstance,
  getConfigValue: configInstance.getConfigValue,
  setConfigValue: configInstance.setConfigValue,
  resetConfig: configInstance.resetConfig,
  getBugConfigValue: configInstance.getBugConfigValue,
  setBugConfigValue: configInstance.setBugConfigValue,
  isBugDisabled,
  isBugEnabled,
};
