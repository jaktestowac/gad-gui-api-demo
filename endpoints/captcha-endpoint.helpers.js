const { getFeatureFlagConfigValue } = require("../config/config-manager");
const { FeatureFlagConfigKeys } = require("../config/enums");
const { generateEquation, checkCaptcha } = require("../helpers/captcha.helper");
const {
  generateUuid,
  formatMissingFieldErrorResponse,
  formatErrorResponse,
  base64ToJson,
} = require("../helpers/helpers");
const { logDebug, logInsane } = require("../helpers/logger-api");
const { HTTP_OK, HTTP_UNPROCESSABLE_ENTITY, HTTP_NOT_FOUND, HTTP_BAD_REQUEST } = require("../helpers/response.helpers");

const mathOperationsForCaptcha = {};

function handleCaptcha(req, res) {
  const isFeatureEnabled = getFeatureFlagConfigValue(FeatureFlagConfigKeys.FEATURE_CAPTCHA);
  if (!isFeatureEnabled) {
    res.status(HTTP_NOT_FOUND).json({});
    return;
  }

  if (req.method === "GET" && req.url.endsWith("/api/captcha")) {
    const equationData = generateEquation(2, 3, 1, 3);
    const equation = equationData.equation;

    const uuid = generateUuid();

    mathOperationsForCaptcha[uuid] = equationData;

    logDebug("handleCaptcha: GET /api/captcha", {
      equationString: equationData.equationString,
      result: equationData.result,
    });
    res.status(HTTP_OK).json({ equation: equation });
    return;
  }
  if (req.method === "POST" && req.url.endsWith("/api/captcha")) {
    const uuid = req.body["uuid"];
    const actualResult = req.body["result"];

    if (uuid === undefined || actualResult === undefined) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).json(formatMissingFieldErrorResponse(["uuid, result"]));
      return;
    }

    const equationData = mathOperationsForCaptcha[uuid];

    if (equationData === undefined) {
      res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Captcha not found!"));
      return;
    }

    const isCaptchaCorrect = checkCaptcha(actualResult, equationData);

    // TODO: remove the captcha from the list after it was used
    if (isCaptchaCorrect === true) {
      delete mathOperationsForCaptcha[uuid];
    } else {
      delete mathOperationsForCaptcha[uuid];
    }

    logInsane("handleCaptcha: GET /api/captcha", {
      uuid,
      equationString: equationData.equationString,
      result: equationData.result,
      actualResult,
      isCaptchaCorrect,
    });

    if (isCaptchaCorrect === false) {
      res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Invalid response for Captcha!"));
      return;
    }

    const code = isCaptchaCorrect ? HTTP_OK : HTTP_BAD_REQUEST;
    res.status(code).json({ isCaptchaCorrect });
    return;
  }
  return;
}

function handleCaptchaVerification(req, res) {
  const isFeatureEnabled = getFeatureFlagConfigValue(FeatureFlagConfigKeys.FEATURE_CAPTCHA);
  if (!isFeatureEnabled) {
    return;
  }

  const urlWithVerification = [{ url: "/api/users", method: "POST" }];

  const isOnList = urlWithVerification.some((u) => req.url.includes(u.url) && req.method === u.method);

  if (isOnList === false) {
    // The endpoint is not on the list
    return;
  }

  const captchaResponseRawBase64 = req.headers["captcha"];

  if (captchaResponseRawBase64 === undefined) {
    res.status(HTTP_UNPROCESSABLE_ENTITY).json(formatErrorResponse("Captcha response not provided!"));
    return;
  }

  let captchaResponse;
  try {
    captchaResponse = base64ToJson(captchaResponseRawBase64);
  } catch (e) {
    res.status(HTTP_UNPROCESSABLE_ENTITY).json(formatErrorResponse("Invalid captcha response!"));
    return;
  }

  const uuid = captchaResponse["uuid"];
  const actualResult = captchaResponse["result"];

  if (uuid === undefined || actualResult === undefined) {
    res.status(HTTP_UNPROCESSABLE_ENTITY).json(formatMissingFieldErrorResponse(["uuid, result"]));
    return;
  }

  const equationData = mathOperationsForCaptcha[uuid];

  if (equationData === undefined) {
    res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Captcha not found!"));
    return;
  }

  const isCaptchaCorrect = checkCaptcha(actualResult, equationData);

  // TODO: remove the captcha from the list after it was used
  if (isCaptchaCorrect === true) {
    delete mathOperationsForCaptcha[uuid];
  } else {
    delete mathOperationsForCaptcha[uuid];
  }

  if (isCaptchaCorrect === false) {
    res.status(HTTP_BAD_REQUEST).json({ isCaptchaCorrect });
    return;
  }
  return;
}

module.exports = {
  handleCaptcha,
  handleCaptchaVerification,
};
