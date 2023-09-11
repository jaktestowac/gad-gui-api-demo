const { searchForUserWithToken, searchForArticle } = require("../helpers/db-operation.helpers");
const {
  formatInvalidTokenErrorResponse,
  getIdFromUrl,
  formatMissingFieldErrorResponse,
  formatInvalidFieldErrorResponse,
} = require("../helpers/helpers");
const { HTTP_UNAUTHORIZED, HTTP_UNPROCESSABLE_ENTITY } = require("../helpers/response.helpers");
const {
  verifyAccessToken,
  are_mandatory_fields_present,
  mandatory_non_empty_fields_article,
  all_fields_article,
  are_all_fields_valid,
} = require("../helpers/validation.helpers");

function handleArticles(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  if (urlEnds?.includes("/api/articles/upload") && !isAdmin) {
    const verifyTokenResult = verifyAccessToken(req, res, "articles", req.url);
    const foundUser = searchForUserWithToken(req.headers["userid"], verifyTokenResult);

    if (foundUser === undefined) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return;
    }
  }
  if (req.method !== "GET" && req.method !== "HEAD" && urlEnds?.includes("/api/articles") && !isAdmin) {
    const verifyTokenResult = verifyAccessToken(req, res, "articles", req.url);

    if (req.method !== "POST") {
      let articleId = req.body["id"];
      if (articleId === undefined) {
        articleId = getIdFromUrl(urlEnds);
      }

      const foundArticle = searchForArticle(articleId);
      const foundUser = searchForUserWithToken(foundArticle?.user_id, verifyTokenResult);

      if (foundUser === undefined) {
        res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
        return;
      }
    } else {
      const foundUser = searchForUserWithToken(req.body["user_id"], verifyTokenResult);

      if (foundUser === undefined) {
        res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
        return;
      }
    }
  }

  if (req.method === "POST" && urlEnds.includes("/api/articles") && !urlEnds.includes("/upload") && !isAdmin) {
    // validate mandatory fields:
    if (!are_mandatory_fields_present(req.body, mandatory_non_empty_fields_article)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatMissingFieldErrorResponse(mandatory_non_empty_fields_article));
      return;
    }
    // validate all fields:
    const isValid = are_all_fields_valid(req.body, all_fields_article, mandatory_non_empty_fields_article);
    if (!isValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidFieldErrorResponse(isValid, all_fields_article));
      return;
    }
  }
  if (req.method === "PATCH" && urlEnds.includes("/api/articles") && !isAdmin) {
    // validate all fields:
    const isValid = are_all_fields_valid(req.body, all_fields_article, mandatory_non_empty_fields_article);
    if (!isValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidFieldErrorResponse(isValid, all_fields_article));
      return;
    }
  }
  if (req.method === "PUT" && urlEnds.includes("/api/articles") && !isAdmin) {
    // validate mandatory fields:
    if (!are_mandatory_fields_present(req.body, mandatory_non_empty_fields_article)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatMissingFieldErrorResponse(mandatory_non_empty_fields_article));
      return;
    }
    // validate all fields:
    const isValid = are_all_fields_valid(req.body, all_fields_article, mandatory_non_empty_fields_article);
    if (!isValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidFieldErrorResponse(isValid, all_fields_article));
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

  return;
}

module.exports = {
  handleArticles,
};
