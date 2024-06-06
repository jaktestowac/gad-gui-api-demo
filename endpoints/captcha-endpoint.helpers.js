const { generateEquation, checkCaptcha } = require("../helpers/captcha.helper");
const { generateUuid, formatMissingFieldErrorResponse, formatErrorResponse } = require("../helpers/helpers");
const { logDebug, logInsane } = require("../helpers/logger-api");
const { HTTP_OK, HTTP_UNPROCESSABLE_ENTITY, HTTP_NOT_FOUND } = require("../helpers/response.helpers");

const mathOperations = {};

function handleCaptcha(req, res) {
  if (req.method === "GET" && req.url.endsWith("/api/captcha")) {
    const equationData = generateEquation(2, 3, 1, 3);
    const equation = equationData.equation;

    const uuid = generateUuid();

    mathOperations[uuid] = equationData;

    logDebug("handleCaptcha: GET /api/captcha", {
      equationString: equationData.equationString,
      result: equationData.result,
    });
    res.status(HTTP_OK).json({ equation: equation });
  }
  if (req.method === "POST" && req.url.endsWith("/api/captcha")) {
    const uuid = req.body["uuid"];
    const actualResult = req.body["result"];

    if (uuid === undefined || actualResult === undefined) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).json(formatMissingFieldErrorResponse(["uuid, result"]));
    }

    const equationData = mathOperations[uuid];

    if (equationData === undefined) {
      res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Captcha not found!"));
    }

    const isCaptchaCorrect = checkCaptcha(actualResult, equationData);

    if (isCaptchaCorrect === true) {
      delete mathOperations[uuid];
    } else {
      delete mathOperations[uuid];
    }

    logInsane("handleCaptcha: GET /api/captcha", {
      uuid,
      equationString: equationData.equationString,
      result: equationData.result,
      actualResult,
      isCaptchaCorrect,
    });
    res.status(HTTP_OK).json({ isCaptchaCorrect });
  }
  return;
}

module.exports = {
  handleCaptcha,
};
