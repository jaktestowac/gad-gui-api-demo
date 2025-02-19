const DataProxy = require("./db-data.proxy");
const { areIdsEqual } = require("../../helpers/compare.helpers");

const dataProxy = new DataProxy();
const data = dataProxy.getData();

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
  return data.users.find((u) => u.username === username || u.email === email);
}

function getUserByUsernameAndPassword(username, password) {
  return data.users.find((u) => u.username === username && u.password === password);
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
    user.funds = newAmount;
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

function recalculateStudentsCount() {
  data.courses.forEach((course) => {
    course.students =
      data.userEnrollments.filter((e) => areIdsEqual(e.courseId, course.id) && !isInactive(e)).length || 0;
  });
}

function recalculateCoursesRating() {
  data.courses.forEach((course) => {
    const ratings = data.userRatings.filter((r) => areIdsEqual(r.courseId, course.id) && !isInactive(r));
    const totalRating = ratings.reduce((total, rating) => total + rating.rating, 0);
    course.rating = ratings.length > 0 ? Math.round((totalRating / ratings.length) * 10) / 10 : 0;
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
    return true;
  }
  return false;
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
  const courseLessons = data.courseLessons[courseId];
  if (!courseLessons) return false;

  const lessonIndex = courseLessons.findIndex((lesson) => areIdsEqual(lesson.id, lessonId));
  if (lessonIndex === -1) return false;

  courseLessons[lessonIndex] = { ...courseLessons[lessonIndex], ...updates };
  return true;
}

function deactivateUserData(userId) {
  const now = new Date().toISOString();

  if (!getUserById(userId)) return { success: false, error: "User not found" };

  const user = getUserById(userId);
  if (user?.role === "admin") return { success: false, error: "Admin user cannot be deactivated" };

  if (user) {
    user._inactive = true;
    user.deactivatedAt = now;
  }

  const collections = ["userEnrollments", "lessonProgress", "userStats", "certificates", "userRatings", "fundsHistory"];

  collections.forEach((collection) => {
    data[collection]
      .filter((item) => areIdsEqual(item.userId, userId))
      .forEach((item) => {
        item._inactive = true;
        item.deactivatedAt = now;
      });
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

function restoreDatabase() {
  try {
    dataProxy.restoreToDefault();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function getBackupData() {
  return dataProxy.getAllData();
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
  getUserFunds,
  getCertificates,
  getCourseLessons,
  setCourseLessons,
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
  deactivateUserData,
  getUserByUsernameOrEmail,
  getUserByUsernameAndPassword,
  restoreDatabase,
  getBackupData,
};
