const fs = require("fs");
const path = require("path");
const {
  pluginStatuses,
  formatErrorResponse,
  isAnyAdminUser,
  sleep,
  parseUserStats,
  parseArticleStats,
  parsePublishStats,
  getRandomInt,
} = require("./helpers");
const { verifyToken, getJwtExpiryDate } = require("./jwtauth");
const { logDebug } = require("./loggerApi");
const { dbPath, adminUserEmail, superAdminUserEmail, dateRegexp, emailRegexp, sleepTime } = require("./config");

const mandatory_non_empty_fields_user = ["firstname", "lastname", "email", "avatar"];
const all_fields_user = ["id", "firstname", "lastname", "email", "avatar", "password", "birthdate"];
const mandatory_non_empty_fields_article = ["user_id", "title", "body", "date"];
const all_fields_article = ["id", "user_id", "title", "body", "date", "image"];
const mandatory_non_empty_fields_comment = ["user_id", "article_id", "body", "date"];
const all_fields_comment = ["id", "user_id", "article_id", "body", "date"];
const all_fields_plugin = ["id", "name", "status", "version"];
const mandatory_non_empty_fields_plugin = ["name", "status", "version"];

function is_plugin_status_valid(body) {
  if (pluginStatuses.findIndex((status) => status === body["status"]) === -1) {
    return false;
  }
  return true;
}

function are_mandatory_fields_valid(body, mandatory_non_empty_fields) {
  for (let index = 0; index < mandatory_non_empty_fields.length; index++) {
    const element = mandatory_non_empty_fields[index];
    if (body[element] === undefined || body[element] === "" || body[element]?.length === 0) {
      logDebug(`Field validation: field ${element} not valid ${body[element]}`);
      return false;
    }
  }
  return true;
}

function are_all_fields_valid(
  body,
  all_possible_fields,
  mandatory_non_empty_fields,
  max_field_length = 10000,
  max_title_length = 128
) {
  const keys = Object.keys(body);
  let error = "";
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    if (!all_possible_fields.includes(key)) {
      error = `Field validation: ${key} not in ${all_possible_fields}`;
      logDebug(error);
      return { status: false, error };
    }
    const element = body[key];
    if (element?.toString().length > max_field_length) {
      error = `Field validation: ${key} longer than ${max_field_length}`;
      logDebug(error);
      return { status: false, error };
    }
    if (key.toLowerCase() === "title" && element?.toString().length > max_title_length) {
      error = `Field validation: ${key} longer than ${max_title_length}`;
      logDebug(error);
      return { status: false, error };
    }
    if (mandatory_non_empty_fields.includes(key)) {
      if (element === undefined || element?.toString().length === 0) {
        logDebug("Body:", body);
        error = `Field validation: ${key} is empty! Mandatory fields: ${mandatory_non_empty_fields}`;
        logDebug(error);
        return { status: false, error };
      }
    }
    if (key === "date") {
      if (!validateDate(element)) {
        logDebug("Body:", body);
        error = `Field validation: ${key} has invalid format!`;
        logDebug(error);
        return { status: false, error };
      }
    }
  }
  return { status: true, error };
}

const validateEmail = (email) => {
  return email.match(emailRegexp);
};

const validateDate = (date) => {
  return date.match(dateRegexp);
};

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
      const dbData = fs.readFileSync(path.join(__dirname, dbPath), "utf8");
      const dbDataJson = JSON.parse(dbData);

      const dataType = urlEnds.split("?chartType=");
      const stats = parseUserStats(dbDataJson, dataType[1] ?? "");

      res.status(200).json(stats);
      return;
    } else if (req.method === "GET" && urlEnds.includes("api/stats/articles")) {
      const dbData = fs.readFileSync(path.join(__dirname, dbPath), "utf8");
      const dbDataJson = JSON.parse(dbData);

      const dataType = urlEnds.split("?chartType=");
      const stats = parseArticleStats(dbDataJson, dataType[1] ?? "");

      res.status(200).json(stats);
      return;
    } else if (req.method === "GET" && urlEnds.includes("api/stats/publish/articles")) {
      const dbData = fs.readFileSync(path.join(__dirname, dbPath), "utf8");
      const dbDataJson = JSON.parse(dbData);

      const stats = parsePublishStats(dbDataJson, "articles");

      res.status(200).json(stats);
      return;
    } else if (req.method === "GET" && urlEnds.includes("api/stats/publish/comments")) {
      const dbData = fs.readFileSync(path.join(__dirname, dbPath), "utf8");
      const dbDataJson = JSON.parse(dbData);

      const stats = parsePublishStats(dbDataJson, "comments");

      res.status(200).json(stats);
      return;
    } else if (req.method === "GET" && urlEnds.includes("api/random/article")) {
      const dbData = fs.readFileSync(path.join(__dirname, dbPath), "utf8");
      const dbDataJson = JSON.parse(dbData);

      const articles = dbDataJson["articles"];
      const article = articles[Math.floor(Math.random() * articles.length)];
      logDebug("Random article:", article);
      res.status(200).json(article);
      return;
    }

    if (req.method !== "GET" && req.method !== "POST" && urlEnds.includes("/api/users") && !isAdmin) {
      // begin: check user auth
      const urlParts = urlEnds.split("/");
      let userId = urlParts[urlParts.length - 1];
      const verifyTokenResult = verifyAccessToken(req, res, "users", req.url);
      if (!verifyTokenResult) return;

      const dbData = fs.readFileSync(path.join(__dirname, dbPath), "utf8");
      const dbDataJson = JSON.parse(dbData);
      const foundUserFromToken = dbDataJson["users"].find((user) => {
        if (user["id"]?.toString() === userId?.toString() && user["email"] === verifyTokenResult.email) {
          return user;
        }
      });

      if (foundUserFromToken === undefined) {
        res.status(401).send(formatErrorResponse("Access token for given user is invalid!"));
        return;
      }
      // end: check user auth
    }
    if (req.method !== "GET" && urlEnds?.includes("/api/articles") && !isAdmin) {
      // begin: check user auth
      const verifyTokenResult = verifyAccessToken(req, res, "articles", req.url);
      if (!verifyTokenResult) return;

      const dbData = fs.readFileSync(path.join(__dirname, dbPath), "utf8");
      const dbDataJson = JSON.parse(dbData);

      if (req.method !== "POST") {
        const urlParts = urlEnds?.split("/");
        let articleId = req.body["id"];
        if (articleId === undefined) {
          articleId = urlParts[urlParts.length - 1];
        }
        const foundArticle = dbDataJson["articles"].find((article) => {
          if (article["id"]?.toString() === articleId?.toString()) {
            return article;
          }
        });

        const foundUser = dbDataJson["users"].find((user) => {
          if (
            user["id"]?.toString() === foundArticle?.user_id?.toString() &&
            user["email"] === verifyTokenResult.email
          ) {
            return user;
          }
        });

        if (foundUser === undefined) {
          res.status(401).send(formatErrorResponse("Access token for given user is invalid!"));
          return;
        }
      } else {
        let userId = req.body["user_id"];

        const foundUser = dbDataJson["users"].find((user) => {
          if (user["id"]?.toString() === userId.toString() && user["email"] === verifyTokenResult.email) {
            return user;
          }
        });

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

      const dbData = fs.readFileSync(path.join(__dirname, dbPath), "utf8");
      const dbDataJson = JSON.parse(dbData);

      if (req.method !== "POST") {
        const urlParts = urlEnds.split("/");
        let articleId = urlParts[urlParts.length - 1];
        const foundComment = dbDataJson["comments"].find((article) => {
          if (article["id"]?.toString() === articleId?.toString()) {
            return article;
          }
        });

        const foundUser = dbDataJson["users"].find((user) => {
          if (
            user["id"]?.toString() === foundComment?.user_id?.toString() &&
            user["email"] === verifyTokenResult.email
          ) {
            return user;
          }
        });

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
        res
          .status(422)
          .send(
            formatErrorResponse(
              `One of field is invalid (empty, invalid or too long) or there are some additional fields: ${isValid.error}`,
              all_fields_user
            )
          );
        return;
      }
      const dbData = fs.readFileSync(path.join(__dirname, dbPath), "utf8");
      if (dbData.includes(req.body["email"])) {
        res.status(409).send(formatErrorResponse("Email not unique"));
        return;
      }
      logDebug("Register User: SUCCESS:", { urlEnds, email: req.body["email"] });
    }
    if (req.method === "PUT" && urlEnds.includes("/api/users/")) {
      const urlParts = urlEnds.split("/");
      let userId = urlParts[urlParts.length - 1];
      // validate mandatory fields:
      if (!are_mandatory_fields_valid(req.body, mandatory_non_empty_fields_user)) {
        res.status(422).send(formatErrorResponse("One of mandatory field is missing", mandatory_non_empty_fields_user));
        return;
      }
      // validate all fields:
      const isValid = are_all_fields_valid(req.body, all_fields_user, mandatory_non_empty_fields_user);
      if (!isValid.status) {
        res
          .status(422)
          .send(
            formatErrorResponse(
              `One of field is invalid (empty, invalid or too long) or there are some additional fields: ${isValid.error}`,
              all_fields_user
            )
          );
        return;
      }
      const dbData = fs.readFileSync(path.join(__dirname, dbPath), "utf8");
      const dbDataJson = JSON.parse(dbData);
      const foundMail = dbDataJson["users"].find((user) => {
        if (user["id"]?.toString() !== userId?.toString() && user["email"] === req.body["email"]) {
          return user;
        }
      });
      if (foundMail !== undefined) {
        res.status(409).send(formatErrorResponse("Email not unique"));
        return;
      }
      const foundUser = dbDataJson["users"].find((user) => {
        if (user["id"]?.toString() === userId?.toString()) {
          return user;
        }
      });
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
        res
          .status(422)
          .send(
            formatErrorResponse(
              `One of field is invalid (empty, invalid or too long) or there are some additional fields: ${isValid.error}`,
              all_fields_user
            )
          );
        return;
      }
    }
    if (req.method !== "GET" && req.method !== "HEAD" && urlEnds.includes("/api/comments")) {
      // validate all fields:
      const isValid = are_all_fields_valid(req.body, all_fields_comment, mandatory_non_empty_fields_comment);
      if (!isValid.status) {
        res
          .status(422)
          .send(
            formatErrorResponse(
              `One of field is invalid (empty, invalid or too long) or there are some additional fields: ${isValid.error}`,
              all_fields_comment
            )
          );
        return;
      }
      const dbData = fs.readFileSync(path.join(__dirname, dbPath), "utf8");
      const dbDataJson = JSON.parse(dbData);

      let commentId;
      if (req.method !== "POST") {
        const urlParts = urlEnds.split("/");
        commentId = urlParts[urlParts.length - 1];
      }

      const foundComment = dbDataJson["comments"].find((comment) => {
        if (comment["id"]?.toString() === commentId?.toString()) {
          return comment;
        }
      });

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
        res
          .status(422)
          .send(
            formatErrorResponse(
              `One of field is invalid (empty, invalid or too long) or there are some additional fields: ${isValid.error}`,
              all_fields_comment
            )
          );
        return;
      }
    }

    if (req.method === "POST" && urlEnds.includes("/api/articles") && !isAdmin) {
      if (!are_mandatory_fields_valid(req.body, mandatory_non_empty_fields_article)) {
        res
          .status(422)
          .send(formatErrorResponse("One of mandatory field is missing", mandatory_non_empty_fields_article));
        return;
      }
      // validate all fields:
      const isValid = are_all_fields_valid(req.body, all_fields_article, mandatory_non_empty_fields_article);
      if (!isValid.status) {
        res
          .status(422)
          .send(
            formatErrorResponse(
              `One of field is invalid (empty, invalid or too long) or there are some additional fields: ${isValid.error}`,
              all_fields_article
            )
          );
        return;
      }
    }
    if (req.method === "PATCH" && urlEnds.includes("/api/articles") && !isAdmin) {
      // validate all fields:
      const isValid = are_all_fields_valid(req.body, all_fields_article, mandatory_non_empty_fields_article);
      if (!isValid.status) {
        res
          .status(422)
          .send(
            formatErrorResponse(
              `One of field is invalid (empty, invalid or too long) or there are some additional fields: ${isValid.error}`,
              all_fields_article
            )
          );
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
        res
          .status(422)
          .send(
            formatErrorResponse(
              `One of field is invalid (empty, invalid or too long) or there are some additional fields: ${isValid.error}`,
              all_fields_article
            )
          );
        return;
      }
      const dbData = fs.readFileSync(path.join(__dirname, dbPath), "utf8");
      const dbDataJson = JSON.parse(dbData);

      const urlParts = urlEnds.split("/");
      let articleId = urlParts[urlParts.length - 1];
      const foundArticle = dbDataJson["articles"].find((article) => {
        if (article["id"]?.toString() === articleId?.toString()) {
          return article;
        }
      });
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
