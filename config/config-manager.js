/* eslint-disable no-console */
const { config, configToModify } = require("./config-general");
const { bugConfig } = require("./config-bugs");
const { featureFlagConfig } = require("./config-features");
const { ConfigKeys, BugConfigKeys, FeatureFlagConfigKeys } = require("./enums");

const ConfigManager = (function () {
  let instance;

  function createInstance() {
    const configCopy = { ...config };
    const configToModifyCopy = { ...configToModify };
    const bugConfigCopy = { ...bugConfig };
    const featureFlagConfigCopy = { ...featureFlagConfig };

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

    function getFeatureFlagConfigValue(key) {
      if (featureFlagConfigCopy[key] === undefined) {
        console.log(`> FeatureFlagConfig: Warning! Value of "${key}" is "${featureFlagConfigCopy[key]}"`);
      }
      return featureFlagConfigCopy[key];
    }

    function setConfigValue(key, value) {
      configToModifyCopy[key] = value;
      return configToModifyCopy[key];
    }

    function setBugConfigValue(key, value) {
      bugConfigCopy[key] = value;
      return bugConfigCopy[key];
    }

    function setFeatureFlagConfigValue(key, value) {
      featureFlagConfigCopy[key] = value;
      return featureFlagConfigCopy[key];
    }

    function resetConfig() {
      reset(configCopy, config);
      reset(configToModifyCopy, configToModify);
      reset(bugConfigCopy, bugConfig);
      reset(featureFlagConfigCopy, featureFlagConfig);
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
      selfCheck(FeatureFlagConfigKeys, featureFlagConfigCopy, "FeatureFlagConfig");
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
      console.log(`> ${msg}: Self Check Done`);
    }

    function displayAdditionInfo() {
      const readOnlyMode = getConfigValue(ConfigKeys.READ_ONLY);
      if (readOnlyMode === true) {
        console.log("--> Config: READ ONLY MODE is enabled");
      }
    }

    return {
      configToModifyCopy,
      bugConfigCopy,
      featureFlagConfigCopy,
      getConfigValue,
      setConfigValue,
      resetConfig,
      getBugConfigValue,
      setBugConfigValue,
      getFeatureFlagConfigValue,
      setFeatureFlagConfigValue,
      fullSelfCheck,
      displayAdditionInfo,
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
configInstance.displayAdditionInfo();

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
  getFeatureFlagConfigValue: configInstance.getFeatureFlagConfigValue,
  setFeatureFlagConfigValue: configInstance.setFeatureFlagConfigValue,
  isBugDisabled,
  isBugEnabled,
};
