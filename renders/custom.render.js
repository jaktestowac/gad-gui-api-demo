const { isBugEnabled } = require("../config/config-manager");
const { BugConfigKeys } = require("../config/enums");
const { areIdsEqual } = require("../helpers/compare.helpers");
const { articlesDb } = require("../helpers/db.helpers");
const { sleep } = require("../helpers/helpers");
const { logTrace, logInsane } = require("../helpers/logger-api");
const { addResourceCreationDate } = require("../helpers/temp-data-store");
const { getOriginMethod } = require("../helpers/tracing-info.helper");

function renderResponse(req, res) {
  if (req.method === "GET" && req.url.includes("users")) {
    const users = res.locals.data;
    let loggedUser = req.cookies.id;
    let usersMapped;
    logTrace("RenderResponse: User anonymization:", { length: users.length, loggedUser });
    if (users?.length > 0) {
      usersMapped = users.map((user) => {
        if (!loggedUser) {
          user.lastname = "****";
        }
        if (loggedUser !== "admin") {
          user.email = "****";
        }
        user.password = "****";
        return user;
      });

      usersMapped = usersMapped.filter((article) => article._inactive === undefined || article?._inactive === false);
    } else {
      // This is for single user
      usersMapped = users;
      if (loggedUser !== "admin") {
        usersMapped.email = "****";
      }
      if (!loggedUser) {
        usersMapped.lastname = "****";
      }
      usersMapped.password = "****";

      if (usersMapped?._inactive === true) {
        usersMapped = {};
        res.status(404);
      }
    }
    res.jsonp(usersMapped);
  } else if (req.method === "POST" && req.url.includes("users")) {
    // add little wait  so that user is created in DB
    sleep(100).then((x) => {
      res.jsonp(res.locals.data);
    });
  } else if (req.method === "GET" && (req.url.includes("articles") || req.url.includes("comments"))) {
    const resources = res.locals.data;
    let resourcesMapped = resources;
    logInsane("RenderResponse: returning resources:", { length: resources.length });
    if (resources?.length > 0) {
      resourcesMapped = resources.filter(
        (resource) => resource._inactive === undefined || resource?._inactive === false
      );
      resourcesMapped = resourcesMapped.map((resource) => {
        const { _inactive, ...rest } = resource;
        return rest;
      });
      logTrace("RenderResponse: Articles:", {
        withInactive: resources.length,
        withoutInactive: resourcesMapped.length,
      });
    } else {
      if (resourcesMapped?._inactive === true) {
        resourcesMapped = {};
        res.status(404);
        res.jsonp(resourcesMapped);
        return;
      }
    }

    if (req.method === "GET" && req.url.includes("comments")) {
      if (resourcesMapped?.length > 0) {
        const articles = articlesDb();
        resourcesMapped = resourcesMapped.map((resource) => {
          const article = articles.find((article) => areIdsEqual(article.id, resource.article_id));
          if (article !== undefined && article._inactive === true) {
            return { ...resource, body: "[Article for this comment was removed]", article_id: "[REMOVED]" };
          } else {
            return resource;
          }
        });
      } else {
        const article = articlesDb().find((article) => areIdsEqual(article.id, resourcesMapped.article_id));
        if (article !== undefined && article._inactive === true) {
          resourcesMapped = {
            ...resourcesMapped,
            body: "[Article for this comment was removed]",
            article_id: "[REMOVED]",
          };
        }
      }
    }

    res.jsonp(resourcesMapped);
  } else if (getOriginMethod(req) === "DELETE" && (req.url.includes("articles") || req.url.includes("comments"))) {
    logInsane("RenderResponse: removing body:");
    res.jsonp({});
  } else {
    logTrace("router.render:", {
      statusCode: res.statusCode,
      headersSent: res.headersSent,
      url: req.url,
      method: req.method,
    });
    res.jsonp(res.locals.data);
  }

  if (
    req.method === "POST" &&
    req.url.includes("articles") &&
    isBugEnabled(BugConfigKeys.BUG_404_IF_ARTICLE_CREATED_RECENTLY)
  ) {
    const article = res.locals.data;
    addResourceCreationDate(`articles/${article.id}`);
  }
  if (
    req.method === "POST" &&
    req.url.includes("comments") &&
    isBugEnabled(BugConfigKeys.BUG_404_IF_COMMENT_CREATED_RECENTLY)
  ) {
    const article = res.locals.data;
    addResourceCreationDate(`comments/${article.id}`);
  }
}

exports.renderResponse = renderResponse;
