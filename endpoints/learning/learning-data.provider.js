const DataProxy = require("./db-data.proxy");
const { areIdsEqual } = require("../../helpers/compare.helpers");
const mockData2 = require("./learning-data-2.mock");
const mockData = require("./learning-data.mock");
const { logTrace, logDebug, logError } = require("../../helpers/logger-api");

const dataProxy = new DataProxy();
const data = dataProxy.getData();

function restoreDefaultDatabase() {
  try {
    dataProxy.setMockDataSource(mockData);
    const result = dataProxy.restoreToDefault();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function restoreDatabase() {
  try {
    dataProxy.setMockDataSource(mockData2);
    const result = dataProxy.restoreToDefault();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function getBackupData() {
  return dataProxy.getAllData();
}

function resetDataProxy() {
  DataProxy.resetInstance();
  // Reinitialize with fresh data
  const newDataProxy = new DataProxy();
  // Force initialization of memory data
  newDataProxy.getMemoryData();
  // Update the global data reference
  Object.assign(data, newDataProxy.getData());
  return newDataProxy;
}

function clearAndReinitializeData() {
  dataProxy.clearAndReinitialize();
  // Update the global data reference
  Object.assign(data, dataProxy.getData());
  return dataProxy;
}

function isInactive(obj) {
  return obj?._inactive === true;
}

function getLessonTypes() {
  return Object.values(data.lessonTypes);
}

function getUserByEmail(email) {
  return data.users.find((u) => u.email === email && !isInactive(u));
}

function getUserByUsernameOrEmail(username, email) {
  return data.users.find((u) => (u.username === username || u.email === email) && !isInactive(u));
}

function getUserByUsernameAndPassword(username, password) {
  return data.users.find((u) => u.username === username && u.password === password && !isInactive(u));
}

function getUserById(userId) {
  return data.users.find((u) => areIdsEqual(u.id, userId) && !isInactive(u));
}

function getCourseById(courseId) {
  return data.courses.find((c) => areIdsEqual(c.id, courseId));
}

function getUserRating(userId, courseId) {
  return data.userRatings.find((r) => areIdsEqual(r.userId, userId) && areIdsEqual(r.courseId, courseId));
}

function getEnrollment(userId, courseId) {
  return data.userEnrollments.find(
    (e) => areIdsEqual(e.userId, userId) && areIdsEqual(e.courseId, courseId) && !isInactive(e)
  );
}

function getAllUserEnrollments() {
  return data.userEnrollments.filter((e) => !isInactive(e));
}

function getUserEnrollments(userId) {
  return data.userEnrollments.filter((e) => areIdsEqual(e.userId, userId) && !isInactive(e));
}

function getCoursesByInstructorId(instructorId) {
  return data.courses.filter((course) => areIdsEqual(course.instructorId, instructorId));
}

function getCourses() {
  return data.courses;
}

function getUserFunds(userId) {
  const user = getUserById(userId);
  return user ? user.funds : 0;
}

function getCourseLessons(courseId) {
  return data.courseLessons[courseId] || [];
}

function setCourseLessons(courseId, lessons) {
  data.courseLessons[courseId] = lessons;
}

function addCourseLesson(courseId, lesson) {
  const lessons = data.courseLessons[courseId];
  lessons.push(lesson);
  data.courseLessons[courseId] = lessons;
}

function getLessonProgress(userId, courseId) {
  return data.lessonProgress.filter(
    (p) => areIdsEqual(p.userId, userId) && areIdsEqual(p.courseId, courseId) && !isInactive(p)
  );
}

function getCertificate(certificateId) {
  return data.certificates.find((c) => areIdsEqual(c.uuid, certificateId));
}

function getUserCertificates(userId) {
  return data.certificates.filter((c) => areIdsEqual(c.userId, userId) && !isInactive(c));
}

function getUserStats(userId) {
  return data.userStats.find((s) => areIdsEqual(s.userId, userId));
}

function getFundsHistory(userId) {
  return data.fundsHistory.filter((f) => areIdsEqual(f.userId, userId) && !isInactive(f));
}

// Data update functions
function updateUserFunds(userId, newAmount) {
  const user = getUserById(userId);
  if (user) {
    const oldAmount = user.funds;
    user.funds = oldAmount + newAmount;
    return true;
  }
  return false;
}

function addFundsHistory({ userId, amount, type, description }) {
  data.fundsHistory.push({
    userId,
    amount,
    type,
    timestamp: new Date().toISOString(),
    description,
  });
}

function addEnrollment(enrollment) {
  data.userEnrollments.push(enrollment);
  recalculateStudentsCount();
}

function addUserRating(rating) {
  data.userRatings.push(rating);
  recalculateCoursesRating();
}

// Add new data access methods
function getUsers() {
  return data.users;
}

function getRoles() {
  return data.roles;
}

function getRolePermissions(role) {
  return data.rolePermissions[role];
}

function getUserFailedLoginAttempts(email) {
  return data.failedLoginAttempts[email];
}

function setUserFailedLoginAttempts(email, attempts) {
  data.failedLoginAttempts[email] = attempts;
}

function getAllCourses() {
  return data.courses;
}

function getQuizAttempts() {
  return data.quizAttempts;
}

function getCourseRatings(courseId) {
  return data.userRatings.filter((r) => areIdsEqual(r.courseId, courseId) && !isInactive(r));
}

function getUserByUsername(username) {
  return data.users.find((u) => u.username === username);
}

function addUser(user) {
  data.users.push(user);
}

function addCourse(course) {
  data.courses.push(course);
  data.courseLessons[course.id] = [];
}

function updateUserRole(userId, role) {
  const user = getUserById(userId);
  if (user) {
    user.role = role;
    replaceUser(userId, user);
    return true;
  }
  return false;
}

function updateUser(userId, userData) {
  const user = getUserById(userId);
  if (user) {
    for (const key in userData) {
      user[key] = userData[key];
    }
    replaceUser(userId, user);
    return true;
  }
  return false;
}

function replaceUser(userId, newUser) {
  const userIndex = data.users.findIndex((u) => areIdsEqual(u.id, userId));
  if (userIndex === -1) {
    logDebug(`User not found: ${userId}`);
    return false;
  }

  data.users[userIndex] = newUser;
  return true;
}

function replaceLesson(courseId, lessonId, newLesson) {
  const courseLessons = data.courseLessons[courseId];
  const lessonIndex = courseLessons.findIndex((lesson) => areIdsEqual(lesson.id, lessonId));
  if (lessonIndex === -1) {
    logDebug(`Lesson was not found: ${lessonId}`);
    return false;
  }

  courseLessons[lessonIndex] = newLesson;
  data.courseLessons[courseId] = courseLessons;
  return true;
}

function replaceCourse(courseId, newCourse) {
  const courseIndex = data.courses.findIndex((c) => areIdsEqual(c.id, courseId));
  if (courseIndex === -1) {
    logDebug(`Course not found: ${courseId}`);
    return false;
  }

  data.courses[courseIndex] = newCourse;
  return true;
}

function addLessonProgress(progress) {
  data.lessonProgress.push(progress);
}

function addQuizAttempt(attempt) {
  data.quizAttempts.push(attempt);
}

function addCertificate(certificate) {
  data.certificates.push(certificate);
}

function updateLesson(courseId, lessonId, updates) {
  const lesson = getCourseLessons(courseId).find((l) => areIdsEqual(l.id, lessonId));
  if (!lesson) {
    return false;
  }

  for (const key in updates) {
    lesson[key] = updates[key];
  }

  return replaceLesson(courseId, lessonId, lesson);
}

function deactivateUserData(userId) {
  const now = new Date().toISOString();

  if (!getUserById(userId)) return { success: false, error: "User not found" };

  const user = getUserById(userId);
  if (user?.role === "admin") return { success: false, error: "Admin user cannot be deactivated" };

  if (user) {
    user._inactive = true;
    user.deactivatedAt = now;
    replaceUser(userId, user);
  }

  const collections = ["userEnrollments", "lessonProgress", "userStats", "certificates", "userRatings", "fundsHistory"];

  collections.forEach((collection) => {
    const coll = data[collection];

    coll
      .filter((item) => areIdsEqual(item.userId, userId))
      .forEach((item) => {
        item._inactive = true;
        item.deactivatedAt = now;
      });

    data[collection] = coll;
  });

  return { success: true };
}

function getUserRatings() {
  return data.userRatings.filter((r) => !isInactive(r));
}

function getUserRatingsForCourse(courseId) {
  return data.userRatings.filter((r) => !isInactive(r) && areIdsEqual(r.courseId, courseId));
}
function getCertificates() {
  return data.certificates.filter((c) => !isInactive(c));
}

function addUserEnrollment(enrollment) {
  data.userEnrollments.push(enrollment);
  recalculateStudentsCount();
}

function changeUserRating(userId, courseId, rating, comment, createdAt) {
  const ratingObj = getUserRating(userId, courseId);
  if (ratingObj) {
    ratingObj.rating = rating;
    ratingObj.comment = comment;
    ratingObj.createdAt = createdAt;
    return true;
  }
  return false;
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

function recalculateStudentsCount() {
  data.courses.forEach((course) => {
    course.students =
      data.userEnrollments.filter((e) => areIdsEqual(e?.courseId, course.id) && !isInactive(e)).length || 0;
  });

  [...data.courses].forEach((course) => {
    replaceCourse(course?.id, course);
  });
}

function recalculateCoursesRating() {
  data.courses.forEach((course) => {
    const ratings = getUserRatingsForCourse(course.id);
    const totalRating = ratings.reduce((total, rating) => total + rating.rating, 0);
    course.rating = ratings.length > 0 ? Math.round((totalRating / ratings.length) * 10) / 10 : 0;
  });

  [...data.courses].forEach((course) => {
    replaceCourse(course.id, course);
  });
}

function recalculateCoursesDuration() {
  data.courses.forEach((course) => {
    const lessons = getCourseLessons(course.id);
    const totalDurationInSeconds = lessons.reduce(
      (total, lesson) => total + parseDurationToSeconds(lesson?.duration),
      0
    );

    course.totalHours = roundSecondsToHours(totalDurationInSeconds);
    course.duration = `${roundSecondsToHours(totalDurationInSeconds)} hour(s)`;
  });

  [...data.courses].forEach((course) => {
    replaceCourse(course.id, course);
  });
}

function recalculateCourseData() {
  recalculateStudentsCount();
  recalculateCoursesRating();
  recalculateCoursesDuration();
}

function getOneCourseStats(courseId) {
  const course = getCourseById(courseId);
  if (!course) {
    return null;
  }

  const lessons = getCourseLessons(courseId);
  const totalDurationInSeconds = lessons.reduce((total, lesson) => total + parseDurationToSeconds(lesson?.duration), 0);
  const totalHours = roundSecondsToHours(totalDurationInSeconds);
  const duration = `${roundSecondsToHours(totalDurationInSeconds)} hour(s)`;

  const ratings = getUserRatingsForCourse(courseId);
  const totalRating = ratings.reduce((total, rating) => total + rating.rating, 0);
  const rating = ratings.length > 0 ? Math.round((totalRating / ratings.length) * 10) / 10 : 0;

  const students = data.userEnrollments.filter((e) => areIdsEqual(e.courseId, courseId) && !isInactive(e)).length || 0;

  return {
    id: course.id,
    title: course.title,
    totalHours,
    duration,
    rating,
    students,
  };
}

function getAllCoursesStats() {
  return data.courses.map((course) => {
    return getOneCourseStats(course.id);
  });
}

function getRoleRequests() {
  return data.roleRequests.filter((r) => !isInactive(r));
}

function getUserRoleRequests(userId, status = "pending") {
  return data.roleRequests.filter((r) => areIdsEqual(r.userId, userId) && r.status === status && !isInactive(r));
}

function addRoleRequest(request) {
  const maxId = Math.max(...data.roleRequests.map((r) => r.id), 0);
  const newRequest = {
    ...request,
    id: maxId + 1,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: null,
    resolvedBy: null,
  };
  data.roleRequests.push(newRequest);
  return newRequest;
}

function updateRoleRequest(requestId, updates, adminId) {
  const request = data.roleRequests.find((r) => areIdsEqual(r.id, requestId));
  if (!request) return false;

  Object.assign(request, {
    ...updates,
    updatedAt: new Date().toISOString(),
    resolvedBy: adminId,
  });

  // replace the request in the data
  const requestIndex = data.roleRequests.findIndex((r) => areIdsEqual(r.id, requestId));
  data.roleRequests[requestIndex] = request;

  return true;
}

module.exports = {
  getUserByEmail,
  getAllUserEnrollments,
  getUserRatingsForCourse,
  getUserById,
  getCourseById,
  getUserRating,
  getEnrollment,
  getUserEnrollments,
  getCoursesByInstructorId,
  getCourses,
  addUserEnrollment,
  getUserRatings,
  changeUserRating,
  getUserFunds,
  getCertificates,
  getCourseLessons,
  setCourseLessons,
  addCourseLesson,
  getLessonProgress,
  getCertificate,
  getUserCertificates,
  getUserStats,
  getFundsHistory,
  updateUserFunds,
  addFundsHistory,
  addEnrollment,
  addUserRating,
  recalculateStudentsCount,
  recalculateCoursesRating,
  recalculateCoursesDuration,
  recalculateCourseData,
  getAllCoursesStats,
  getOneCourseStats,
  getUsers,
  getRoles,
  getRolePermissions,
  getUserFailedLoginAttempts,
  setUserFailedLoginAttempts,
  getAllCourses,
  getQuizAttempts,
  getLessonTypes,
  getCourseRatings,
  getUserByUsername,
  addUser,
  addCourse,
  updateUserRole,
  addLessonProgress,
  addQuizAttempt,
  addCertificate,
  updateLesson,
  updateUser,
  replaceUser,
  deactivateUserData,
  getUserByUsernameOrEmail,
  getUserByUsernameAndPassword,
  restoreDefaultDatabase,
  restoreDatabase,
  getBackupData,
  resetDataProxy,
  clearAndReinitializeData,
  getRoleRequests,
  getUserRoleRequests,
  addRoleRequest,
  updateRoleRequest,
};
