const { calculateROI, calculateSimpleROI } = require("../helpers/calc/roi");
const { formatErrorResponse } = require("../helpers/helpers");
const { logError } = require("../helpers/logger-api");
const { HTTP_INTERNAL_SERVER_ERROR, HTTP_OK } = require("../helpers/response.helpers");

const calcRoutes = (req, res, next) => {
  try {
    const urlEnds = req.url.replace(/\/\/+/g, "/");
    if (req.method === "POST" && urlEnds.includes("api/calc/roi")) {
      const data = req.body;

      const result = calculateROI(data);

      res.status(HTTP_OK).json(result);
      return;
    } else if (req.method === "POST" && urlEnds.includes("api/calc/simpleroi")) {
      const data = req.body;

      const result = calculateSimpleROI(data);

      res.status(HTTP_OK).json(result);
      return;
    }

    if (res.headersSent !== true) {
      next();
    }
  } catch (error) {
    logError("Fatal error. Please contact administrator.", {
      route: "calcRoutes",
      error,
      stack: error.stack,
    });
    res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Fatal error. Please contact administrator."));
  }
};

exports.calcRoutes = calcRoutes;
