const { isBugEnabled } = require("../config/config-manager");
const { BugConfigKeys } = require("../config/enums");
const { isTrueWithProbability } = require("../helpers/helpers");

const randomErrorsRoutes = (req, res, next) => {
  if (isBugEnabled(BugConfigKeys.BUG_RANDOM_503)) {
    if (isTrueWithProbability(0.05)) {
      return res.status(503).send({ message: "Random 503 error" });
    } else {
      next();
    }
  } else {
    next();
  }
};

exports.randomErrorsRoutes = randomErrorsRoutes;
