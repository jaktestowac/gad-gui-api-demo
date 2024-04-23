const { calculateTimeDifferenceInSeconds } = require("./datetime.helpers");
const { logDebug } = require("./logger-api");

const tempDataStore = (function () {
  let instance;

  function createInstance() {
    let resourceCreationDate = {};

    function getResourceCreationDate() {
      return resourceCreationDate;
    }

    function checkIfResourceCreatedInRange(key, rangeInSeconds = 3) {
      logDebug(`[STORE] Checking if request ${key} is in call range...`, resourceCreationDate);
      if (resourceCreationDate[key] !== undefined) {
        logDebug(`[STORE] Checking if request ${key} is in call range...`, {
          resourceCreationDate,
          val: resourceCreationDate[key],
        });
        if (elapsedSecondsSinceCreation(key) < rangeInSeconds) {
          return true;
        }
      }
      return false;
    }

    function elapsedSecondsSinceCreation(key) {
      return calculateTimeDifferenceInSeconds(resourceCreationDate[key]["date"], new Date());
    }

    function addResourceCreationDate(key, date = new Date()) {
      logDebug(`[STORE] Adding request ${key} to call range...`, resourceCreationDate[key]);
      resourceCreationDate[key] = { date };
      return resourceCreationDate[key];
    }

    return {
      getResourceCreationDate,
      addResourceCreationDate,elapsedSecondsSinceCreation,
      checkIfResourceCreatedInRange,
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

const tempDataStoreInstance = tempDataStore.getInstance();

module.exports = {
  tempDataStore,
  tempDataStoreInstance,
  addResourceCreationDate: tempDataStoreInstance.addResourceCreationDate,
  elapsedSecondsSinceCreation: tempDataStoreInstance.elapsedSecondsSinceCreation,
  checkIfResourceCreatedInRange: tempDataStoreInstance.checkIfResourceCreatedInRange,
};
