const { formatErrorResponse, getIdFromUrl, formatInvalidTokenErrorResponse, sleep } = require("../helpers/helpers");
const { logDebug, logError, logTrace, logWarn, logInsane } = require("../helpers/logger-api");
const { getConfigValue, isBugEnabled } = require("../config/config-manager");
const { ConfigKeys, BugConfigKeys } = require("../config/enums");

const { verifyAccessToken } = require("../helpers/validation.helpers");
const { searchForUser, searchForUserWithOnlyToken } = require("../helpers/db-operation.helpers");
const {
  HTTP_UNAUTHORIZED,
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_BAD_REQUEST,
  HTTP_METHOD_NOT_ALLOWED,
  HTTP_SERVICE_UNAVAILABLE,
  HTTP_NOT_FOUND,
} = require("../helpers/response.helpers");
const { handleHangman } = require("../endpoints/hangman-endpoint.helpers");
const { handleQuiz } = require("../endpoints/quiz-endpoint.helpers");
const { handleConfig } = require("../endpoints/config-endpoint.helpers");
const { handleUsers } = require("../endpoints/users-endpoint.helpers");
const { handleArticles } = require("../endpoints/articles-endpoint.helpers");
const { handleComments } = require("../endpoints/comments-endpoint.helpers");
const { handleLikes } = require("../endpoints/likes-endpoint.helpers");
const { handleLabels } = require("../endpoints/labels-endpoint.helpers");
const { handleGames } = require("../endpoints/games-endpoint.helpers");
const { handleScores } = require("../endpoints/scores-endpoint.helpers");
const { handleBookmarks } = require("../endpoints/bookmarks-endpoint.helpers");
const { handleMinesweeper } = require("../endpoints/minesweeper-endpoint.helpers");
const { areStringsEqualIgnoringCase, isUndefined, isInactive } = require("../helpers/compare.helpers");
const { handleSurvey } = require("../endpoints/survey-endpoint.helpers");
const { handleBugEater } = require("../endpoints/bug-eater-endpoint.helpers");
const { handleTicTacToe } = require("../endpoints/tic-tak-toe-endpoint.helpers");
const { handleSudoku } = require("../endpoints/sudoku-endpoint.helpers");
const { getRandomInt } = require("../helpers/generators/random-data.generator");
const { handleMessenger } = require("../endpoints/messenger-endpoint.helpers");
const { handleTeams } = require("../endpoints/teams-endpoint.helpers");
const { handleProjects } = require("../endpoints/projects-endpoint.helpers");
const { handleCaptcha, handleCaptchaVerification } = require("../endpoints/captcha-endpoint.helpers");
const { handleFlashPosts } = require("../endpoints/flashposts-endpoint.helpers");
const { handleData } = require("../endpoints/data-endpoint.helpers");
const { handleBooks } = require("../endpoints/book-shop/books-endpoint.helpers");
const { handleBookAuthors } = require("../endpoints/book-shop/book-authors-endpoint.helpers");
const { handleBookGenres } = require("../endpoints/book-shop/book-genres-endpoint.helpers");
const { handleBookShopAccount } = require("../endpoints/book-shop/book-shop-accounts-endpoint.helpers");
const { handleBookShopRoles } = require("../endpoints/book-shop/book-shop-roles-endpoint.helpers");
const { handleBookShopItems } = require("../endpoints/book-shop/book-shop-items-endpoint.helpers");
const { handleBookShopOrders } = require("../endpoints/book-shop/book-shop-orders-endpoint.helpers");
const {
  handleBookShopAccountPaymentCards,
} = require("../endpoints/book-shop/book-shop-account-payment-cards-endpoint.helpers");
const { handleBookShopOrderStatuses } = require("../endpoints/book-shop/book-shop-order-statuses-endpoint.helpers");
const { handleBookShopManage } = require("../endpoints/book-shop/book-shop-manage-endpoint.helpers");
const { handleBookShopOrdersStats } = require("../endpoints/book-shop/book-shop-order-stats-endpoint.helpers");
const { handleBookShopBookReviews } = require("../endpoints/book-shop/book-shop-book-reviews-endpoint.helpers");
const { searchForBookShopAccountWithUserId } = require("../helpers/db-operations/db-book-shop.operations");
const {
  searchForRoleByUserId,
  getAllAllowedActionsForRole,
} = require("../helpers/db-operations/db-user-roles.operations");
const { userBaseAuth, updateUserActions, getAdminAuth } = require("../helpers/user-auth.helpers");
const { handleBookShopPaymentHistory } = require("../endpoints/book-shop/book-shop-payment-history-endpoint.helpers");
const { handleMaze } = require("../endpoints/maze-endpoint.helpers");
const { handleLearning } = require("../endpoints/learning/learning-endpoint.helpers");
const { handlePractice } = require("../endpoints/practice-endpoint.helpers");

const validationsRoutes = (req, res, next) => {
  let userAuth = userBaseAuth;

  if (req.url.includes("/api/users") && isBugEnabled(BugConfigKeys.BUG_DISABLE_MODULE_USERS)) {
    res.status(HTTP_SERVICE_UNAVAILABLE).send({ message: "Module users is disabled" });
    return;
  }
  if (req.url.includes("/api/articles") && isBugEnabled(BugConfigKeys.BUG_DISABLE_MODULE_ARTICLES)) {
    res.status(HTTP_SERVICE_UNAVAILABLE).send({ message: "Module articles is disabled" });
    return;
  }
  if (req.url.includes("/api/comments") && isBugEnabled(BugConfigKeys.BUG_DISABLE_MODULE_COMMENTS)) {
    res.status(HTTP_SERVICE_UNAVAILABLE).send({ message: "Module comments is disabled" });
    return;
  }

  try {
    const urlEnds = req.url.replace(/\/\/+/g, "/");

    // check if JSON:
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
        logError(`Error: ${JSON.stringify(error)}`);
        res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Bad request - malformed JSON"));
        return;
      }
    }

    // data endpoints
    if (req.url.includes("/api/v1/data") || req.url.includes("/api/v2/data")) {
      handleData(req, res);
      return;
    }

    if (req.url.includes("/api/config")) {
      handleConfig(req, res);
      return;
    }

    if (req.url.includes("/api/practice")) {
      handlePractice(req, res);
      return;
    }

    // check user privileges
    try {
      let verifyTokenResult = verifyAccessToken(req, res, "isSuperAdmin", req.url);
      if (!isUndefined(verifyTokenResult)) {
        if (areStringsEqualIgnoringCase(verifyTokenResult?.email, getConfigValue(ConfigKeys.SUPER_ADMIN_USER_EMAIL))) {
          userAuth = getAdminAuth();
          logTrace("validations: userAuth:", userAuth);
        } else {
          const foundUser = searchForUserWithOnlyToken(verifyTokenResult?.token);
          if (!isUndefined(foundUser)) {
            const role = searchForRoleByUserId(foundUser.id);
            if (!isUndefined(role)) {
              const allActions = getAllAllowedActionsForRole(role.role_id);
              userAuth = updateUserActions(userAuth, allActions);
              logInsane("validations: userAuth:", userAuth);
            }
          }
        }
      }
    } catch (error) {
      logError("Error: check if admin:", {
        error,
      });
    }

    if (isBugEnabled(BugConfigKeys.BUG_SORTING_001)) {
      req.query._limit = 11;
    }
    if (isBugEnabled(BugConfigKeys.BUG_SORTING_002)) {
      req.query._sort = "";
    }
    if (isBugEnabled(BugConfigKeys.BUG_SORTING_003)) {
      req.query._order = "";
    }

    const readOnlyMode = getConfigValue(ConfigKeys.READ_ONLY);

    if (readOnlyMode === true && req.method !== "GET") {
      res.status(HTTP_METHOD_NOT_ALLOWED).send(formatErrorResponse("Method not allowed in READ ONLY MODE"));
      return;
    }

    if (req.url.includes("/api/captcha")) {
      handleCaptcha(req, res);
      return;
    }
    handleCaptchaVerification(req, res);
    if (res.headersSent === true) {
      return;
    }

    if (req.url.includes("/api/games")) {
      handleGames(req, res);
      return;
    }
    if (req.url.includes("/api/scores")) {
      handleScores(req, res);
      return;
    }

    if (req.url.includes("/api/quiz")) {
      handleQuiz(req, res);
    }
    if (req.url.includes("/api/hangman")) {
      handleHangman(req, res);
    }
    if (req.url.includes("/api/minesweeper")) {
      handleMinesweeper(req, res);
    }
    if (req.url.includes("/api/maze")) {
      handleMaze(req, res);
    }
    if (req.url.includes("/api/sudoku")) {
      handleSudoku(req, res);
    }
    if (req.url.includes("/api/bug-eater")) {
      handleBugEater(req, res);
    }
    if (req.url.includes("/api/tic-tac-toe")) {
      handleTicTacToe(req, res);
    }
    if (req.url.includes("/api/bookmarks")) {
      handleBookmarks(req, res);
    }
    if (req.url.includes("/api/survey")) {
      handleSurvey(req, res);
    }
    if (req.url.includes("/api/projects")) {
      handleProjects(req, res);
    }
    if (req.url.includes("/api/teams")) {
      handleTeams(req, res);
    }
    if (req.url.includes("/api/messenger") || req.url.includes("/api/contacts") || req.url.includes("/api/messages")) {
      handleMessenger(req, res);
    }

    if (req.method === "DELETE" && urlEnds.includes("/api/users/")) {
      let userId = getIdFromUrl(urlEnds);
      const foundUser = searchForUser(userId);
      if (isUndefined(foundUser) || isInactive(foundUser)) {
        res.status(HTTP_NOT_FOUND).send({});
        return;
      }
    }

    if (req.url.includes("/api/users")) {
      handleUsers(req, res, userAuth);
    }

    if (req.url.includes("/api/articles") || req.url.includes("/api/random/article")) {
      handleArticles(req, res, userAuth);
    }

    if (req.url.includes("/api/comments")) {
      handleComments(req, res, userAuth);
    }

    if (req.url.includes("/api/likes")) {
      handleLikes(req, res);
    }

    if (req.url.includes("/api/labels") || req.url.includes("/api/article-labels")) {
      handleLabels(req, res);
    }

    if (req.url.includes("/api/flashposts")) {
      handleFlashPosts(req, res);
    }

    if (req.url.includes("/api/learning")) {
      handleLearning(req, res);
    }

    // book-shop endpoints
    if (req.url.includes("/api/book-shop-items")) {
      handleBookShopItems(req, res);
    }
    if (req.url.includes("/api/book-shop-account-payment-cards")) {
      handleBookShopAccountPaymentCards(req, res);
    }

    if (req.url.includes("/api/book-authors")) {
      handleBookAuthors(req, res);
    }
    if (req.url.includes("/api/book-genres")) {
      handleBookGenres(req, res);
    }
    if (req.url.includes("/api/book-shop-accounts") || req.url.includes("/api/book-shop-authorize")) {
      handleBookShopAccount(req, res);
    }
    if (req.url.includes("/api/book-shop-roles")) {
      handleBookShopRoles(req, res);
    }
    if (req.url.includes("/api/book-shop-book-reviews")) {
      handleBookShopBookReviews(req, res);
    }

    if (req.url.includes("/api/book-shop-order-statuses")) {
      handleBookShopOrderStatuses(req, res);
    }
    if (req.url.includes("/api/book-shop-stats")) {
      handleBookShopOrdersStats(req, res);
      return;
    }
    if (req.url.includes("/api/book-shop-orders")) {
      handleBookShopOrders(req, res);
    }
    if (req.url.includes("/api/books")) {
      handleBooks(req, res);
    }
    if (req.url.includes("/api/book-shop-manage")) {
      handleBookShopManage(req, res);
    }
    if (req.url.includes("/api/book-shop-payment-history")) {
      handleBookShopPaymentHistory(req, res);
    }

    logTrace("validationsRoutes: Returning:", {
      statusCode: res.statusCode,
      headersSent: res.headersSent,
      urlEnds,
      url: req.url,
      method: req.method,
      body: req.body,
    });

    if (res.headersSent !== true) {
      logTrace("validationsRoutes:processing with next()...");

      if (req.method === "GET" && urlEnds.includes("api/comments")) {
        let limit = urlEnds.split("_limit=")[1];
        limit = limit?.split("&")[0];
        let timeout = getConfigValue(ConfigKeys.SLEEP_TIME_PER_ONE_GET_COMMENT);
        logTrace(`[DELAY] Getting sleep time:`, { limit, timeout });
        if (!isUndefined(limit)) {
          timeout =
            limit *
            getRandomInt(
              getConfigValue(ConfigKeys.SLEEP_TIME_PER_ONE_GET_COMMENT_MIN),
              getConfigValue(ConfigKeys.SLEEP_TIME_PER_ONE_GET_COMMENT_MAX)
            );
          logDebug(`[DELAY] Waiting for ${timeout} [ms] to load ${limit} comments`);
        }
        logDebug(`[DELAY] Waiting for ${timeout} [ms] for ${urlEnds}`);
        sleep(timeout).then(() => next());
      } else if (req.method === "POST" && urlEnds.endsWith("api/book-shop-accounts")) {
        const timeout = getRandomInt(
          getConfigValue(ConfigKeys.SLEEP_TIME_FOR_SHOP_ACCOUNT_CREATE_MIN),
          getConfigValue(ConfigKeys.SLEEP_TIME_FOR_SHOP_ACCOUNT_CREATE_MAX)
        );

        logDebug(`[DELAY] Waiting for ${timeout} [ms] for ${urlEnds}`);
        sleep(timeout).then(() => {
          if (searchForBookShopAccountWithUserId(req.body.user_id) !== undefined) {
            res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Account already exists"));
            return;
          }
          next();
        });
      } else if (req.method === "GET" && req.url.includes("book-shop-account-payment-cards")) {
        const timeout = getRandomInt(
          getConfigValue(ConfigKeys.SLEEP_TIME_FOR_SHOP_ACCOUNT_PAYMENT_CARDS_MIN),
          getConfigValue(ConfigKeys.SLEEP_TIME_FOR_SHOP_ACCOUNT_PAYMENT_CARDS_MAX)
        );

        logDebug(`[DELAY] Waiting for ${timeout} [ms] for ${urlEnds}`);
        sleep(timeout).then(() => {
          next();
        });
      } else {
        next();
      }
    }
  } catch (error) {
    logError("Fatal error. Please contact administrator.", {
      route: "validationsRoutes",
      error,
      stack: error.stack,
    });
    res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Fatal error. Please contact administrator."));
  }
};

exports.validationsRoutes = validationsRoutes;
