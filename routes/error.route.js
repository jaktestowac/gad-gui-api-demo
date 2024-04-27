const { isBugEnabled, getConfigValue } = require("../config/config-manager");
const { BugConfigKeys, ConfigKeys } = require("../config/enums");
const { getRandomInt } = require("../helpers/generators/random-data.generator");
const { isTrueWithProbability, sleep, getIdFromUrl } = require("../helpers/helpers");
const { logDebug } = require("../helpers/logger-api");
const { checkIfResourceCreatedInRange, elapsedSecondsSinceCreation } = require("../helpers/temp-data-store");

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

  if (
    req.method === "GET" &&
    req.url.includes("/api/articles/") &&
    isBugEnabled(BugConfigKeys.BUG_404_IF_ARTICLE_CREATED_RECENTLY)
  ) {
    const id = getIdFromUrl(req.url);
    const resourceCreatedRecently = checkIfResourceCreatedInRange(
      `articles/${id}`,
      getConfigValue(ConfigKeys.MIN_SECONDS_FOR_RESOURCE_CREATED_RECENTLY_BUG)
    );
    if (resourceCreatedRecently === true) {
      const elapsedSeconds = elapsedSecondsSinceCreation(`articles/${id}`);
      return res.status(404).send({
        message: "404 error on too recent GET",
        resource: req.url,
        details: `Resource created ${elapsedSeconds}[s] ago. Wait till: ${getConfigValue(
          ConfigKeys.MIN_SECONDS_FOR_RESOURCE_CREATED_RECENTLY_BUG
        )}[s]`,
      });
    }
  }
  if (
    req.method === "GET" &&
    req.url.includes("/api/comments/") &&
    isBugEnabled(BugConfigKeys.BUG_404_IF_COMMENT_CREATED_RECENTLY)
  ) {
    const id = getIdFromUrl(req.url);
    const resourceCreatedRecently = checkIfResourceCreatedInRange(
      `comments/${id}`,
      getConfigValue(ConfigKeys.MIN_SECONDS_FOR_RESOURCE_CREATED_RECENTLY_BUG)
    );
    if (resourceCreatedRecently === true) {
      const elapsedSeconds = elapsedSecondsSinceCreation(`articles/${id}`);
      return res.status(404).send({
        message: "404 error on too recent GET",
        resource: req.url,
        details: `Resource created ${elapsedSeconds}[s] ago. Wait till: ${getConfigValue(
          ConfigKeys.MIN_SECONDS_FOR_RESOURCE_CREATED_RECENTLY_BUG
        )}[s]`,
      });
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
