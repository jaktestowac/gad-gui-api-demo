const { isBugEnabled } = require("../config/config-manager");
const { BugConfigKeys } = require("../config/enums");
const { sleep } = require("../helpers/helpers");
const { logTrace } = require("../helpers/logger-api");
const { addResourceCreationDate } = require("../helpers/temp-data-store");

function renderResponse(req, res) {
  if (req.method === "GET" && req.url.includes("users")) {
    const users = res.locals.data;
    let loggedUser = req.cookies.id;
    let usersMapped;
    logTrace("User anonymization:", { length: users.length, loggedUser });
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
    }
    res.jsonp(usersMapped);
  } else if (req.method === "POST" && req.url.includes("users")) {
    // add little wait  so that user is created in DB
    sleep(100).then((x) => {
      res.jsonp(res.locals.data);
    });
  } else {
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

    logTrace("router.render:", {
      statusCode: res.statusCode,
      headersSent: res.headersSent,
      url: req.url,
      method: req.method,
    });
    res.jsonp(res.locals.data);
  }
}

exports.renderResponse = renderResponse;
