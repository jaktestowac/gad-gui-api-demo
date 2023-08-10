const jsonServer = require("./json-server");
const { validations, validateEmail } = require("./validators");
const fs = require("fs");
const { verifyToken, createToken, isAuthenticated, prepareCookieMaxAge } = require("./jwtauth");
const { defaultPort, dbPath, dbRestorePath, dbEmptyRestorePath, adminUserEmail } = require("./config");
const cookieparser = require("cookie-parser");
const helmet = require("helmet");
const express = require("express");
const ejs = require("ejs");

const server = jsonServer.create();
const router = jsonServer.router(dbPath);
const path = require("path");
const { pluginStatuses, formatErrorResponse, isAnyAdminUser, isSuperAdminUser } = require("./helpers");
const { logDebug } = require("./loggerApi");
const { getRandomVisitsForEntities } = require("./randomDataGenerator");
const { hostname } = require("os");
const middlewares = jsonServer.defaults();

const port = process.env.PORT || defaultPort;

const visitsPerArticle = getRandomVisitsForEntities(
  JSON.parse(fs.readFileSync(path.join(__dirname, dbPath), "utf8")).articles
);
const visitsPerComment = getRandomVisitsForEntities(
  JSON.parse(fs.readFileSync(path.join(__dirname, dbPath), "utf8")).comments
);
const visitsPerUsers = getRandomVisitsForEntities(
  JSON.parse(fs.readFileSync(path.join(__dirname, dbPath), "utf8")).users
);

const customRoutes = (req, res, next) => {
  try {
    if (req.method === "GET" && req.url.endsWith("/restoreDB")) {
      const db = JSON.parse(fs.readFileSync(path.join(__dirname, dbRestorePath), "utf8"));
      router.db.setState(db);
      logDebug("Restore DB was successful");
      res.status(201).send({ message: "Database successfully restored" });
    } else if (req.method === "GET" && req.url.endsWith("/restoreEmptyDB")) {
      const db = JSON.parse(fs.readFileSync(path.join(__dirname, dbEmptyRestorePath), "utf8"));
      router.db.setState(db);
      logDebug("Restore empty DB was successful");
      res.status(201).send({ message: "Empty Database successfully restored" });
    } else if (req.method === "GET" && req.url.endsWith("/db")) {
      const dbData = JSON.parse(fs.readFileSync(path.join(__dirname, dbPath), "utf8"));
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
      const urlEnds = req.url.replace(/\/\/+/g, "/");
      const urlParts = urlEnds.split("/");
      let articleId = urlParts[urlParts.length - 1];

      if (!articleId?.includes("&_") && !articleId?.includes("?") && articleId !== undefined && articleId.length > 0) {
        if (visitsPerArticle[articleId] === undefined) {
          visitsPerArticle[articleId] = 0;
        }

        visitsPerArticle[articleId]++;
        logDebug(`[visits] articleId: "${articleId}" with visits:${visitsPerArticle[articleId]}`);
      }
      next();
    } else if (req.url.includes("/api/comments") && req.method === "GET") {
      const urlEnds = req.url.replace(/\/\/+/g, "/");
      const urlParts = urlEnds.split("/");
      let commentId = urlParts[urlParts.length - 1];

      if (!commentId?.includes("&_") && !commentId?.includes("?") && commentId !== undefined && commentId.length > 0) {
        if (visitsPerComment[commentId] === undefined) {
          visitsPerComment[commentId] = 0;
        }

        visitsPerComment[commentId]++;
        logDebug(`[visits] commentId: "${commentId}" with visits:${visitsPerComment[commentId]}`);
      }
      next();
    } else if (req.url.includes("/api/users") && req.method === "GET") {
      const urlEnds = req.url.replace(/\/\/+/g, "/");
      const urlParts = urlEnds.split("/");
      let userId = urlParts[urlParts.length - 1];

      if (!userId?.includes("&_") && !userId?.includes("?") && userId !== undefined && userId.length > 0) {
        if (visitsPerUsers[userId] === undefined) {
          visitsPerUsers[userId] = 0;
        }

        visitsPerUsers[userId]++;
        logDebug(`[visits] userId: "${userId}" with visits:${visitsPerUsers[userId]}`);
      }
      next();
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(formatErrorResponse("Fatal error. Please contact administrator."));
  }
};

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Replace content of two file with another (i.e. db restoration)
function replaceContents(file, replacement, cb) {
  fs.readFile(replacement, (err, contents) => {
    if (err) return cb(err);
    fs.writeFile(file, contents, cb);
  });
}

// // Register New User
// server.post("/api/register", (req, res) => {
//   logDebug("register endpoint called; request body:");
//   const { email, password } = req.body;

//   if (!validateEmail(email)) {
//     const status = 422;
//     const message = "Invalid email";
//     res.status(status).json({ status, message });
//     return;
//   }

//   if (isAuthenticated({ email, password }) === true) {
//     const status = 401;
//     const message = "Email and Password already exist";
//     res.status(status).json({ status, message });
//     return;
//   }

//   fs.readFile(authUserDb, (err, data) => {
//     if (err) {
//       const status = 401;
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
//         const status = 401;
//         const message = err;
//         res.status(status).json({ status, message });
//         return;
//       }
//     });
//   });

//   // Create token for new user
//   const access_token = createToken({ email, password });
//   logDebug("Access Token:", email, password, access_token);
//   res.status(200).json({ access_token });
// });

// Login to one of the users from ./users.json
server.post("/api/login", (req, res) => {
  logDebug("login endpoint called; request body:");
  const { email, password, keepSignIn } = req.body;

  let isAdmin = isAnyAdminUser(email, password);
  let isSuperAdmin = isSuperAdminUser(email, password);

  isAdmin = isAdmin || isSuperAdmin;

  if (isAuthenticated({ email, password }) === false && !isAdmin) {
    const status = 401;
    const message = "Incorrect email or password";
    res.status(status).json({ status, message });
    return;
  }
  const cookieMaxAge = prepareCookieMaxAge(isAdmin, keepSignIn);
  const access_token = createToken({ email, data: "TBD" }, isAdmin, keepSignIn);
  logDebug("Access Token:", { email, password, access_token, cookieMaxAge, isAdmin });
  res.status(200).json({ access_token });
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
  logDebug("{ cookieMaxAge, isAdmin, isSuperAdmin }:", { cookieMaxAge, isAdmin, isSuperAdmin });

  let foundUser = undefined;
  if (!isAdmin) {
    const dbData = fs.readFileSync(path.join(__dirname, dbPath), "utf8");
    const dbDataJson = JSON.parse(dbData);

    foundUser = dbDataJson["users"].find((user) => {
      if (user["email"]?.toString() === username) {
        return user;
      }
    });
  } else {
    foundUser = { firstname: adminUserEmail, username: adminUserEmail, id: adminUserEmail };
  }
  logDebug("Access Token:", { email: username, password, access_token, cookieMaxAge, isAdmin });

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
//         res.status(401).send(formatErrorResponse(`Access token not provided: ${verifyTokenResult?.name}`));
//         return;
//       }
//     } catch (err) {
//       res.status(401).send(formatErrorResponse("Error access token is revoked"));
//       return;
//     }
//   }
//   next();
// });

server.use(customRoutes);
server.use(validations);
server.use("/api", router);

router.render = function (req, res) {
  if (req.method === "GET" && req.url.includes("/users")) {
    const users = res.locals.data;
    let loggedUser = req.cookies.id;
    let usersMapped;
    if (users.length > 0) {
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
  address = address == "::" ? "localhost" : host;
  logDebug(`Visit it on -> http://${address}:${port}`);
  logDebug(`🎉 Your custom REST API service is up and running!!!`);
});
