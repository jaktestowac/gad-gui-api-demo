const jsonServer = require("./json-server");
const { validations } = require("./validators");
const fs = require("fs");
const { createToken, isAuthenticated, prepareCookieMaxAge } = require("./helpers/jwtauth");
const { getConfigValue } = require("./config/config-manager");
const { ConfigKeys } = require("./config/enums");

const cookieparser = require("cookie-parser");
const helmet = require("helmet");
const express = require("express");
const formidable = require("formidable");

const server = jsonServer.create();
const router = jsonServer.router(getConfigValue(ConfigKeys.DB_PATH));
const path = require("path");
const {
  pluginStatuses,
  formatErrorResponse,
  isAnyAdminUser,
  isSuperAdminUser,
  getIdFromUrl,
} = require("./helpers/helpers");
const { logDebug, logError, logTrace } = require("./helpers/logger-api");
const {
  are_all_fields_valid,
  mandatory_non_empty_fields_article,
  all_fields_article,
} = require("./helpers/validation.helpers");
const { articlesDb, commentsDb, userDb, fullDb } = require("./helpers/db.helpers");
const {
  HTTP_UNPROCESSABLE_ENTITY,
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_CREATED,
  HTTP_BAD_REQUEST,
  HTTP_OK,
  HTTP_UNAUTHORIZED,
} = require("./helpers/response.helpers");
const { getRandomVisitsForEntities } = require("./helpers/random-data.generator");
const middlewares = jsonServer.defaults();

const port = process.env.PORT || getConfigValue(ConfigKeys.DEFAULT_PORT);

const visitsPerArticle = getRandomVisitsForEntities(articlesDb());
const visitsPerComment = getRandomVisitsForEntities(commentsDb());
const visitsPerUsers = getRandomVisitsForEntities(userDb());

const customRoutesAfterAuth = (req, res, next) => {
  try {
    if (req.method === "POST" && req.url.endsWith("/api/articles/upload")) {
      const form = new formidable.IncomingForm();
      form.multiples = true;
      let uploadDir = path.join(__dirname, "uploads");
      form.uploadDir = uploadDir;
      let userId = req.headers["userid"];

      form.on("progress", function (bytesReceived, bytesExpected) {
        const uploadSizeLimitBytes = getConfigValue(ConfigKeys.UPLOAD_SIZE_LIMIT_BYTES);
        logDebug("formidable data received:", { bytesReceived, bytesExpected, uploadSizeLimitBytes });
        if (bytesReceived > uploadSizeLimitBytes) {
          throw new Error(`File too big. Actual: ${bytesExpected} bytes, Max: ${uploadSizeLimitBytes} bytes`);
        }
      });
      form.parse(req, async (err, fields, files) => {
        if (err) {
          res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(`There was an error parsing the file: ${err.message}`));
          return;
        }

        const file = files.jsonFile[0];

        // TODO:INVOKE_BUG: same file name might cause file overwrite in parallel scenarios
        const fileName = `uploaded.json`;
        const newFullFilePath = path.join(uploadDir, fileName);

        logDebug("Renaming files:", { file, from: file.filepath, to: newFullFilePath });
        try {
          fs.renameSync(file.filepath, newFullFilePath);
          const fileDataRaw = fs.readFileSync(newFullFilePath, "utf8");
          const fileData = JSON.parse(fileDataRaw);
          fileData["user_id"] = userId;
          const isValid = are_all_fields_valid(fileData, all_fields_article, mandatory_non_empty_fields_article);
          if (!isValid.status) {
            logError("[articles/upload] Error after validation:", { error: isValid.error });
            res
              .status(HTTP_UNPROCESSABLE_ENTITY)
              .send(
                formatErrorResponse(
                  `One of field is invalid (empty, invalid or too long) or there are some additional fields: ${isValid.error}`,
                  all_fields_article
                )
              );
            return;
          }
          req.method = "POST";
          req.url = req.url.replace(`/api/articles/upload`, "/api/articles");
          req.body = fileData;
          next();
        } catch (error) {
          logError("[articles/upload] Error:", error);
          res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("There was an error during file creation"));
          return;
        }
      });
    }
    if (res.headersSent !== true) {
      next();
    }
  } catch (error) {
    logError("Fatal error. Please contact administrator.", {
      error,
      stack: error.stack,
    });
    res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Fatal error. Please contact administrator."));
  }
};

const customRoutes = (req, res, next) => {
  try {
    const urlEnds = req.url.replace(/\/\/+/g, "/");
    if (req.method === "GET" && req.url.endsWith("/restoreDB")) {
      const db = JSON.parse(fs.readFileSync(path.join(__dirname, getConfigValue(ConfigKeys.DB_RESTORE_PATH)), "utf8"));
      router.db.setState(db);
      logDebug("Restore DB was successful");
      res.status(HTTP_CREATED).send({ message: "Database successfully restored" });
    } else if (req.method === "GET" && req.url.endsWith("/restoreEmptyDB")) {
      const db = JSON.parse(
        fs.readFileSync(path.join(__dirname, getConfigValue(ConfigKeys.DB_EMPTY_RESTORE_PATH)), "utf8")
      );
      router.db.setState(db);
      logDebug("Restore empty DB was successful");
      res.status(HTTP_CREATED).send({ message: "Empty Database successfully restored" });
    } else if (req.method === "GET" && req.url.endsWith("/db")) {
      const dbData = fullDb();
      res.json(dbData);
      req.body = dbData;
    } else if (req.method === "GET" && req.url.endsWith("/images/user")) {
      let files = fs.readdirSync(path.join(__dirname, "/public/data/users"));
      files = files.filter((file) => !file.startsWith("face_"));
      res.json(files);
      req.body = files;
    } else if (req.method === "GET" && req.url.endsWith("/images/posts")) {
      const files = fs.readdirSync(path.join(__dirname, "/public/data/images/256"));
      res.json(files);
      req.body = files;
    } else if (req.method === "GET" && req.url.endsWith("/pluginstatuses")) {
      res.json(pluginStatuses);
      req.body = pluginStatuses;
    } else if (req.method === "GET" && req.url.endsWith("/api/visits/articles")) {
      res.json(visitsPerArticle);
      req.body = visitsPerArticle;
    } else if (req.method === "GET" && req.url.endsWith("/api/visits/comments")) {
      res.json(visitsPerComment);
      req.body = visitsPerComment;
    } else if (req.method === "GET" && req.url.endsWith("/api/visits/users")) {
      res.json(visitsPerUsers);
      req.body = visitsPerUsers;
    } else if (req.url.includes("/api/articles") && req.method === "GET") {
      let articleId = getIdFromUrl(urlEnds);

      if (!articleId?.includes("&_") && !articleId?.includes("?") && articleId !== undefined && articleId.length > 0) {
        if (visitsPerArticle[articleId] === undefined) {
          visitsPerArticle[articleId] = 0;
        }

        visitsPerArticle[articleId]++;
        logDebug(`[visits] articleId: "${articleId}" with visits:${visitsPerArticle[articleId]}`);
      }
    } else if (req.url.includes("/api/comments") && req.method === "GET") {
      let commentId = getIdFromUrl(urlEnds);

      if (!commentId?.includes("&_") && !commentId?.includes("?") && commentId !== undefined && commentId.length > 0) {
        if (visitsPerComment[commentId] === undefined) {
          visitsPerComment[commentId] = 0;
        }

        visitsPerComment[commentId]++;
        logDebug(`[visits] commentId: "${commentId}" with visits:${visitsPerComment[commentId]}`);
      }
    } else if (req.url.includes("/api/users") && req.method === "GET") {
      let userId = getIdFromUrl(urlEnds);

      if (!userId?.includes("&_") && !userId?.includes("?") && userId !== undefined && userId.length > 0) {
        if (visitsPerUsers[userId] === undefined) {
          visitsPerUsers[userId] = 0;
        }

        visitsPerUsers[userId]++;
        logDebug(`[visits] userId: "${userId}" with visits:${visitsPerUsers[userId]}`);
      }
    }
    if (res.headersSent !== true) {
      next();
    }
  } catch (error) {
    logError("Fatal error. Please contact administrator.", {
      error,
      stack: error.stack,
    });
    res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Fatal error. Please contact administrator."));
  }
};

server.use(middlewares);
server.use(jsonServer.bodyParser);

// // Register New User
// server.post("/api/register", (req, res) => {
//   logDebug("register endpoint called; request body:");
//   const { email, password } = req.body;

//   if (!validateEmail(email)) {
//     const status = HTTP_UNPROCESSABLE_ENTITY;
//     const message = "Invalid email";
//     res.status(status).json({ status, message });
//     return;
//   }

//   if (isAuthenticated({ email, password }) === true) {
//     const status = HTTP_UNAUTHORIZED;
//     const message = "Email and Password already exist";
//     res.status(status).json({ status, message });
//     return;
//   }

//   fs.readFile(authUserDb, (err, data) => {
//     if (err) {
//       const status = HTTP_UNAUTHORIZED;
//       const message = err;
//       res.status(status).json({ status, message });
//       return;
//     }

//     // Get current users data
//     var data = JSON.parse(data.toString());

//     // Get the id of last user
//     var last_item_id = data.users[data.users.length - 1].id;

//     //Add new user
//     data.users.push({ id: last_item_id + 1, email: email, password: password }); //add some data
//     var writeData = fs.writeFile(authUserDb, JSON.stringify(data), (err, result) => {
//       // WRITE
//       if (err) {
//         const status = HTTP_UNAUTHORIZED;
//         const message = err;
//         res.status(status).json({ status, message });
//         return;
//       }
//     });
//   });

//   // Create token for new user
//   const access_token = createToken({ email, password });
//   logDebug("Access Token:", email, password, access_token);
//   res.status(HTTP_OK).json({ access_token });
// });

// Login to one of the users from ./users.json
server.post("/api/login", (req, res) => {
  const { email, password, keepSignIn } = req.body;
  logDebug("login: endpoint called:", { email, password, keepSignIn });

  let isAdmin = isAnyAdminUser(email, password);
  let isSuperAdmin = isSuperAdminUser(email, password);

  isAdmin = isAdmin || isSuperAdmin;

  if (isAuthenticated({ email, password }) === false && !isAdmin) {
    const message = "Incorrect email or password";
    res.status(HTTP_UNAUTHORIZED).json({ status: HTTP_UNAUTHORIZED, message });
    return;
  }
  const cookieMaxAge = prepareCookieMaxAge(isAdmin, keepSignIn);
  const access_token = createToken({ email, data: "TBD" }, isAdmin, keepSignIn);
  logDebug("login: access token:", { email, password, access_token, cookieMaxAge, isAdmin });
  res.status(HTTP_OK).json({ access_token });
});

server.use(helmet());
server.use(cookieparser());

// allow the express server to read and render the static css file
server.use(express.static(path.join(__dirname, "public", "login")));
server.set("view engine", "ejs");

// render the ejs views
server.set("views", path.join(__dirname, "public", "login"));

server.get("/home", (req, res) => {
  // check if user is logged in, by checking cookie
  let username = req.cookies.username;

  // render the home page
  return res.render("home", {
    username,
  });
});

server.get("/login", (req, res) => {
  // check if there is a msg query
  let bad_auth = req.query.msg ? true : false;

  // get the username
  let username = req.cookies.username;
  if (username) {
    // redirect to welcome
    return res.redirect("/welcome");
  }

  // if there exists, send the error.
  if (bad_auth) {
    return res.render("login", {
      error: "Invalid username or password",
    });
  } else {
    // else just render the login
    return res.render("login");
  }
});

server.get("/welcome", (req, res) => {
  // get the username
  let username = req.cookies.username;
  if (username === undefined) {
    // redirect with a fail msg
    return res.redirect("/login");
  }
  logDebug("Welcome:", { username });
  // render welcome page
  return res.render("welcome", {
    username,
  });
});

server.post("/process_login", (req, res) => {
  let { username, password, keepSignIn } = req.body;
  logDebug("process_login: { email, password, keepSignIn }:", { username, password, keepSignIn });
  let isAdmin = isAnyAdminUser(username, password);
  let isSuperAdmin = isSuperAdminUser(username, password);

  isAdmin = isAdmin || isSuperAdmin;

  if (!isAdmin && isAuthenticated({ email: username, password }) === false) {
    // redirect with a fail msg
    return res.redirect("/login?msg=Invalid username or password");
  }
  const cookieMaxAge = prepareCookieMaxAge(isSuperAdmin, keepSignIn);
  const access_token = createToken({ email: username, data: "TBD" }, isSuperAdmin, keepSignIn);
  logDebug("process_login: { cookieMaxAge, isAdmin, isSuperAdmin }:", { cookieMaxAge, isAdmin, isSuperAdmin });

  let foundUser = undefined;
  if (!isAdmin) {
    foundUser = userDb().find((user) => {
      if (user["email"]?.toString() === username) {
        return user;
      }
    });
  } else {
    foundUser = {
      firstname: getConfigValue(ConfigKeys.ADMIN_USER_EMAIL),
      username: getConfigValue(ConfigKeys.ADMIN_USER_EMAIL),
      id: getConfigValue(ConfigKeys.ADMIN_USER_EMAIL),
      avatar: ".\\data\\users\\face_admin.png",
    };
  }
  logDebug("process_login: Access Token:", { email: username, password, access_token, cookieMaxAge, isAdmin });

  // saving the data to the cookies
  res.cookie("firstname", foundUser.firstname, {
    maxAge: cookieMaxAge,
  });
  res.cookie("username", username, {
    maxAge: cookieMaxAge,
  });
  res.cookie("email", username, {
    maxAge: cookieMaxAge,
  });
  res.cookie("token", access_token, {
    maxAge: cookieMaxAge,
  });
  res.cookie("expires", Date.now() + cookieMaxAge, {
    maxAge: cookieMaxAge,
  });
  res.cookie("id", foundUser.id, {
    maxAge: cookieMaxAge,
  });
  res.cookie("avatar", foundUser.avatar, {
    maxAge: cookieMaxAge,
  });
  // redirect
  return res.redirect("/welcome");
});

server.get("/logout", (req, res) => {
  // clear the cookie
  res.clearCookie("firstname");
  res.clearCookie("username");
  res.clearCookie("email");
  res.clearCookie("token");
  res.clearCookie("id");
  res.clearCookie("avatar");
  // redirect to login
  logDebug("logout");
  return res.redirect("/login");
});

// // server.use(/^(?!\/auth).*$/, (req, res, next) => {
// server.use(/(\/api\/[^vlr]).*$/, (req, res, next) => {
//   let access_token = req.headers.authorization;

//   if (req.method !== "GET") {
//     try {
//       let verifyTokenResult;
//       access_token = access_token.split(" ")[1];
//       verifyTokenResult = verifyToken(access_token);
//       if (verifyTokenResult instanceof Error) {
//         res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse(`Access token not provided: ${verifyTokenResult?.name}`));
//         return;
//       }
//     } catch (err) {
//       res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Error access token is revoked"));
//       return;
//     }
//   }
//   next();
// });

server.use(customRoutes);
server.use(validations);
server.use(customRoutesAfterAuth);
server.use("/api", router);

router.render = function (req, res) {
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
  } else {
    res.jsonp(res.locals.data);
  }
};

var serverApp = server.listen(port, () => {
  logDebug(`Test Custom Data API listening on ${port}!`);
  var address = serverApp.address().address;
  address = address == "::" ? "localhost" : "localhost";
  logDebug(`Visit it on -> http://${address}:${port}`);
  logDebug(`🎉 Your custom REST API service is up and running!!!`);
});
