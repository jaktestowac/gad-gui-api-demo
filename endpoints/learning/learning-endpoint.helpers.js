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
const { logTrace, logDebug } = require("../../helpers/logger-api");
const { verifyAccessToken } = require("../../helpers/validation.helpers");
const { areIdsEqual } = require("../../helpers/compare.helpers");
const dataProvider = require("./learning-data.provider");

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

function recalculateStudentsCount() {
  dataProvider.getCourses().forEach((course) => {
    course.students =
      dataProvider.getAllUserEnrollments().filter((e) => areIdsEqual(e.courseId, course.id)).length || 0;
  });
}

function recalculateCoursesRating() {
  dataProvider.getCourses().forEach((course) => {
    const ratings = dataProvider.getUserRatingsForCourse(course.id);
    const totalRating = ratings.reduce((total, rating) => total + rating.rating, 0);
    // round it to 1 decimal place
    course.rating = ratings.length > 0 ? Math.round((totalRating / ratings.length) * 10) / 10 : 0;
  });
}

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

function recalculateCoursesDuration() {
  dataProvider.getCourses().forEach((course) => {
    const lessons = dataProvider.getCourseLessons(course.id);
    const totalDurationInSeconds = lessons.reduce(
      (total, lesson) => total + parseDurationToSeconds(lesson?.duration),
      0
    );

    course.totalHours = roundSecondsToHours(totalDurationInSeconds);
    course.duration = `${roundSecondsToHours(totalDurationInSeconds)} hour(s)`;
  });
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

recalculateStudentsCount();
recalculateCoursesRating();
recalculateCoursesDuration();

function getUserFunds(userId) {
  const user = dataProvider.getUserById(userId);
  return user ? user.funds : 0;
}

function addFundsHistory(userId, amount, type, description) {
  dataProvider.addFundsHistory({
    userId,
    amount,
    type,
    timestamp: new Date().toISOString(),
    description,
  });
}

function updateUserFunds(userId, newAmount) {
  const user = dataProvider.getUserById(userId);
  if (user) {
    const oldAmount = user.funds;
    user.funds = newAmount;

    // If it's a top up (new amount > old amount)
    if (newAmount > oldAmount) {
      addFundsHistory(userId, newAmount - oldAmount, "credit", "Account top up");
    }

    return true;
  }
  return false;
}

// Add helper functions for role checks
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

function handleLearning(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");
  const urlParts = urlEnds.split("/").filter(Boolean);
  const verifyTokenResult = verifyAccessToken(req, res, "learning", req.url);

  // GET endpoints
  if (req.method === "GET") {
    // Add public certificate endpoint
    // /api/certificates/public/{certificateId}
    if (urlParts[2] === "certificates" && urlParts[3] === "public") {
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
    if (urlParts.length === 5 && urlParts[1] === "learning" && urlParts[2] === "courses" && urlParts[4] === "lessons") {
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
        .getUserEnrollments()
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

      if (!hasPermission(user, "manage_roles")) {
        res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Insufficient permissions"));
        return;
      }

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
              duration: "0 hours",
              totalHours: 0,
              level,
              students: 0,
              rating: 0,
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
          const timeRange = parseInt(queryParams.get("timeRange")) || 30;

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

          // Calculate date range
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
              enrollments: getEnrollmentTrends(targetCourses, timeRange),
              revenue: getRevenueTrends(targetCourses, timeRange),
            };

            res.status(HTTP_OK).send({
              success: true,
              data: { metrics, tables, charts },
            });
          } catch (error) {
            logDebug("Analytics error:", error);
            res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Failed to generate analytics"));
          }
          break;
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
          const { username, password, email, avatar, firstName, lastName } = req.body;

          if (dataProvider.getUserByUsernameOrEmail(username, email)) {
            res
              .status(HTTP_UNPROCESSABLE_ENTITY)
              .send(formatErrorResponse("User already exists with that username or email"));
            return;
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Invalid email format"));
            return;
          }

          if (password.length < 1) {
            res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Password must be at least 1 characters"));
            return;
          }

          const firstNameRegex = /^[a-zA-Z\s-]{2,}$/;
          if (!firstNameRegex.test(firstName)) {
            res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Invalid first name format"));
            return;
          }

          const lastNameRegex = /^[a-zA-Z\s-]{2,}$/;
          if (!lastNameRegex.test(lastName)) {
            res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Invalid last name format"));
            return;
          }

          const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
          if (!usernameRegex.test(username)) {
            res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Invalid username format"));
            return;
          }

          const maxId = dataProvider.getUsers().reduce((max, user) => (user.id > max ? user.id : max), 0);

          const newUser = {
            id: maxId + 1,
            username,
            email,
            password,
            firstName,
            lastName,
            avatar: avatar || "/data/icons/user.png", // Use selected avatar or default
            joinDate: new Date().toISOString(),
            role: "student",
          };
          dataProvider.addUser(newUser);
          res.status(HTTP_OK).send({ success: true });
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

          updateUserFunds(userId, userFunds - course.price);
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
          recalculateStudentsCount();

          res.status(HTTP_OK).send({ success: true, enrollment });
          return;
        }
        // /learning/courses/:courseId/certificate
        case "certificate":
          // Add certificate generation logic here
          res.status(HTTP_OK).send({ success: true });
          return;
        // /learning/courses/:courseId/complete
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
            .getUserEnrollments()
            .find((e) => areIdsEqual(e.courseId, courseId) && areIdsEqual(e.userId, userId));

          if (enrollment) {
            enrollment.progress = progress;
            res.status(HTTP_OK).send({ success: true });
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
        .getUserEnrollments()
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
        dataProvider.removeUserRating(existingRatingIndex);
      }

      // Add new rating
      dataProvider.addUserRating({
        userId,
        courseId,
        rating,
        comment,
        createdAt: new Date().toISOString(),
      });

      // Update course average rating
      recalculateCoursesRating();

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

      dataProvider.deactivateUserData(userId);

      // Update any methods that read user data to check active status
      recalculateStudentsCount();
      recalculateCoursesRating();

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

      const { title, type, duration, content } = req.body;
      if (!title || !type || !content) {
        res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Missing required fields (title, type, content)"));
        return;
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
          if (!Array.isArray(content) || content.length === 0) {
            return "Invalid quiz content";
          }
          for (const question of content) {
            if (!question.question || !question.answers || !question.correctAnswer) {
              return "Invalid quiz question format";
            }
          }
        }

        return null;
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
      if (type !== "quiz" && (!duration || typeof duration !== "number" || duration < 0)) {
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
        if (!Array.isArray(content) || content.length === 0) {
          res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Invalid quiz content"));
          return;
        }

        for (const question of content) {
          if (!question.question || !question.answers || !question.correctAnswer) {
            res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Invalid quiz question format"));
            return;
          }
        }
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

      lessons.push(newLesson);
      dataProvider.setCourseLessons(courseId, lessons);

      // Recalculate course duration after adding lesson
      recalculateCoursesDuration();

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

      const { firstName, lastName, email, currentPassword } = req.body;
      const user = dataProvider.getUserById(userId);

      if (!user) {
        res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
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

      res.status(HTTP_OK).send({
        success: true,
        message: "Profile updated successfully",
      });
      return;
    }

    // Change password
    // /learning/users/{userId}/password
    if (urlParts.length === 5 && urlParts[1] === "learning" && urlParts[2] === "users" && urlParts[4] === "password") {
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
      courseLessons[lessonIndex] = {
        ...courseLessons[lessonIndex],
        title: title || courseLessons[lessonIndex].title,
        type: type || courseLessons[lessonIndex].type,
        duration: duration || courseLessons[lessonIndex].duration,
        content: content || courseLessons[lessonIndex].content,
      };

      // Recalculate course duration after updating lesson
      recalculateCoursesDuration();

      res.status(HTTP_OK).send({
        success: true,
        message: "Lesson updated successfully",
      });
      return;
    }
  }

  res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Endpoint not found"));
}

// Add these helper functions at the bottom of the file
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
  return courses
    .map((course) => ({
      title: course.title,
      enrollments: dataProvider.getAllUserEnrollments().filter((e) => areIdsEqual(e.courseId, course.id)).length,
      revenue:
        course.price * dataProvider.getAllUserEnrollments().filter((e) => areIdsEqual(e.courseId, course.id)).length,
      rating: course.rating,
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
      date: date.toLocaleDateString(),
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
      date: date.toLocaleDateString(),
      amount,
    };
  });
}

module.exports = {
  handleLearning,
  hasPermission,
  isInstructor,
  isAdmin,
  checkIfUserCanAccessCourse,
};
