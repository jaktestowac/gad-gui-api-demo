const path = require("path");
const {
  formatErrorResponse,
  sleep,
  parseUserStats,
  parseArticleStats,
  parsePublishStats,
  getRandomInt,
  formatInvalidFieldErrorResponse,
  getIdFromUrl,
} = require("./helpers/helpers");
const { verifyToken, getJwtExpiryDate } = require("./helpers/jwtauth");
const { logDebug } = require("./helpers/loggerApi");
const { adminUserEmail, superAdminUserEmail, sleepTime } = require("./config");
const {
  all_fields_article,
  all_fields_comment,
  all_fields_user,
  are_all_fields_valid,
  are_mandatory_fields_valid,
  mandatory_non_empty_fields_article,
  mandatory_non_empty_fields_comment,
  mandatory_non_empty_fields_user,
  validateEmail,
} = require("./helpers/validation.helpers");
const { userDb, articlesDb, fullDb } = require("./db.helper");
const {
  searchForArticle,
  searchForUserWithToken,
  searchForComment,
  searchForUser,
} = require("./helpers/db-operation.helpers");

const verifyAccessToken = (req, res, endopint = "endpoint", url = "") => {
  const authorization = req.headers["authorization"];
  let access_token = undefined ? "" : authorization?.split(" ")[1];

  let verifyTokenResult = verifyToken(access_token);

  // when chceking admin we do not send response
  if (endopint !== "isAdmin" && verifyTokenResult instanceof Error) {
    res.status(401).send(formatErrorResponse("Access token not provided!"));
    return false;
  }
  logDebug(`[${endopint}][${url}] verifyTokenResult:`, verifyTokenResult);

  if (verifyTokenResult?.exp !== undefined) {
    const current_time = Date.now() / 1000;
    const diff = Math.round(verifyTokenResult.exp - current_time);
    logDebug(`[${endopint}] getJwtExpiryDate:`, {
      current_time: current_time,
      exp: verifyTokenResult.exp,
      diff,
      expiryDate: getJwtExpiryDate(diff),
    });
    if (current_time > verifyTokenResult?.exp) {
      logDebug(`[${endopint}] getJwt Expired`);
    }
  }

  return verifyTokenResult;
};

const validations = (req, res, next) => {
  let isAdmin = false;

  try {
    const urlEnds = req.url.replace(/\/\/+/g, "/");
    if (
      (req.url.includes("/api/users") ||
        req.url.includes("/api/comments") ||
        req.url.includes("/api/articles") ||
        req.url.includes("/api/plugins")) &&
      req.body?.length > 0
    ) {
      try {
        JSON.parse(req.body);
      } catch (error) {
        logDebug(`Error: ${JSON.stringify(error)}`);
        res.status(400).send(formatErrorResponse("Bad request - malformed JSON"));
        return;
      }
    }
    // check if admin:
    try {
      let verifyTokenResult = verifyAccessToken(req, res, "isAdmin", req.url);
      if (verifyTokenResult?.email === adminUserEmail || verifyTokenResult?.email === superAdminUserEmail) {
        isAdmin = true;
        logDebug("isAdmin:", isAdmin);
      }
    } catch (error) {
      logDebug(`Error: check if admin: ${JSON.stringify(error)}`);
    }

    if (req.method === "GET" && urlEnds.includes("api/stats/users")) {
      const dbDataJson = fullDb();

      const dataType = urlEnds.split("?chartType=");
      const stats = parseUserStats(dbDataJson, dataType[1] ?? "");

      res.status(200).json(stats);
      return;
    } else if (req.method === "GET" && urlEnds.includes("api/stats/articles")) {
      const dbDataJson = fullDb();

      const dataType = urlEnds.split("?chartType=");
      const stats = parseArticleStats(dbDataJson, dataType[1] ?? "");

      res.status(200).json(stats);
      return;
    } else if (req.method === "GET" && urlEnds.includes("api/stats/publish/articles")) {
      const dbDataJson = fullDb();

      const stats = parsePublishStats(dbDataJson, "articles");

      res.status(200).json(stats);
      return;
    } else if (req.method === "GET" && urlEnds.includes("api/stats/publish/comments")) {
      const dbDataJson = fullDb();

      const stats = parsePublishStats(dbDataJson, "comments");

      res.status(200).json(stats);
      return;
    } else if (req.method === "GET" && urlEnds.includes("api/random/article")) {
      const articles = articlesDb();
      const article = articles[Math.floor(Math.random() * articles.length)];
      logDebug("Random article:", article);
      res.status(200).json(article);
      return;
    }

    if (req.method !== "GET" && req.method !== "POST" && urlEnds.includes("/api/users") && !isAdmin) {
      // begin: check user auth
      let userId = getIdFromUrl(urlEnds);
      const verifyTokenResult = verifyAccessToken(req, res, "users", req.url);
      if (!verifyTokenResult) return;

      const foundUserFromToken = searchForUserWithToken(userId, verifyTokenResult);

      if (foundUserFromToken === undefined) {
        res.status(401).send(formatErrorResponse("Access token for given user is invalid!"));
        return;
      }
      // end: check user auth
    }
    if (urlEnds?.includes("/api/articles/upload") && !isAdmin) {
      // begin: check user auth
      const verifyTokenResult = verifyAccessToken(req, res, "articles", req.url);
      if (!verifyTokenResult) return;
      const foundUser = searchForUserWithToken(req.headers["userid"], verifyTokenResult);

      if (foundUser === undefined) {
        res.status(401).send(formatErrorResponse("Access token for given user is invalid!"));
        return;
      }
    } else if (req.method !== "GET" && urlEnds?.includes("/api/articles") && !isAdmin) {
      // begin: check user auth
      const verifyTokenResult = verifyAccessToken(req, res, "articles", req.url);
      if (!verifyTokenResult) return;

      if (req.method !== "POST") {
        let articleId = req.body["id"];
        if (articleId === undefined) {
          articleId = getIdFromUrl(urlEnds);
        }

        const foundArticle = searchForArticle(articleId);
        const foundUser = searchForUserWithToken(foundArticle?.user_id, verifyTokenResult);

        if (foundUser === undefined) {
          res.status(401).send(formatErrorResponse("Access token for given user is invalid!"));
          return;
        }
      } else {
        const foundUser = searchForUserWithToken(req.body["user_id"], verifyTokenResult);

        if (foundUser === undefined) {
          res.status(401).send(formatErrorResponse("Access token for given user is invalid!"));
          return;
        }
      }
      // end: check user auth
    }
    if (req.method !== "GET" && urlEnds.includes("/api/comments") && !isAdmin) {
      // begin: check user auth
      const verifyTokenResult = verifyAccessToken(req, res, "comments", req.url);
      if (!verifyTokenResult) return;

      if (req.method !== "POST") {
        let commentId = getIdFromUrl(urlEnds);
        const foundComment = searchForComment(commentId);
        const foundUser = searchForUserWithToken(foundComment?.user_id, verifyTokenResult);

        if (foundUser === undefined) {
          res.status(401).send(formatErrorResponse("Access token for given user is invalid!"));
          return;
        }
      }
      // end: check user auth
    }

    if (req.method === "POST" && urlEnds.includes("/api/users")) {
      logDebug("Register User: attempt:", { urlEnds, email: req.body["email"] });
      // validate mandatory fields:
      if (!are_mandatory_fields_valid(req.body, mandatory_non_empty_fields_user)) {
        res.status(422).send(formatErrorResponse("One of mandatory field is missing", mandatory_non_empty_fields_user));
        return;
      }
      // validate email:
      if (!validateEmail(req.body["email"])) {
        res.status(422).send(formatErrorResponse("Invalid email"));
        return;
      }
      // validate all fields:
      const isValid = are_all_fields_valid(req.body, all_fields_user, mandatory_non_empty_fields_user);
      if (!isValid.status) {
        res.status(422).send();
        return;
      }
      if (userDb().includes(req.body["email"])) {
        res.status(409).send(formatErrorResponse("Email not unique"));
        return;
      }
      logDebug("Register User: SUCCESS:", { urlEnds, email: req.body["email"] });
    }
    if (req.method === "PUT" && urlEnds.includes("/api/users/")) {
      let userId = getIdFromUrl(urlEnds);
      // validate mandatory fields:
      if (!are_mandatory_fields_valid(req.body, mandatory_non_empty_fields_user)) {
        res.status(422).send(formatErrorResponse("One of mandatory field is missing", mandatory_non_empty_fields_user));
        return;
      }
      // validate all fields:
      const isValid = are_all_fields_valid(req.body, all_fields_user, mandatory_non_empty_fields_user);
      if (!isValid.status) {
        res.status(422).send(formatInvalidFieldErrorResponse(isValid, all_fields_user));
        return;
      }

      const foundMail = userDb().find((user) => {
        if (user["id"]?.toString() !== userId?.toString() && user["email"] === req.body["email"]) {
          return user;
        }
      });
      if (foundMail !== undefined) {
        res.status(409).send(formatErrorResponse("Email not unique"));
        return;
      }
      const foundUser = searchForUser(userId);

      if (foundUser === undefined) {
        req.method = "POST";
        req.url = req.url.replace(`/${userId}`, "");
        if (parseInt(userId).toString() === userId) {
          userId = parseInt(userId);
        }
        req.body.id = userId;
      }
      if (foundUser !== undefined) {
        if (!req.body.password || req.body.password == "") {
          req.body.password = foundUser["password"];
        }
      }
    }
    if (req.method === "PATCH" && urlEnds.includes("/api/users")) {
      // validate all fields:
      const isValid = are_all_fields_valid(req.body, all_fields_user, mandatory_non_empty_fields_user);
      if (!isValid.status) {
        res.status(422).send(formatInvalidFieldErrorResponse(isValid, all_fields_user));
        return;
      }
    }
    if (req.method !== "GET" && req.method !== "HEAD" && urlEnds.includes("/api/comments")) {
      // validate all fields:
      const isValid = are_all_fields_valid(req.body, all_fields_comment, mandatory_non_empty_fields_comment);
      if (!isValid.status) {
        res.status(422).send(formatInvalidFieldErrorResponse(isValid, all_fields_comment));
        return;
      }

      let commentId;
      if (req.method !== "POST") {
        commentId = getIdFromUrl(urlEnds);
      }

      const foundComment = searchForComment(commentId);

      if (req.method === "PUT" && foundComment === undefined) {
        req.method = "POST";
        req.url = req.url.replace(`/${commentId}`, "");
        if (parseInt(commentId).toString() === commentId) {
          commentId = parseInt(commentId);
        }
        req.body.id = commentId;
      }
    }
    if (req.method === "POST" && urlEnds.includes("/api/comments")) {
      if (!are_mandatory_fields_valid(req.body, mandatory_non_empty_fields_comment)) {
        res
          .status(422)
          .send(formatErrorResponse("One of mandatory field is missing", mandatory_non_empty_fields_comment));
        return;
      }
      // validate all fields:
      const isValid = are_all_fields_valid(req.body, all_fields_comment, mandatory_non_empty_fields_comment);
      if (!isValid.status) {
        res.status(422).send(formatInvalidFieldErrorResponse(isValid, all_fields_comment));
        return;
      }
    }

    if (req.method === "POST" && urlEnds.includes("/api/articles") && !urlEnds.includes("/upload") && !isAdmin) {
      if (!are_mandatory_fields_valid(req.body, mandatory_non_empty_fields_article)) {
        res
          .status(422)
          .send(formatErrorResponse("One of mandatory field is missing", mandatory_non_empty_fields_article));
        return;
      }
      // validate all fields:
      const isValid = are_all_fields_valid(req.body, all_fields_article, mandatory_non_empty_fields_article);
      if (!isValid.status) {
        res.status(422).send(formatInvalidFieldErrorResponse(isValid, all_fields_article));
        return;
      }
    }
    if (req.method === "PATCH" && urlEnds.includes("/api/articles") && !isAdmin) {
      // validate all fields:
      const isValid = are_all_fields_valid(req.body, all_fields_article, mandatory_non_empty_fields_article);
      if (!isValid.status) {
        res.status(422).send(formatInvalidFieldErrorResponse(isValid, all_fields_article));
        return;
      }
    }
    if (req.method === "PUT" && urlEnds.includes("/api/articles") && !isAdmin) {
      if (!are_mandatory_fields_valid(req.body, mandatory_non_empty_fields_article)) {
        res
          .status(422)
          .send(formatErrorResponse("One of mandatory field is missing", mandatory_non_empty_fields_article));

        return;
      }
      // validate all fields:
      const isValid = are_all_fields_valid(req.body, all_fields_article, mandatory_non_empty_fields_article);
      if (!isValid.status) {
        res.status(422).send(formatInvalidFieldErrorResponse(isValid, all_fields_article));
        return;
      }

      let articleId = getIdFromUrl(urlEnds);
      const foundArticle = searchForArticle(articleId);

      if (foundArticle === undefined) {
        req.method = "POST";
        req.url = req.url.replace(`/${articleId}`, "");
        if (parseInt(articleId).toString() === articleId) {
          articleId = parseInt(articleId);
        }
        req.body.id = articleId;
      }
    }

    if (req.method === "GET" && urlEnds.includes("api/comments")) {
      let comments = urlEnds.split("_limit=")[1];
      comments = comments?.split("&")[0];
      let timeout = sleepTime.perOneGetComment;
      if (comments !== undefined) {
        timeout = comments * getRandomInt(sleepTime.perOneGetCommentMin, sleepTime.perOneGetCommentMax);
        logDebug(`[DELAY] Waiting for ${timeout} [ms] to load ${comments} comments`);
      }
      logDebug(`[DELAY] Waiting for ${timeout} [ms] for ${urlEnds}`);
      sleep(timeout).then(() => next());
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(formatErrorResponse("Fatal error. Please contact administrator."));
  }
};

exports.validations = validations;
exports.validateEmail = validateEmail;
