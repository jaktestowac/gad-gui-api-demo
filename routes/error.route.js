const { isBugEnabled, getConfigValue } = require("../config/config-manager");
const { BugConfigKeys, ConfigKeys } = require("../config/enums");
const { getRandomInt } = require("../helpers/generators/random-data.generator");
const { isTrueWithProbability, sleep } = require("../helpers/helpers");
const { logDebug } = require("../helpers/logger-api");

const randomErrorsRoutes = (req, res, next) => {
  if (isBugEnabled(BugConfigKeys.BUG_RANDOM_503)) {
    if (isTrueWithProbability(getConfigValue(ConfigKeys.RANDOM_ERROR_RESPONSE_PROBABILITY))) {
      return res.status(503).send({ message: "Random 503 error" });
    }
  }

  if (req.method === "GET" && isBugEnabled(BugConfigKeys.BUG_RANDOM_404_GET)) {
    if (isTrueWithProbability(getConfigValue(ConfigKeys.RANDOM_ERROR_RESPONSE_PROBABILITY))) {
      return res.status(404).send({ message: "Random 404 error" });
    }
  }

  if (isBugEnabled(BugConfigKeys.BUG_SLOWER_RESPONSES_100)) {
    const timeout = getRandomInt(100, 200);
    logDebug(`[DELAY] Waiting for ${timeout} [ms] on ${req.url}...`);
    sleep(timeout).then(() => next());
  } else if (isBugEnabled(BugConfigKeys.BUG_SLOWER_RESPONSES_500)) {
    const timeout = getRandomInt(500, 1000);
    logDebug(`[DELAY] Waiting for ${timeout} [ms] on ${req.url}...`);
    sleep(timeout).then(() => next());
  } else if (isBugEnabled(BugConfigKeys.BUG_SLOWER_RESPONSES_1000)) {
    const timeout = getRandomInt(1000, 2000);
    logDebug(`[DELAY] Waiting for ${timeout} [ms] on ${req.url}...`);
    sleep(timeout).then(() => next());
  } else if (isBugEnabled(BugConfigKeys.BUG_SLOWER_RESPONSES_2500)) {
    const timeout = getRandomInt(2500, 5000);
    logDebug(`[DELAY] Waiting for ${timeout} [ms] on ${req.url}...`);
    sleep(timeout).then(() => next());
  } else {
    next();
  }
};

exports.randomErrorsRoutes = randomErrorsRoutes;
