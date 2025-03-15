const {
  HTTP_OK,
  HTTP_NOT_FOUND,
  HTTP_BAD_REQUEST,
  HTTP_UNAUTHORIZED,
  HTTP_UNPROCESSABLE_ENTITY,
  HTTP_FORBIDDEN,
} = require("../../helpers/response.helpers");
const { formatErrorResponse, generateUuid } = require("../../helpers/helpers");
const { createToken } = require("../../helpers/jwtauth");
const { logTrace, logDebug, logError } = require("../../helpers/logger-api");
const { verifyAccessToken } = require("../../helpers/validation.helpers");
const { areIdsEqual } = require("../../helpers/compare.helpers");
const dataProvider = require("./learning-data.provider");

const maxDataPoints = 60;

const startTime = Date.now();
const metrics = {
  totalRequests: 0,
  errors: 0,
  errorsPerMinute: {
    data: [], // Will store {timestamp: number, value: number} pairs
    maxDataPoints: maxDataPoints,
  },
  endpoints: {},
  requestsPerMinute: {
    data: [], // Will store {timestamp: number, value: number} pairs
    maxDataPoints: maxDataPoints,
  },
};

function trackRequestPerMinute() {
  trackEventsPerMinute(metrics.requestsPerMinute);
}

function trackErrorPerMinute() {
  trackEventsPerMinute(metrics.errorsPerMinute);
}

function trackEventsPerMinute(events) {
  const now = Date.now();
  const currentMinute = Math.floor(now / 60000) * 60000;
  let currentPoint = events.data.find((p) => p.timestamp === currentMinute);

  if (!currentPoint) {
    currentPoint = { timestamp: currentMinute, value: 0 };
    events.data.push(currentPoint);
  }

  currentPoint.value++;

  if (events.data.length > events.maxDataPoints) {
    events.data = events.data.sort((a, b) => b.timestamp - a.timestamp).slice(0, events.maxDataPoints);
  }

  fillMissingDataPoints(events.data, events.maxDataPoints);
}

function fillMissingDataPoints(data, maxDataPoints) {
  const minutes = maxDataPoints;
  const currentTimestamp = Math.floor(Date.now() / 60000) * 60000;
  for (let i = 1; i < minutes; i++) {
    const timestamp = currentTimestamp - i * 60000;
    if (!data.find((p) => p.timestamp === timestamp)) {
      data.push({ timestamp, value: 0 });
    }
  }
}

function handleLearning(req, res) {
  metrics.totalRequests++;
  const endpoint = `${req.method} ${req.url}`;
  metrics.endpoints[endpoint] = (metrics.endpoints[endpoint] || 0) + 1;
  trackRequestPerMinute();

  try {
    const urlEnds = req.url.replace(/\/\/+/g, "/");
    const urlParts = urlEnds.split("/").filter(Boolean);
    const verifyTokenResult = verifyAccessToken(req, res, "learning", req.url);
    const user = dataProvider.getUserByEmail(verifyTokenResult?.email);

    // Restore endpoint before other GET handlers
    // /learning/system/restore
    if (urlParts[1] === "learning" && urlParts[2] === "system") {
      if (req.method === "GET" && urlParts.length === 4 && (urlParts[3] === "restore" || urlParts[3] === "restore2")) {
        try {
          logDebug("Restoring Default Learning database...");

          let result = undefined;
          switch (urlParts[3]) {
            case "restore":
              result = dataProvider.restoreDefaultDatabase();
              break;
            case "restore2":
              result = dataProvider.restoreDatabase();
              break;
            default:
              logDebug("Invalid restore endpoint", { urlParts });
              break;
          }

          if (result === undefined) {
            res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Invalid restore endpoint"));
            return;
          }

          if (result.success) {
            // Recalculate everything after restore
            dataProvider.recalculateStudentsCount();
            dataProvider.recalculateCoursesRating();
            dataProvider.recalculateCoursesDuration();

            res.status(HTTP_OK).send({
              success: true,
              message: "Database restored successfully",
              collections: result.collections,
            });
          } else {
            logError("Failed to restore database", result);
            res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(result.error));
          }
        } catch (error) {
          logError("Failed to restore database", {
            route: "handleLearning",
            error,
            stack: error.stack,
          });
          res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Failed to restore database"));
        }
        return;
      }

      // get all data from the database
      // /learning/system/data
      if (req.method === "GET" && urlParts.length === 4 && urlParts[3] === "data") {
        const backupData = dataProvider.getBackupData();
        res.status(HTTP_OK).send(backupData);
        return;
      }
      // get one table object from the database
      // /learning/system/data/:table
      if (req.method === "GET" && urlParts.length === 5 && urlParts[3] === "data") {
        const table = urlParts[4];
        const backupData = dataProvider.getBackupData();
        if (backupData[table]) {
          res.status(HTTP_OK).send(backupData[table]);
        } else {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Table not found"));
        }
        return;
      }
    }

    if (urlParts[1] === "learning" && urlParts[2] === "health") {
      const healthStatus = {
        status: "OK",
        uptime: Math.floor((Date.now() - startTime) / 1000), // in seconds
        timestamp: new Date().toISOString(),
        services: {
          database: checkDatabaseHealth(),
          api: true,
          auth: verifyAuthServiceHealth(),
        },
      };

      res.status(HTTP_OK).send(healthStatus);
      return;
    }

    if (urlParts[1] === "learning" && urlParts[2] === "metrics") {
      if (!checkIfUserIsAuthenticated(req, res)) {
        res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
        return;
      }

      const user = dataProvider.getUserByEmail(verifyAccessToken(req, res, "learning", req.url)?.email);
      if (!isAdmin(user)) {
        res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Admin access required"));
        return;
      }

      const systemMetrics = {
        ...metrics,
        memory: process.memoryUsage(),
        uptime: Math.floor((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString(),
        requestsPerMinute: {
          data: metrics.requestsPerMinute.data
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((p) => ({
              timestamp: p.timestamp,
              value: p.value,
            })),
          maxDataPoints: metrics.requestsPerMinute.maxDataPoints,
        },
        errorsPerMinute: {
          data: metrics.errorsPerMinute.data
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((p) => ({
              timestamp: p.timestamp,
              value: p.value,
            })),
          maxDataPoints: metrics.errorsPerMinute.maxDataPoints,
        },
      };

      res.status(HTTP_OK).send(systemMetrics);
      return;
    }

    // Check if user is admin
    const isAdminUser = isAdmin(user);

    // Add admin routes
    // /api/learning/admin/
    if (isAdminUser && urlParts[1] === "learning" && urlParts[2] === "admin") {
      // GET admin endpoints
      if (req.method === "GET") {
        switch (urlParts[3]) {
          case "users":
            res.status(HTTP_OK).send(dataProvider.getUsers());
            return;
          case "courses":
            res.status(HTTP_OK).send(dataProvider.getCourses());
            return;
          case "enrollments":
            res.status(HTTP_OK).send(dataProvider.getAllUserEnrollments());
            return;
          case "certificates":
            res.status(HTTP_OK).send(dataProvider.getCertificates());
            return;
          case "ratings":
            res.status(HTTP_OK).send(dataProvider.getUserRatings());
            return;
        }
      }

      // POST admin endpoints
      if (req.method === "POST") {
        switch (urlParts[3]) {
          case "users": {
            // Create new user
            const result = registerNewUser(req.body);
            if (result.success) {
              res.status(HTTP_OK).send({ success: true });
            } else {
              res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse(result.error));
            }
            return;
          }
          case "courses": {
            const newCourse = req.body;
            dataProvider.addCourse(newCourse);
            res.status(HTTP_OK).send({ success: true });
            return;
          }
          case "enrollments": {
            const newEnrollment = req.body;
            dataProvider.addEnrollment(newEnrollment);
            res.status(HTTP_OK).send({ success: true });
            return;
          }
          case "certificates": {
            const newCertificate = req.body;
            dataProvider.addCertificate(newCertificate);
            res.status(HTTP_OK).send({ success: true });
            return;
          }
          case "ratings": {
            const newRating = req.body;
            dataProvider.addUserRating(newRating);
            res.status(HTTP_OK).send({ success: true });
            return;
          }
          case "roles": {
            // assign role to user
            const { userId, role } = req.body;

            if (!Object.values(dataProvider.getRoles()).includes(role)) {
              res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Invalid role"));
              return;
            }

            const user = dataProvider.getUserById(userId);
            if (user) {
              dataProvider.updateUserRole(userId, role);
              res.status(HTTP_OK).send({ success: true });
              return;
            }

            res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
            return;
          }
          case "funds": {
            const { userId, amount } = req.body;
            const user = dataProvider.getUserById(userId);
            if (user) {
              const newAmount = amount;
              updateUserFunds(userId, newAmount);
              res.status(HTTP_OK).send({ success: true });
            } else {
              res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
            }
            return;
          }
          default:
            res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Invalid endpoint"));
            return;
        }
      }

      // PUT admin endpoints
      if (req.method === "PUT") {
        const id = parseInt(urlParts[4]);
        switch (urlParts[3]) {
          case "users": {
            // Update user
            const userData = req.body;
            const user = dataProvider.getUserById(id);

            if (isAdmin(user)) {
              res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Cannot update admin user"));
              return;
            }

            if (user) {
              Object.assign(user, userData);
              res.status(HTTP_OK).send({ success: true });
            } else {
              res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
            }

            return;
          }
          case "courses": {
            // Update course
            const courseData = req.body;
            const course = dataProvider.getCourseById(id);
            if (course) {
              Object.assign(course, courseData);
              res.status(HTTP_OK).send({ success: true });
            } else {
              res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Course not found"));
            }
            return;
          }
        }
      }

      // DELETE admin endpoints
      if (req.method === "DELETE") {
        const id = parseInt(urlParts[4]);
        switch (urlParts[3]) {
          case "users": {
            const result = dataProvider.deactivateUserData(id);

            if (result.success === false) {
              res
                .status(HTTP_UNPROCESSABLE_ENTITY)
                .send(formatErrorResponse(`Failed to deactivate account: ${result.error}`));
              return;
            }

            res.status(HTTP_OK).send({ success: true });
            return;
          }
          case "courses":
            // Implement course deletion logic
            res.status(HTTP_OK).send({ success: true });
            return;
        }
      }
    }

    // Inside handleLearning function, add these new handlers:
    if (urlParts[2] === "roles" && urlParts[3] === "requests") {
      // POST /api/learning/roles/requests - Create new role request
      if (req.method === "POST") {
        if (!checkIfUserIsAuthenticated(req, res)) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const { userId, requestedRole, reason } = req.body;

        if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult?.email)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
          return;
        }

        // Check if user already has a pending request
        const existingRequests = dataProvider.getUserRoleRequests(userId);
        if (existingRequests && existingRequests.length > 0) {
          res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("User already has a pending role request"));
          return;
        }

        const request = dataProvider.addRoleRequest({ userId, requestedRole, reason });
        res.status(HTTP_OK).send(request);
        return;
      }

      // GET /api/learning/roles/requests/user/:id - Get role request by user ID
      if (req.method === "GET" && urlParts[4] === "user") {
        if (!checkIfUserIsAuthenticated(req, res)) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const userId = parseInt(urlParts[5]);
        if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult?.email)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
          return;
        }

        const requests = dataProvider.getUserRoleRequests(userId);
        if (requests) {
          res.status(HTTP_OK).send(requests);
        } else {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Role request not found"));
        }
        return;
      }

      // GET /api/learning/roles/requests - Get all role requests (admin only)
      if (req.method === "GET") {
        if (!checkIfUserIsAuthenticated(req, res)) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const user = dataProvider.getUserByEmail(verifyTokenResult?.email);
        if (!isAdmin(user)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Admin access required"));
          return;
        }

        const requests = dataProvider.getRoleRequests();
        const enhancedRequests = requests.map((req) => {
          const user = dataProvider.getUserById(req.userId);
          return {
            ...req,
            user: {
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              currentRole: user.role,
            },
          };
        });

        res.status(HTTP_OK).send(enhancedRequests);
        return;
      }

      // PUT /api/learning/roles/requests/:requestId - Update role request status (admin only)
      if (req.method === "PUT" && urlParts[4]) {
        if (!checkIfUserIsAuthenticated(req, res)) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const user = dataProvider.getUserByEmail(verifyTokenResult?.email);
        if (!isAdmin(user)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Admin access required"));
          return;
        }

        const requestId = parseInt(urlParts[4]);
        const { status, comment } = req.body;

        const updateRoleRequestSuccess = dataProvider.updateRoleRequest(requestId, { status, comment }, user.id);

        if (!updateRoleRequestSuccess) {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Request not found"));
          return;
        }

        if (status === "approved") {
          const request = dataProvider.getRoleRequestById(requestId);
          const user = dataProvider.getUserById(request.userId);
          dataProvider.updateUserRole(user.id, request.requestedRole);
        }

        console.log(`Role request ${requestId} updated to status: ${status}`);
        res.status(HTTP_OK).send({ success: true, status, });
        return;
      }
    }

    // GET endpoints
    if (req.method === "GET") {
      // Add public certificate endpoint
      // /api/learning/public/certificates/{certificateId}
      if (urlParts[2] === "public" && urlParts[3] === "certificates") {
        const certUuid = urlParts[4];
        const certificate = dataProvider.getCertificate(certUuid);
        if (!certificate) {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Certificate not found"));
          return;
        }

        // Get additional data
        const course = dataProvider.getCourseById(certificate.courseId);
        const user = dataProvider.getUserById(certificate.userId);

        const publicCertData = {
          certificateNumber: certificate.certificateNumber,
          uuid: certificate.uuid,
          courseTitle: certificate.courseTitle,
          recipientName: `${user.firstName} ${user.lastName}`,
          issueDate: certificate.issueDate,
          issuedBy: certificate.issuedBy,
          courseDuration: course.duration,
          courseLevel: course.level,
          issuerTitle: "Course Instructor",
        };

        res.status(HTTP_OK).send(publicCertData);
        return;
      }

      // Add new auth status endpoint before other GET handlers
      // /learning/auth/status
      if (urlParts.length === 4 && urlParts[1] === "learning" && urlParts[2] === "auth" && urlParts[3] === "status") {
        const verifyTokenResult = verifyAccessToken(req, res, "learning", req.url);
        const userExists = verifyTokenResult ? checkIfUserExists(verifyTokenResult.email) : false;

        if (!verifyTokenResult || !userExists) {
          res.status(HTTP_OK).send({ authenticated: false });
          return;
        }

        const user = dataProvider.getUserByEmail(verifyTokenResult.email);
        res.status(HTTP_OK).send({
          authenticated: true,
          user: {
            id: user.id,
            // email: user.email,
            // firstName: user.firstName,
            // lastName: user.lastName,
            // avatar: user.avatar,
          },
        });
        return;
      }

      // Specific endpoints should come before more general ones
      // Get lesson content (most specific)
      // /learning/users/{userId}/courses/{courseId}/lessons/{lessonId}
      if (
        urlParts.length === 7 &&
        urlParts[1] === "learning" &&
        urlParts[2] === "courses" &&
        urlParts[4] === "lessons" &&
        urlParts[6] === "content"
      ) {
        if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const userId = findUserIdByEmail(verifyTokenResult.email);

        const courseId = parseInt(urlParts[3]);
        const canAccess = checkIfUserCanAccessCourse(userId, courseId);

        if (!canAccess) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not enrolled in this course"));
          return;
        }

        const lessonId = parseInt(urlParts[5]);
        const lessons = dataProvider.getCourseLessons(courseId);
        const lesson = lessons?.find((l) => areIdsEqual(l.id, lessonId));

        if (lesson?.content) {
          res.status(HTTP_OK).send({ content: lesson.content });
        } else {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Lesson content not found"));
        }
        return;
      }

      // Get course lessons
      // /learning/courses/{courseId}/lessons
      if (
        urlParts.length === 5 &&
        urlParts[1] === "learning" &&
        urlParts[2] === "courses" &&
        urlParts[4] === "lessons"
      ) {
        if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const courseId = parseInt(urlParts[3]);
        const userId = findUserIdByEmail(verifyTokenResult?.email);

        if (!checkIfUserCanAccessCourse(userId, courseId)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Not authorized to access this course"));
          return;
        }

        const lessons = dataProvider.getCourseLessons(courseId);
        if (lessons) {
          res.status(HTTP_OK).send(lessons);
        } else {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Lessons not found"));
        }
        return;
      }

      // Get all course statistics - students, duration and rating
      // /learning/courses/stats
      if (urlParts.length === 4 && urlParts[1] === "learning" && urlParts[2] === "courses" && urlParts[3] === "stats") {
        const stats = dataProvider.getAllCoursesStats();
        res.status(HTTP_OK).send(stats);
        return;
      }

      // Get course statistics - students, duration and rating
      // /learning/courses/{courseId}/stats
      if (urlParts.length === 5 && urlParts[1] === "learning" && urlParts[2] === "courses" && urlParts[4] === "stats") {
        const courseId = parseInt(urlParts[3]);
        const stats = dataProvider.getOneCourseStats(courseId);
        if (stats) {
          res.status(HTTP_OK).send(stats);
        } else {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Course stats not found"));
        }
        return;
      }

      // Get course preview lessons
      // /learning/courses/{courseId}/lessons/preview
      if (
        urlParts.length === 6 &&
        urlParts[1] === "learning" &&
        urlParts[2] === "courses" &&
        urlParts[4] === "lessons" &&
        urlParts[5] === "preview"
      ) {
        const courseId = parseInt(urlParts[3]);
        const lessons = dataProvider.getCourseLessons(courseId);

        if (lessons) {
          const previewLessons = lessons.slice(0, 3);
          res.status(HTTP_OK).send({ previewLessons, totalLessons: lessons.length });
        } else {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Lessons not found"));
        }
        return;
      }

      // Get course lessons titles only
      // /learning/courses/{courseId}/lessons/titles
      if (
        urlParts.length === 6 &&
        urlParts[1] === "learning" &&
        urlParts[2] === "courses" &&
        urlParts[4] === "lessons" &&
        urlParts[5] === "titles"
      ) {
        const courseId = parseInt(urlParts[3]);
        const lessons = dataProvider.getCourseLessons(courseId);

        if (lessons) {
          const lessonTitles = lessons.map((l) => ({ id: l.id, title: l.title }));
          res.status(HTTP_OK).send(lessonTitles);
        } else {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Lessons not found"));
        }
        return;
      }

      // Get user stats
      // /learning/users/{userId}/stats
      if (urlParts.length === 5 && urlParts[1] === "learning" && urlParts[2] === "users" && urlParts[4] === "stats") {
        if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const userId = parseInt(urlParts[3]);

        if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult?.email)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
          return;
        }

        const stats = dataProvider.getUserStats(userId);
        if (stats) {
          res.status(HTTP_OK).send(stats);
        } else {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User stats not found"));
        }
        return;
      }

      // Get user enrollments
      // /learning/users/{userId}/enrollments
      if (
        urlParts.length === 5 &&
        urlParts[1] === "learning" &&
        urlParts[2] === "users" &&
        urlParts[4] === "enrollments"
      ) {
        if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const userId = parseInt(urlParts[3]);

        if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult?.email)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
          return;
        }
        const enrollments = dataProvider.getUserEnrollments(userId);

        if (enrollments) {
          res.status(HTTP_OK).send(enrollments);
        } else {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Enrollments not found"));
        }
        return;
      }

      // Get user certificates
      // /learning/users/{userId}/certificates
      if (
        urlParts.length === 5 &&
        urlParts[1] === "learning" &&
        urlParts[2] === "users" &&
        urlParts[4] === "certificates"
      ) {
        if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const userId = parseInt(urlParts[3]);

        if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult?.email)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
          return;
        }

        const certificates = dataProvider.getUserCertificates(userId);
        res.status(HTTP_OK).send({ certificates });
        return;
      }

      // Progress endpoints
      // Get lessons progress for a course and user
      // /learning/courses/:courseId/lessons/progress
      if (
        urlParts.length === 6 &&
        urlParts[1] === "learning" &&
        urlParts[2] === "courses" &&
        urlParts[4] === "lessons" &&
        urlParts[5] === "progress"
      ) {
        if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const userId = findUserIdByEmail(verifyTokenResult?.email);
        const courseId = parseInt(urlParts[3]);

        if (checkIfUserCanAccessCourse(userId, courseId) === false) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not enrolled in this course"));
          return;
        }

        const lessons = dataProvider.getCourseLessons(courseId);
        const progress = dataProvider.getLessonProgress(userId, courseId);

        if (lessons && progress) {
          res.status(HTTP_OK).send(progress);
        } else {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Lesson progress not found"));
        }
        return;
      }

      // Get course progress
      // /learning/courses/:courseId/progress
      if (
        urlParts.length === 5 &&
        urlParts[1] === "learning" &&
        urlParts[2] === "courses" &&
        urlParts[4] === "progress"
      ) {
        if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const userId = findUserIdByEmail(verifyTokenResult?.email);

        if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult?.email)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
          return;
        }

        const courseId = parseInt(urlParts[3]);
        const enrollment = dataProvider
          .getUserEnrollments(userId)
          .find((e) => areIdsEqual(e.userId, userId) && areIdsEqual(e.courseId, courseId));
        res.status(HTTP_OK).send({ progress: enrollment?.progress || 0 });
        return;
      }

      // Get course by ID
      // /learning/courses/:courseId
      if (urlParts.length === 4 && urlParts[1] === "learning" && urlParts[2] === "courses") {
        const courseId = parseInt(urlParts[3]);
        const course = dataProvider.getCourseById(courseId);

        if (course) {
          res.status(HTTP_OK).send(course);
        } else {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Course not found"));
        }
        return;
      }

      // Get user by ID
      // /learning/users/:userId
      if (urlParts.length === 4 && urlParts[1] === "learning" && urlParts[2] === "users") {
        if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const userId = parseInt(urlParts[3]);

        if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult?.email)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
          return;
        }

        const user = dataProvider.getUserById(userId);
        if (user) {
          res.status(HTTP_OK).send({ ...user, password: undefined });
        } else {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
        }
        return;
      }

      // Get all entities
      // /learning/courses
      if (urlParts.length === 3 && urlParts[1] === "learning") {
        // TODO: access verification
        switch (urlParts[2]) {
          case "courses":
            res.status(HTTP_OK).send(dataProvider.getCourses());
            return;
        }
      }

      if (urlParts.length === 4 && urlParts[1] === "learning" && urlParts[2] === "quiz" && urlParts[3] === "attempts") {
        res.status(HTTP_OK).send(dataProvider.getQuizAttempts());
        return;
      }

      // Get course ratings
      // /learning/courses/{courseId}/ratings
      if (req.method === "GET" && urlParts.length === 5 && urlParts[4] === "ratings") {
        const courseId = parseInt(urlParts[3]);
        const ratings = dataProvider.getUserRatings().filter((r) => areIdsEqual(r.courseId, courseId));

        // Enhance ratings with user info
        const ratingsWithUserInfo = ratings.map((rating) => {
          const user = dataProvider.getUserById(rating.userId);
          return {
            ...rating,
            userInfo: {
              name: `${user.firstName} ${user.lastName}`,
              avatar: user.avatar,
              id: user.id,
              isPublic: user.isPublic,
            },
          };
        });

        res.status(HTTP_OK).send(ratingsWithUserInfo);
        return;
      }

      // Add new endpoints for role management
      // GET /api/learning/roles - List all roles
      if (req.method === "GET" && urlParts[2] === "roles") {
        // GET /api/learning/roles - List all roles
        if (!checkIfUserIsAuthenticated(req, res)) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const user = dataProvider.getUserByEmail(verifyTokenResult?.email);

        // if (!hasPermission(user, "manage_roles")) {
        //   res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Insufficient permissions"));
        //   return;
        // }

        res.status(HTTP_OK).send({
          roles: Object.values(dataProvider.getRoles()),
        });
        return;
      }

      // Add new GET endpoint handler for user funds
      if (req.method === "GET" && urlParts.length === 5 && urlParts[4] === "funds") {
        if (!checkIfUserIsAuthenticated(req, res)) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const userId = parseInt(urlParts[3]);
        if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult?.email)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
          return;
        }

        const funds = getUserFunds(userId) || 0;
        res.status(HTTP_OK).send({ funds: funds });
        return;
      }

      // Add inside GET section before the final else
      if (urlParts.length === 6 && urlParts[4] === "funds" && urlParts[5] === "history") {
        if (!checkIfUserIsAuthenticated(req, res)) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const userId = parseInt(urlParts[3]);
        if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult?.email)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
          return;
        }

        const history = dataProvider.getFundsHistory(userId);
        history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by timestamp desc

        res.status(HTTP_OK).send({ history });
        return;
      }

      // /api/learning/public/instructor/:instructorId/courses
      if (urlParts[2] === "public" && urlParts[3] === "instructor" && urlParts[5] === "courses") {
        const instructorId = parseInt(urlParts[4]);
        const instructor = dataProvider.getUserById(instructorId);

        if (!instructor || !isInstructor(instructor)) {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Instructor not found"));
          return;
        }

        const courses = dataProvider.getCoursesByInstructorId(instructorId);

        res.status(HTTP_OK).send(courses);
        return;
      }

      // /api/learning/public/instructor/:instructorId/courses
      if (urlParts[2] === "public" && urlParts[3] === "instructor" && urlParts[5] === "stats") {
        const instructorId = parseInt(urlParts[4]);
        const instructor = dataProvider.getUserById(instructorId);

        if (!instructor || !isInstructor(instructor)) {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Instructor not found"));
          return;
        }

        const stats = calculateInstructorStats(instructorId);
        // get only the stats we need
        res.status(HTTP_OK).send({
          totalCourses: stats.totalCourses,
          totalStudents: stats.totalStudents,
          averageRating: stats.averageRating,
        });
        return;
      }

      // /api/learning/public/instructor/:instructorId
      if (urlParts[2] === "public" && urlParts[3] === "instructor" && urlParts.length === 5) {
        const instructorId = parseInt(urlParts[4]);
        const instructor = dataProvider.getUserById(instructorId);

        if (instructor) {
          const { id, firstName, lastName, avatar } = instructor;
          res.status(HTTP_OK).send({ id, firstName, lastName, avatar });
        } else {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Instructor not found"));
        }
        return;
      }

      // GET /api/learning/public/users/:userId
      if (urlParts[2] === "public" && urlParts[3] === "users" && urlParts.length === 5) {
        const userId = parseInt(urlParts[4]);
        const user = dataProvider.getUserById(userId);

        if (!user || user.isPublic !== true) {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Profile not found or is private"));
          return;
        }

        const userEnrollments = dataProvider.getUserEnrollments(userId);
        const userCertificates = dataProvider.getUserCertificates(userId);
        const userRatings = dataProvider.getUserRatings().filter((r) => r.userId === userId);

        const userEnrollmentsBasicData = userEnrollments.map((enrollment) => {
          const course = dataProvider.getCourseById(enrollment.courseId);
          return {
            courseId: enrollment.courseId,
            courseTitle: course.title,
            progress: enrollment.progress,
          };
        });

        const userCertificatesBasicData = userCertificates.map((certificate) => {
          const course = dataProvider.getCourseById(certificate.courseId);
          return {
            courseId: certificate.courseId,
            courseTitle: course.title,
            issueDate: certificate.issueDate,
          };
        });

        const userRatingsBasicData = userRatings.map((rating) => {
          const course = dataProvider.getCourseById(rating.courseId);
          return {
            courseId: rating.courseId,
            courseTitle: course.title,
            rating: rating.rating,
          };
        });

        const { firstName, lastName, avatar, joinDate, role } = user;
        res.status(HTTP_OK).send({
          id: userId,
          firstName,
          lastName,
          avatar,
          joinDate,
          role,
          enrollments: userEnrollmentsBasicData,
          certificates: userCertificatesBasicData,
          ratings: userRatingsBasicData,
        });
        return;
      }
    }

    if (req.method === "GET" || req.method === "POST") {
      // Add instructor endpoints
      // /api/learning/instructor/
      if (urlParts[2] === "instructor") {
        if (!checkIfUserIsAuthenticated(req, res)) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const user = dataProvider.getUserByEmail(verifyTokenResult?.email);

        if (!isInstructor(user)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Must be an instructor"));
          return;
        }

        // Inside handleLearning function, in the POST section where instructor endpoints are handled
        // GET /learning/instructor/:instructorId/courses
        if (urlParts.length === 5 && urlParts[4] === "courses") {
          const instructorId = parseInt(urlParts[3]);
          const courses = dataProvider.getCoursesByInstructorId(instructorId);

          res.status(HTTP_OK).send(courses);
          return;
        }
        // GET /learning/instructor/:instructorId/stats
        if (urlParts.length === 5 && urlParts[4] === "stats") {
          const instructorId = parseInt(urlParts[3]);
          const stats = calculateInstructorStats(instructorId);

          res.status(HTTP_OK).send(stats);
          return;
        }

        const urlPart = urlParts[3].split("?")[0];

        switch (urlPart) {
          // /learning/instructor/stats
          case "stats": {
            const stats = calculateInstructorStats(user.id);
            res.status(HTTP_OK).send(stats);
            return;
          }
          // /learning/instructor/courses
          case "courses": {
            // create new course
            if (req.method === "POST" && urlParts.length === 4) {
              const { title, description, price, level, tags } = req.body;

              if (!title || !description || price === undefined || !level) {
                res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Missing required fields"));
                return;
              }

              if (typeof price !== "number" || price < 0) {
                res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Invalid price"));
                return;
              }

              const maxCourseId = Math.max(...dataProvider.getCourses().map((c) => c.id), 0);
              const newCourse = {
                id: maxCourseId + 1,
                title,
                description,
                thumbnail: "..\\data\\learning\\courses\\default-course.jpg",
                instructor: `${user.firstName} ${user.lastName}`,
                instructorId: user.id,
                level,
                tags: tags || [],
                prerequisites: [],
                price: parseFloat(price),
                learningObjectives: [],
              };

              dataProvider.addCourse(newCourse);
              dataProvider.setCourseLessons(newCourse.id, []);

              res.status(HTTP_OK).send({
                success: true,
                message: "Course created successfully",
                course: newCourse,
              });
              return;
            }

            // check for /api/learning/instructor/courses/:id/lessons
            if (urlParts[5] === "lessons" && req.method === "GET") {
              const courseId = parseInt(urlParts[4]);
              const lessons = dataProvider.getCourseLessons(courseId);
              if (lessons) {
                res.status(HTTP_OK).send(lessons);
              } else {
                res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Lessons not found"));
              }
              return;
            }
            // check for /api/learning/instructor/courses/:id
            else if (urlParts.length === 5) {
              const courseId = parseInt(urlParts[4]);
              const course = dataProvider.getCourseById(courseId);
              if (course) {
                res.status(HTTP_OK).send(course);
              } else {
                res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Course not found"));
              }
              return;
            }
            // check for /api/learning/instructor/courses
            else if (urlParts.length === 4) {
              const courses = dataProvider.getCoursesByInstructorId(user.id);
              res.status(HTTP_OK).send(courses);
              return;
            }
            break;
          }
          // /learning/instructor/analytics
          case "analytics": {
            if (!req.url.includes("?")) {
              res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Missing required query parameters"));
              return;
            }

            const queryParams = new URLSearchParams(req.url.split("?")[1]);
            const courseId = queryParams.get("courseId") || "all";
            const timeRangeBase = parseInt(queryParams.get("timeRange")) || 30;

            const timeRange = Math.min(timeRangeBase, 1100);

            // Get instructor's courses
            const targetCourses =
              courseId === "all"
                ? dataProvider.getCoursesByInstructorId(user.id)
                : dataProvider
                    .getCourses()
                    .filter((course) => areIdsEqual(course.id, courseId) && areIdsEqual(course.instructorId, user.id));

            if (!targetCourses.length) {
              res.status(HTTP_NOT_FOUND).send(formatErrorResponse("No courses found"));
              return;
            }

            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - timeRange);

            try {
              const metrics = {
                enrollments: calculateEnrollmentMetrics(targetCourses, startDate),
                revenue: calculateRevenueMetrics(targetCourses, startDate),
                completion: calculateCompletionMetrics(targetCourses, startDate),
                rating: calculateRatingMetrics(targetCourses, startDate),
              };

              const tables = {
                topCourses: getTopPerformingCourses(targetCourses),
                recentReviews: getRecentReviews(targetCourses, startDate),
              };

              const charts = {
                enrollments: getEnrollmentTrendsFast(targetCourses, timeRange),
                revenue: getRevenueTrendsFast(targetCourses, timeRange),
              };

              res.status(HTTP_OK).send({
                success: true,
                data: { metrics, tables, charts },
              });
              return;
            } catch (error) {
              logError("Analytics error:", {
                route: "handleLearning",
                error,
                stack: error.stack,
              });
              res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Failed to generate analytics"));
              return;
            }
          }
        }
      }
    }

    // POST endpoints
    if (req.method === "POST") {
      // Authentication endpoints
      // /learning/auth/login
      if (urlParts.length === 4 && urlParts[1] === "learning" && urlParts[2] === "auth") {
        switch (urlParts[3]) {
          case "login": {
            const { username, password } = req.body;
            const user = dataProvider.getUserByUsernameAndPassword(username, password);

            if (user) {
              const access_token = createToken({ email: user.email, data: "TBD" }, false, true);
              logDebug("login: access token:", { email: user.email, password, access_token });
              res.status(HTTP_OK).send({
                success: true,
                access_token,
                username: user.username,
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar,
                role: user.role,
              });
            } else {
              const foundUser = dataProvider.getUserByUsername(username);
              if (foundUser) {
                const email = foundUser.email;
                // TODO: Implement rate limiting
              }
              res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Invalid credentials"));
            }
            return;
          }
          // /learning/auth/register
          case "register": {
            const result = registerNewUser(req.body);
            if (result.success) {
              res.status(HTTP_OK).send({ success: true });
            } else {
              res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse(result.error));
            }
            return;
          }
        }
      }

      // Course-related actions
      // /learning/courses/:courseId/:action
      if (urlParts.length >= 5 && urlParts[1] === "learning" && urlParts[2] === "courses") {
        const courseId = parseInt(urlParts[3]);

        switch (urlParts[4]) {
          // Enroll in a course
          // /learning/courses/:courseId/enroll
          case "enroll": {
            if (!checkIfUserIsAuthenticated(req, res)) {
              res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
              return;
            }

            const { userId } = req.body;
            if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult?.email)) {
              res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
              return;
            }

            const course = dataProvider.getCourseById(courseId);
            if (!course) {
              res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Course not found"));
              return;
            }

            // Add instructor check
            const isInstructorOfCourse = dataProvider
              .getCourses()
              .some((course) => areIdsEqual(course.id, courseId) && areIdsEqual(course.instructorId, userId));

            if (isInstructorOfCourse) {
              res.status(HTTP_FORBIDDEN).send({
                success: false,
                error: "instructor_enrollment_error",
                message: "Instructors cannot enroll in their own courses",
              });
              return;
            }

            if (checkIfUserIsEnrolled(userId, courseId)) {
              res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Already enrolled in this course"));
              return;
            }

            // Check if user has enough funds
            const userFunds = getUserFunds(userId);
            if (userFunds < course.price) {
              res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Insufficient funds"));
              return;
            }

            updateUserFunds(userId, -course.price);
            addFundsHistory(userId, course.price, "debit", `Course enrollment: ${course.title}`);

            const enrollment = {
              id: dataProvider.getAllUserEnrollments().length + 1,
              userId,
              courseId,
              enrollmentDate: new Date().toISOString(),
              lastAccessed: new Date().toISOString(),
              progress: 0,
              completed: false,
              paidAmount: course.price,
            };

            dataProvider.addUserEnrollment(enrollment);
            dataProvider.recalculateStudentsCount();

            res.status(HTTP_OK).send({ success: true, enrollment });
            return;
          }
          // /learning/courses/:courseId/certificate
          case "certificate":
            // Add certificate generation logic here
            res.status(HTTP_OK).send({ success: true });
            return;
          // /learning/courses/:courseId/progress
          case "progress": {
            if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
              res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
              return;
            }

            const { userId } = req.body;

            if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult?.email)) {
              res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
              return;
            }

            const { progress } = req.body;
            const enrollment = dataProvider
              .getUserEnrollments(userId)
              .find((e) => areIdsEqual(e.courseId, courseId) && areIdsEqual(e.userId, userId));

            if (enrollment) {
              enrollment.progress = progress;
              res.status(HTTP_OK).send({ success: true, progress });
            } else {
              res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Enrollment not found"));
            }
            return;
          }
        }

        // Lesson-related actions
        // /learning/courses/:courseId/lessons/:lessonId/:action
        if (urlParts.length === 7 && urlParts[4] === "lessons") {
          const lessonId = parseInt(urlParts[5]);

          switch (urlParts[6]) {
            // /learning/courses/:courseId/lessons/:lessonId/complete
            case "complete": {
              const { userId } = req.body;

              if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
                res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
                return;
              }

              if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult?.email)) {
                res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
                return;
              }

              const now = new Date().toISOString();
              dataProvider.addLessonProgress({
                userId,
                courseId,
                lessonId,
                completed: true,
                completedAt: now,
              });

              // Check if all lessons are completed and update enrollment
              const lessons = dataProvider.getCourseLessons(courseId);
              const progress = dataProvider.getLessonProgress(userId, courseId).length;

              const enrollment = dataProvider.getEnrollment(userId, courseId);

              if (enrollment) {
                enrollment.lastAccessed = now;
                enrollment.progress = Math.round((progress / lessons.length) * 100);

                logDebug("Lesson completed:", { progress: enrollment.progress, userId, courseId, lessonId });

                if (enrollment.progress === 100) {
                  logDebug("All lessons completed:", { progress: enrollment.progress, userId, courseId, lessonId });
                  enrollment.completed = true;
                  enrollment.completionDate = now;

                  const existingCertificate = dataProvider
                    .getCertificates()
                    .find((cert) => areIdsEqual(cert.userId, userId) && areIdsEqual(cert.courseId, courseId));

                  if (!existingCertificate) {
                    const course = dataProvider.getCourseById(courseId);
                    const user = dataProvider.getUserById(userId);

                    const maxCertId = dataProvider
                      .getCertificates()
                      .reduce((max, cert) => (cert.id > max ? cert.id : max), 0);
                    dataProvider.addCertificate({
                      id: maxCertId + 1,
                      userId,
                      courseId,
                      issueDate: now,
                      certificateNumber: `CERT-${new Date().getFullYear()}-${String(maxCertId + 1).padStart(3, "0")}`,
                      uuid: generateUuid(),
                      courseTitle: course.title,
                      recipientName: `${user.firstName} ${user.lastName}`,
                      issuedBy: course.instructor,
                    });
                  }
                }
              }

              res.status(HTTP_OK).send({ success: true });
              return;
            }
            // /learning/courses/:courseId/lessons/:lessonId/quiz
            case "quiz": {
              const { userId, answers } = req.body;

              if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
                res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
                return;
              }

              if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult?.email)) {
                res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
                return;
              }

              dataProvider.addQuizAttempt({
                id: dataProvider.getQuizAttempts().length + 1,
                userId,
                courseId,
                lessonId,
                attemptDate: new Date().toISOString(),
                score: Math.floor(Math.random() * 100),
                passed: true,
                answers,
              });

              res.status(HTTP_OK).send({ success: true });
              return;
            }
          }
        }
      }

      // Add inside handleLearning function before the final else
      // /learning/courses/:courseId/rate
      if (req.method === "POST" && urlParts.length === 5 && urlParts[4] === "rate") {
        if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const courseId = parseInt(urlParts[3]);
        const { userId, rating, comment } = req.body;

        if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult?.email)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
          return;
        }

        const course = dataProvider.getCourseById(courseId);
        if (!course) {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Course not found"));
          return;
        }

        // Check if user is enrolled in the course
        const isEnrolled = dataProvider
          .getUserEnrollments(userId)
          .find((e) => areIdsEqual(e.userId, userId) && areIdsEqual(e.courseId, courseId));

        if (!isEnrolled) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not enrolled in this course"));
          return;
        }

        // Remove any existing rating by this user for this course
        const existingRatingIndex = dataProvider
          .getUserRatings()
          .findIndex((r) => areIdsEqual(r.userId, userId) && areIdsEqual(r.courseId, courseId));

        if (existingRatingIndex !== -1) {
          logDebug("Updating existing rating:", { userId, courseId, rating, comment });
          dataProvider.changeUserRating(userId, courseId, rating, comment, new Date().toISOString());
        } else {
          // Add new rating
          logDebug("Adding new rating:", { userId, courseId, rating, comment });
          dataProvider.addUserRating({
            userId,
            courseId,
            rating,
            comment,
            createdAt: new Date().toISOString(),
          });
        }

        // Update course average rating
        dataProvider.recalculateCoursesRating();

        res.status(HTTP_OK).send({ success: true });
        return;
      }

      // Handle account deactivation
      if (urlParts.length === 5 && urlParts[2] === "users" && urlParts[4] === "deactivate") {
        if (!checkIfUserIsAuthenticated(req, res)) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Unauthorized"));
          return;
        }

        const userId = parseInt(urlParts[3]);
        const { password } = req.body;

        if (!password) {
          res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Password is required"));
          return;
        }

        // Verify user exists and password matches
        const user = dataProvider.getUserById(userId);
        if (!user) {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
          return;
        }

        if (user.password !== password) {
          res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Invalid password"));
          return;
        }

        const result = dataProvider.deactivateUserData(userId);

        if (result.success === false) {
          res
            .status(HTTP_UNPROCESSABLE_ENTITY)
            .send(formatErrorResponse(`Failed to deactivate account: ${result.error}`));
          return;
        }

        // Update any methods that read user data to check active status
        dataProvider.recalculateStudentsCount();
        dataProvider.recalculateCoursesRating();

        res.status(HTTP_OK).send({
          success: true,
          message: "Account deactivated successfully",
        });
        return;
      }

      // Add lesson creation endpoint
      // POST /learning/instructor/courses/:courseId/lessons
      if (urlParts[2] === "instructor" && urlParts[3] === "courses" && urlParts[5] === "lessons") {
        if (!checkIfUserIsAuthenticated(req, res)) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const user = dataProvider.getUserByEmail(verifyTokenResult?.email);
        if (!isInstructor(user)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Must be an instructor"));
          return;
        }

        const courseId = parseInt(urlParts[4]);

        // Verify course ownership
        if (!canManageCourse(user, courseId)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Not authorized to manage this course"));
          return;
        }

        let { title, type, duration, content } = req.body;

        if (!title || !type || !content) {
          logDebug("Lesson creation error:", { title, type, content });
          res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Missing required fields (title, type, content)"));
          return;
        }

        const validationError = validateLessonFields({ title, type, duration, content });
        if (validationError) {
          res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(validationError));
          return;
        }

        // check if type is valid
        if (dataProvider.getLessonTypes().includes(type?.toLowerCase()) === false) {
          res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(`Invalid lesson type "${type}"`));
          return;
        }

        // duration is not required for quizzes
        // check duration format HH:MM:SS
        const durationFormatCorrect = duration.match(/^([0-9]{2}:){2}[0-9]{2}$/);

        if (type !== "quiz" && (!duration || !durationFormatCorrect)) {
          res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(`Invalid duration "${duration}"`));
          return;
        }

        if (type === "video") {
          if (!content?.videoUrl?.startsWith("http")) {
            res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(`Invalid video URL "${content?.videoUrl}"`));
            return;
          }
        }

        if (type === "quiz") {
          let quizContent = content;
          try {
            content = JSON.parse(quizContent);
          } catch (error) {
            logDebug("Lesson creation error:", { error });
          }

          if (!Array.isArray(content.questions) || content.questions.length === 0) {
            logDebug("Lesson creation error:", { content });
            res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Invalid quiz content"));
            return;
          }

          duration = undefined;
        }

        const lessons = dataProvider.getCourseLessons(courseId);
        const newLessonId = lessons.length > 0 ? Math.max(...lessons.map((l) => l.id)) + 1 : 1;

        const newLesson = {
          id: newLessonId,
          title,
          type,
          duration,
          content,
        };

        dataProvider.addCourseLesson(courseId, newLesson);

        // Recalculate course duration after adding lesson
        dataProvider.recalculateCoursesDuration();

        res.status(HTTP_OK).send({
          success: true,
          message: "Lesson created successfully",
          lesson: newLesson,
        });
        return;
      }
    }

    // PUT endpoints
    if (req.method === "PUT") {
      // Update user profile
      // /learning/users/{userId}/profile
      if (urlParts.length === 5 && urlParts[1] === "learning" && urlParts[2] === "users" && urlParts[4] === "profile") {
        if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const userId = parseInt(urlParts[3]);
        if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult?.email)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
          return;
        }

        const { firstName, lastName, email, currentPassword, isPublic } = req.body;
        const user = dataProvider.getUserById(userId);

        if (!user) {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
          return;
        }

        if (isAdmin(user)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Cannot update admin user"));
          return;
        }

        // Verify password
        if (!currentPassword || user.password !== currentPassword) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Incorrect password"));
          return;
        }

        // Update user data
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email;
        if (typeof isPublic === "boolean") user.isPublic = isPublic;

        dataProvider.replaceUser(userId, user);

        res.status(HTTP_OK).send({
          success: true,
          message: "Profile updated successfully",
        });
        return;
      }

      // Change password
      // /learning/users/{userId}/password
      if (
        urlParts.length === 5 &&
        urlParts[1] === "learning" &&
        urlParts[2] === "users" &&
        urlParts[4] === "password"
      ) {
        if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const userId = parseInt(urlParts[3]);
        if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult?.email)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
          return;
        }

        const { currentPassword, newPassword } = req.body;
        const user = dataProvider.getUserById(userId);

        if (!user) {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
          return;
        }

        if (isAdmin(user)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Cannot update admin user"));
          return;
        }

        if (user.password !== currentPassword) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Current password is incorrect"));
          return;
        }

        // Update password
        user.password = newPassword;

        res.status(HTTP_OK).send({
          success: true,
          message: "Password changed successfully",
        });
        return;
      }

      // Update user funds
      // /learning/users/{userId}/funds
      if (urlParts.length === 5 && urlParts[1] === "learning" && urlParts[2] === "users" && urlParts[4] === "funds") {
        if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const userId = parseInt(urlParts[3]);
        if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult?.email)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
          return;
        }

        const { amount } = req.body;
        if (typeof amount !== "number" || amount < 0 || amount > 500) {
          res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Invalid amount"));
          return;
        }

        if (updateUserFunds(userId, amount)) {
          res.status(HTTP_OK).send({
            success: true,
            message: "Funds updated successfully",
            newBalance: amount,
          });
        } else {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
        }
        return;
      }

      // Add role assignment endpoint for admins
      // PUT /api/learning/users/{userId}/role
      if (req.method === "PUT" && urlParts[2] === "users" && urlParts[4] === "role") {
        if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const user = dataProvider.getUserByEmail(verifyTokenResult?.email);

        if (!hasPermission(user, "manage_roles")) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Must be an admin to modify roles"));
          return;
        }

        const targetUserId = parseInt(urlParts[3]);
        const { role } = req.body;

        if (!Object.values(dataProvider.getRoles()).includes(role)) {
          res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Invalid role"));
          return;
        }

        const targetUser = dataProvider.getUserById(targetUserId);
        if (!targetUser) {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
          return;
        }

        targetUser.role = role;
        res.status(HTTP_OK).send({ success: true });
        return;
      }

      // Add instructor lesson update endpoint
      // PUT /learning/instructor/courses/:courseId/lessons/:lessonId
      if (
        req.method === "PUT" &&
        urlParts[2] === "instructor" &&
        urlParts[3] === "courses" &&
        urlParts[5] === "lessons"
      ) {
        if (!checkIfUserIsAuthenticated(req, res)) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const user = dataProvider.getUserByEmail(verifyTokenResult?.email);
        if (!isInstructor(user)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Must be an instructor"));
          return;
        }

        const courseId = parseInt(urlParts[4]);
        const lessonId = parseInt(urlParts[6]);

        // Verify course ownership
        if (!canManageCourse(user, courseId)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Not authorized to manage this course"));
          return;
        }

        // Find and update the lesson
        const courseLessons = dataProvider.getCourseLessons(courseId);
        if (!courseLessons) {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Course not found"));
          return;
        }

        const lessonIndex = courseLessons.findIndex((lesson) => areIdsEqual(lesson.id, lessonId));
        if (lessonIndex === -1) {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Lesson not found"));
          return;
        }

        // Update lesson data
        const { title, type, duration, content } = req.body;
        const newLesson = {
          ...courseLessons[lessonIndex],
          title: title || courseLessons[lessonIndex].title,
          type: type || courseLessons[lessonIndex].type,
          duration: duration || courseLessons[lessonIndex].duration,
          content: content || courseLessons[lessonIndex].content,
        };

        dataProvider.updateLesson(courseId, lessonId, newLesson);

        dataProvider.recalculateCoursesDuration();

        res.status(HTTP_OK).send({
          success: true,
          message: "Lesson updated successfully",
        });
        return;
      }
    }

    // DELETE endpoints
    if (req.method === "DELETE") {
      // Add instructor lesson delete endpoint
      // DELETE /learning/instructor/courses/:courseId/lessons/:lessonId
      if (urlParts[2] === "instructor" && urlParts[3] === "courses" && urlParts[5] === "lessons") {
        if (!checkIfUserIsAuthenticated(req, res)) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
          return;
        }

        const user = dataProvider.getUserByEmail(verifyTokenResult?.email);
        if (!isInstructor(user)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Must be an instructor"));
          return;
        }

        const courseId = parseInt(urlParts[4]);
        const lessonId = parseInt(urlParts[6]);

        // Verify course ownership
        if (!canManageCourse(user, courseId)) {
          res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Not authorized to manage this course"));
          return;
        }

        // Find and delete the lesson
        const courseLessons = dataProvider.getCourseLessons(courseId);
        if (!courseLessons) {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Course not found"));
          return;
        }

        const lessonIndex = courseLessons.findIndex((lesson) => areIdsEqual(lesson.id, lessonId));
        if (lessonIndex === -1) {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Lesson not found"));
          return;
        }

        courseLessons.splice(lessonIndex, 1);

        dataProvider.recalculateCoursesDuration();

        res.status(HTTP_OK).send({
          success: true,
          message: "Lesson deleted successfully",
        });
        return;
      }
    }

    res.status(HTTP_NOT_FOUND).send(formatErrorResponse(`Endpoint not found for ${req.method} "${req.url}"`));
  } catch (error) {
    metrics.errors++;
    trackErrorPerMinute();
    logError("Error in handleLearning:", {
      route: "handleLearning",
      error,
      stack: error.stack,
    });
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Internal server error"));
  }
}

function calculateEnrollmentMetrics(courses, startDate) {
  const enrollments = dataProvider
    .getAllUserEnrollments()
    .filter((e) => courses.some((c) => areIdsEqual(c.id, e.courseId)) && new Date(e.enrollmentDate) >= startDate);

  const previousStartDate = new Date(startDate);
  previousStartDate.setDate(startDate.getDate() - (new Date() - startDate) / (1000 * 60 * 60 * 24));

  const previousEnrollments = dataProvider
    .getAllUserEnrollments()
    .filter(
      (e) =>
        courses.some((c) => areIdsEqual(c.id, e.courseId)) &&
        new Date(e.enrollmentDate) >= previousStartDate &&
        new Date(e.enrollmentDate) < startDate
    );

  return {
    total: enrollments.length,
    trend: previousEnrollments.length
      ? Math.round(((enrollments.length - previousEnrollments.length) / previousEnrollments.length) * 100)
      : 0,
  };
}

function calculateRevenueMetrics(courses, startDate) {
  const currentRevenue = dataProvider
    .getAllUserEnrollments()
    .filter((e) => courses.some((c) => areIdsEqual(c.id, e.courseId)) && new Date(e.enrollmentDate) >= startDate)
    .reduce((total, enrollment) => {
      const course = courses.find((c) => areIdsEqual(c.id, enrollment.courseId));
      return total + (enrollment.paidAmount || course?.price || 0);
    }, 0);

  const previousStartDate = new Date(startDate);
  previousStartDate.setDate(startDate.getDate() - (new Date() - startDate) / (1000 * 60 * 60 * 24));

  const previousRevenue = dataProvider
    .getAllUserEnrollments()
    .filter(
      (e) =>
        courses.some((c) => areIdsEqual(c.id, e.courseId)) &&
        new Date(e.enrollmentDate) >= previousStartDate &&
        new Date(e.enrollmentDate) < startDate
    )
    .reduce((total, enrollment) => {
      const course = courses.find((c) => areIdsEqual(c.id, enrollment.courseId));
      return total + (enrollment.paidAmount || course?.price || 0);
    }, 0);

  return {
    total: currentRevenue,
    trend: previousRevenue ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100) : 0,
  };
}

function calculateCompletionMetrics(courses, startDate) {
  const currentCompletedCount = dataProvider
    .getAllUserEnrollments()
    .filter(
      (e) =>
        courses.some((c) => areIdsEqual(c.id, e.courseId)) && e.completed && new Date(e.completionDate) >= startDate
    ).length;

  const currentTotalEnrollments = dataProvider
    .getAllUserEnrollments()
    .filter(
      (e) => courses.some((c) => areIdsEqual(c.id, e.courseId)) && new Date(e.enrollmentDate) >= startDate
    ).length;

  const previousStartDate = new Date(startDate);
  previousStartDate.setDate(startDate.getDate() - (new Date() - startDate) / (1000 * 60 * 60 * 24));

  const previousCompletedCount = dataProvider
    .getAllUserEnrollments()
    .filter(
      (e) =>
        courses.some((c) => areIdsEqual(c.id, e.courseId)) &&
        e.completed &&
        new Date(e.completionDate) >= previousStartDate &&
        new Date(e.completionDate) < startDate
    ).length;

  const previousTotalEnrollments = dataProvider
    .getAllUserEnrollments()
    .filter(
      (e) =>
        courses.some((c) => areIdsEqual(c.id, e.courseId)) &&
        new Date(e.enrollmentDate) >= previousStartDate &&
        new Date(e.enrollmentDate) < startDate
    ).length;

  return {
    completedCount: currentCompletedCount,
    totalEnrollments: currentTotalEnrollments,
    previousCompletedCount,
    previousTotalEnrollments,
    rate: currentTotalEnrollments ? Math.round((currentCompletedCount / currentTotalEnrollments) * 100) : 0,
    trend: previousTotalEnrollments
      ? Math.round(((currentCompletedCount - previousCompletedCount) / previousTotalEnrollments) * 100)
      : 0,
  };
}

function calculateRatingMetrics(courses, startDate) {
  const ratings = dataProvider.getUserRatings().filter((r) => courses.some((c) => areIdsEqual(c.id, r.courseId)));
  const average = ratings.length ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;

  const currentRatings = dataProvider
    .getUserRatings()
    .filter((r) => courses.some((c) => areIdsEqual(c.id, r.courseId)) && new Date(r.createdAt) >= startDate);

  const previousStartDate = new Date(startDate);
  previousStartDate.setDate(startDate.getDate() - (new Date() - startDate) / (1000 * 60 * 60 * 24));

  const previousRatings = dataProvider
    .getUserRatings()
    .filter(
      (r) =>
        courses.some((c) => areIdsEqual(c.id, r.courseId)) &&
        new Date(r.createdAt) >= previousStartDate &&
        new Date(r.createdAt) < startDate
    );

  return {
    average: Number(average.toFixed(1)),
    averageRange: currentRatings.length
      ? Number((currentRatings.reduce((sum, r) => sum + r.rating, 0) / currentRatings.length).toFixed(1))
      : 0,
    trend: previousRatings.length
      ? Math.round(((currentRatings.length - previousRatings.length) / previousRatings.length) * 100)
      : 0,
  };
}

function getTopPerformingCourses(courses) {
  const courseStats = dataProvider.getAllCoursesStats();

  return courses
    .map((course) => ({
      title: course.title,
      enrollments: dataProvider.getAllUserEnrollments().filter((e) => areIdsEqual(e.courseId, course.id)).length,
      revenue:
        course.price * dataProvider.getAllUserEnrollments().filter((e) => areIdsEqual(e.courseId, course.id)).length,
      rating: courseStats.find((s) => areIdsEqual(s.courseId, course.id))?.rating || 0,
    }))
    .sort((a, b) => b.enrollments - a.enrollments)
    .slice(0, 5);
}

function getRecentReviews(courses, startDate) {
  return dataProvider
    .getUserRatings()
    .filter((r) => courses.some((c) => areIdsEqual(c.id, r.courseId)) && new Date(r.createdAt) >= startDate)
    .map((review) => ({
      courseTitle: courses.find((c) => areIdsEqual(c.id, review.courseId)).title,
      rating: review.rating,
      comment: review.comment,
      date: review.createdAt,
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
}

function getEnrollmentTrendsFast(courses, days) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const enrollments = dataProvider.getAllUserEnrollments().filter((e) => new Date(e.enrollmentDate) >= startDate);

  const data = enrollments.map((enrollment) => {
    const date = new Date(enrollment.enrollmentDate).toISOString().split("T")[0];
    return {
      date,
      count: enrollments.filter((e) => new Date(e.enrollmentDate).toISOString().split("T")[0] === date).length,
    };
  });

  return data;
}

function getRevenueTrendsFast(courses, days) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const enrollments = dataProvider.getAllUserEnrollments().filter((e) => new Date(e.enrollmentDate) >= startDate);

  const data = enrollments.map((enrollment) => {
    const date = new Date(enrollment.enrollmentDate).toISOString().split("T")[0];
    const course = courses.find((c) => areIdsEqual(c.id, enrollment.courseId));
    return {
      date,
      amount: enrollments
        .filter((e) => new Date(e.enrollmentDate).toISOString().split("T")[0] === date)
        .reduce((total, e) => total + (e.paidAmount || course?.price || 0), 0),
    };
  });

  return data;
}

function getEnrollmentTrends(courses, days) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const dateRange = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dateRange.push(new Date(d));
  }

  return dateRange.map((date) => {
    const dayStart = new Date(date.setHours(0, 0, 0, 0));
    const dayEnd = new Date(date.setHours(23, 59, 59, 999));

    const count = dataProvider
      .getAllUserEnrollments()
      .filter(
        (e) =>
          courses.some((c) => areIdsEqual(c.id, e.courseId)) &&
          new Date(e.enrollmentDate) >= dayStart &&
          new Date(e.enrollmentDate) <= dayEnd
      ).length;

    return {
      date: date.toISOString().split("T")[0],
      count,
    };
  });
}

function getRevenueTrends(courses, days) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const dateRange = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dateRange.push(new Date(d));
  }

  return dateRange.map((date) => {
    const dayStart = new Date(date.setHours(0, 0, 0, 0));
    const dayEnd = new Date(date.setHours(23, 59, 59, 999));

    const amount = dataProvider
      .getAllUserEnrollments()
      .filter(
        (e) =>
          courses.some((c) => areIdsEqual(c.id, e.courseId)) &&
          new Date(e.enrollmentDate) >= dayStart &&
          new Date(e.enrollmentDate) <= dayEnd
      )
      .reduce((total, enrollment) => {
        const course = courses.find((c) => areIdsEqual(c.id, enrollment.courseId));
        return total + (enrollment.paidAmount || course?.price || 0);
      }, 0);

    return {
      date: date.toISOString().split("T")[0],
      amount,
    };
  });
}

function checkIfUserExists(email) {
  return dataProvider.getUserByEmail(email);
}

function checkIfUserIsAuthenticated(req, res, endpoint = "endpoint", url = "") {
  const verifyTokenResult = verifyAccessToken(req, res, "learning", req.url);
  const userExists = checkIfUserExists(verifyTokenResult?.email);
  return verifyTokenResult && userExists;
}

const checkIfUserIdMatchesEmail = (userId, email) => {
  const user = dataProvider.getUserById(userId);
  return user && user.email === email;
};

function parseDurationToSeconds(duration) {
  if (!duration) {
    return 0;
  }

  const timeParts = duration.split(":");
  if (timeParts.length === 3) {
    return parseInt(timeParts[0]) * 3600 + parseInt(timeParts[1]) * 60 + parseInt(timeParts[2]);
  }
  return parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
}

function roundSecondsToHours(seconds) {
  // round to one decimal place
  return Math.round((seconds / 3600) * 10) / 10;
}

function checkIfUserIsEnrolled(userId, courseId) {
  return dataProvider.getEnrollment(userId, courseId) !== undefined;
}

function checkIfUserCanAccessCourse(userId, courseId) {
  const isEnrolled = checkIfUserIsEnrolled(userId, courseId);
  const course = dataProvider.getCourseById(courseId);
  return isEnrolled || (course && areIdsEqual(course.instructorId, userId));
}

function findUserIdByEmail(email) {
  const user = dataProvider.getUserByEmail(email);
  return user?.id;
}

function getUserFunds(userId) {
  const user = dataProvider.getUserById(userId);
  return user ? user.funds : 0;
}

function addFundsHistory(userId, amount, type, description) {
  dataProvider.addFundsHistory({
    userId,
    amount,
    type,
    description,
  });
}

function updateUserFunds(userId, newAmount) {
  const user = dataProvider.getUserById(userId);
  if (user) {
    const oldAmount = user.funds;
    user.funds = oldAmount + newAmount;

    dataProvider.replaceUser(userId, user);

    if (newAmount > 0) {
      addFundsHistory(userId, newAmount, "credit", "Account top up");
    }

    return true;
  }
  return false;
}

function hasPermission(user, permission) {
  if (!user) return false;
  const userPermissions = dataProvider.getRolePermissions(user.role);
  return userPermissions?.includes(permission);
}

function isInstructor(user) {
  return user?.role === dataProvider.getRoles().INSTRUCTOR;
}

function isAdmin(user) {
  return user?.role === dataProvider.getRoles().ADMIN;
}

function canManageCourse(user, courseId) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (!isInstructor(user)) return false;

  const course = dataProvider.getCourseById(courseId);
  return course && areIdsEqual(course.instructorId, user.id);
}

function calculateInstructorStats(instructorId) {
  const instructorCourses = dataProvider.getCoursesByInstructorId(instructorId);

  const stats = {
    totalCourses: instructorCourses.length,
    totalStudents: 0,
    averageRating: 0,
    totalRevenue: 0,
  };

  instructorCourses.forEach((course) => {
    // Calculate total students
    const courseEnrollments = dataProvider.getAllUserEnrollments().filter((e) => areIdsEqual(e.courseId, course.id));
    stats.totalStudents += courseEnrollments.length;

    // Calculate total revenue
    stats.totalRevenue += courseEnrollments.reduce(
      (total, enrollment) => total + (enrollment.paidAmount || course.price),
      0
    );

    // Calculate average rating
    const courseRatings = dataProvider.getUserRatingsForCourse(course.id);
    if (courseRatings.length > 0) {
      course.avgRating = courseRatings.reduce((total, r) => total + r.rating, 0) / courseRatings.length;
    }
  });

  // Calculate overall average rating
  const coursesWithRatings = instructorCourses.filter((c) => c.avgRating);
  stats.averageRating =
    coursesWithRatings.length > 0
      ? coursesWithRatings.reduce((total, c) => total + c.avgRating, 0) / coursesWithRatings.length
      : 0;

  return stats;
}

function isValidId(id) {
  const parsedId = parseInt(id);
  return !isNaN(parsedId) && parsedId > 0;
}

function validateNewUser(userData) {
  const { username, password, email, firstName, lastName } = userData;

  if (dataProvider.getUserByUsernameOrEmail(username, email)) {
    return { success: false, error: "User already exists with that username or email" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Invalid email format" };
  }

  if (password.length < 1) {
    return { success: false, error: "Password is required" };
  }

  const firstNameRegex = /^[a-zA-Z\s-]{2,}$/;
  if (!firstNameRegex.test(firstName)) {
    return { success: false, error: "Invalid first name format" };
  }

  const lastNameRegex = /^[a-zA-Z\s-]{2,}$/;
  if (!lastNameRegex.test(lastName)) {
    return { success: false, error: "Invalid last name format" };
  }

  const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
  if (!usernameRegex.test(username)) {
    return { success: false, error: "Invalid username format" };
  }

  return { success: true };
}

function registerNewUser(userData) {
  const validationError = validateNewUser(userData);
  if (validationError?.success === false) {
    return validationError;
  }

  const { username, password, email, firstName, lastName, avatar } = userData;
  const maxId = dataProvider.getUsers().reduce((max, user) => (user.id > max ? user.id : max), 0);

  const newUser = {
    id: maxId + 1,
    username,
    email,
    password,
    firstName,
    lastName,
    avatar: avatar || "/data/icons/user.png",
    joinDate: new Date().toISOString(),
    role: "student",
  };

  dataProvider.addUser(newUser);
  return { success: true };
}

function checkDatabaseHealth() {
  try {
    // Verify database connection by attempting to read users
    const users = dataProvider.getUsers();
    return users !== undefined;
  } catch (error) {
    logError("Error in checkDatabaseHealth:", {
      route: "handleLearning",
      error,
      stack: error.stack,
    });
    return false;
  }
}

function verifyAuthServiceHealth() {
  try {
    // Verify auth service by checking if token creation works
    const testToken = createToken({ test: true }, false, true);
    return testToken !== undefined;
  } catch (error) {
    logError("Error in verifyAuthServiceHealth:", {
      route: "handleLearning",
      error,
      stack: error.stack,
    });
    return false;
  }
}

function validateLessonFields(fields) {
  const allowedFields = ["title", "type", "duration", "content"];
  const maxLengths = {
    title: 255,
    type: 50,
    duration: 10,
  };

  const extraFields = Object.keys(fields).filter((field) => !allowedFields.includes(field));
  if (extraFields.length > 0) {
    return `Invalid fields: ${extraFields.join(", ")}`;
  }

  for (const [field, value] of Object.entries(fields)) {
    if (typeof value === "string" && value.length > maxLengths[field]) {
      return `Field "${field}" exceeds maximum length of ${maxLengths[field]} characters`;
    }
  }

  // Validate content based on lesson type
  const { type, content } = fields;
  if (type === "video") {
    if (!content?.videoUrl?.startsWith("http")) {
      return `Invalid video URL "${content?.videoUrl}"`;
    }
    if (!content?.videoUrl?.length > 255) {
      return `Video URL exceeds maximum length of 255 characters`;
    }
    if (!content?.transcript) {
      return "Video content must have a transcript";
    }
    if (content.transcript.length > 32768) {
      return "Video content transcript too long (max 32768 characters)";
    }
  } else if (type === "reading") {
    if (!content?.resources) {
      return "Reading content must have resources";
    }
    if (content.resources.length > 100) {
      return "Too many resources (max 100)";
    }
    if (content.text?.length > 32768) {
      return "Text content too long (max 32768 characters)";
    }
  } else if (type === "quiz") {
    let quizContent = content;
    try {
      quizContent = JSON.parse(content);
    } catch (error) {
      logDebug("Lesson creation error:", { error });
    }

    if (!Array.isArray(quizContent.questions) || quizContent.questions.length === 0) {
      logDebug("Quiz creation error:", { quizContent });
      return "Invalid quiz content";
    }
    for (const question of quizContent.questions) {
      if (!question || !question.options || question.correctAnswer === undefined) {
        logDebug("Quiz question creation error:", question);
        return "Invalid quiz question format";
      }
    }
  }

  return null;
}

dataProvider.recalculateStudentsCount();
dataProvider.recalculateCoursesRating();
dataProvider.recalculateCoursesDuration();

module.exports = {
  handleLearning,
  hasPermission,
  isInstructor,
  isAdmin,
  checkIfUserCanAccessCourse,
  registerNewUser, // Export for testing
  validateNewUser, // Export for testing
  calculateEnrollmentMetrics, // Export for testing
  calculateRevenueMetrics, // Export for testing
  calculateCompletionMetrics, // Export for testing
  calculateRatingMetrics, // Export for testing
  roundSecondsToHours, // Export for testing
  parseDurationToSeconds, // Export for testing
  checkDatabaseHealth,
  verifyAuthServiceHealth,
};
