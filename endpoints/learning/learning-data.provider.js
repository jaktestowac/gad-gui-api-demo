const mockData = require("./learning-data.mock");
const { areIdsEqual } = require("../../helpers/compare.helpers");

function isInactive(obj) {
  return obj?._inactive === true;
}

function getLessonTypes() {
  return Object.values(mockData.lessonTypes);
}

function getUserByEmail(email) {
  return mockData.users.find((u) => u.email === email && !isInactive(u));
}

function getUserByUsernameOrEmail(username, email) {
  return mockData.users.find((u) => u.username === username || u.email === email);
}

function getUserByUsernameAndPassword(username, password) {
  return mockData.users.find((u) => u.username === username && u.password === password);
}

function getUserById(userId) {
  return mockData.users.find((u) => areIdsEqual(u.id, userId) && !isInactive(u));
}

function getCourseById(courseId) {
  return mockData.courses.find((c) => areIdsEqual(c.id, courseId));
}

function getUserRating(userId, courseId) {
  return mockData.userRatings.find((r) => areIdsEqual(r.userId, userId) && areIdsEqual(r.courseId, courseId));
}

function getEnrollment(userId, courseId) {
  return mockData.userEnrollments.find(
    (e) => areIdsEqual(e.userId, userId) && areIdsEqual(e.courseId, courseId) && !isInactive(e)
  );
}

function getAllUserEnrollments() {
  return mockData.userEnrollments.filter((e) => !isInactive(e));
}

function getUserEnrollments(userId) {
  return mockData.userEnrollments.filter((e) => areIdsEqual(e.userId, userId) && !isInactive(e));
}

function getCoursesByInstructorId(instructorId) {
  return mockData.courses.filter((course) => areIdsEqual(course.instructorId, instructorId));
}

function getCourses() {
  return mockData.courses;
}

function getUserFunds(userId) {
  const user = getUserById(userId);
  return user ? user.funds : 0;
}

function getCourseLessons(courseId) {
  return mockData.courseLessons[courseId] || [];
}

function setCourseLessons(courseId, lessons) {
  mockData.courseLessons[courseId] = lessons;
}

function getLessonProgress(userId, courseId) {
  return mockData.lessonProgress.filter(
    (p) => areIdsEqual(p.userId, userId) && areIdsEqual(p.courseId, courseId) && !isInactive(p)
  );
}

function getCertificate(certificateId) {
  return mockData.certificates.find((c) => areIdsEqual(c.uuid, certificateId));
}

function getUserCertificates(userId) {
  return mockData.certificates.filter((c) => areIdsEqual(c.userId, userId) && !isInactive(c));
}

function getUserStats(userId) {
  return mockData.userStats.find((s) => areIdsEqual(s.userId, userId));
}

function getFundsHistory(userId) {
  return mockData.fundsHistory.filter((f) => areIdsEqual(f.userId, userId) && !isInactive(f));
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

function addFundsHistory(userId, amount, type, description) {
  mockData.fundsHistory.push({
    userId,
    amount,
    type,
    timestamp: new Date().toISOString(),
    description,
  });
}

function recalculateStudentsCount() {
  mockData.courses.forEach((course) => {
    course.students =
      mockData.userEnrollments.filter((e) => areIdsEqual(e.courseId, course.id) && !isInactive(e)).length || 0;
  });
}

function recalculateCoursesRating() {
  mockData.courses.forEach((course) => {
    const ratings = mockData.userRatings.filter((r) => areIdsEqual(r.courseId, course.id) && !isInactive(r));
    const totalRating = ratings.reduce((total, rating) => total + rating.rating, 0);
    course.rating = ratings.length > 0 ? Math.round((totalRating / ratings.length) * 10) / 10 : 0;
  });
}

function addEnrollment(enrollment) {
  mockData.userEnrollments.push(enrollment);
  recalculateStudentsCount();
}

function addUserRating(rating) {
  mockData.userRatings.push(rating);
  recalculateCoursesRating();
}

// Add new data access methods
function getUsers() {
  return mockData.users;
}

function getRoles() {
  return mockData.roles;
}

function getRolePermissions(role) {
  return mockData.rolePermissions[role];
}

function getUserFailedLoginAttempts(email) {
  return mockData.failedLoginAttempts[email];
}

function setUserFailedLoginAttempts(email, attempts) {
  mockData.failedLoginAttempts[email] = attempts;
}

function getAllCourses() {
  return mockData.courses;
}

function getQuizAttempts() {
  return mockData.quizAttempts;
}

function getCourseRatings(courseId) {
  return mockData.userRatings.filter((r) => areIdsEqual(r.courseId, courseId) && !isInactive(r));
}

function getUserByUsername(username) {
  return mockData.users.find((u) => u.username === username);
}

function addUser(user) {
  mockData.users.push(user);
}

function addCourse(course) {
  mockData.courses.push(course);
  mockData.courseLessons[course.id] = [];
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
  mockData.lessonProgress.push(progress);
}

function addQuizAttempt(attempt) {
  mockData.quizAttempts.push(attempt);
}

function addCertificate(certificate) {
  mockData.certificates.push(certificate);
}

function updateLesson(courseId, lessonId, updates) {
  const courseLessons = mockData.courseLessons[courseId];
  if (!courseLessons) return false;

  const lessonIndex = courseLessons.findIndex((lesson) => areIdsEqual(lesson.id, lessonId));
  if (lessonIndex === -1) return false;

  courseLessons[lessonIndex] = { ...courseLessons[lessonIndex], ...updates };
  return true;
}

function deactivateUserData(userId) {
  const now = new Date().toISOString();

  // Mark user as inactive
  const user = getUserById(userId);
  if (user) {
    user._inactive = true;
    user.deactivatedAt = now;
  }

  // Mark related data as inactive
  mockData.userEnrollments
    .filter((e) => areIdsEqual(e.userId, userId))
    .forEach((e) => {
      e._inactive = true;
      e.deactivatedAt = now;
    });

  mockData.lessonProgress
    .filter((p) => areIdsEqual(p.userId, userId))
    .forEach((p) => {
      p._inactive = true;
      p.deactivatedAt = now;
    });

  mockData.userStats
    .filter((s) => areIdsEqual(s.userId, userId))
    .forEach((s) => {
      s._inactive = true;
      s.deactivatedAt = now;
    });

  mockData.certificates
    .filter((c) => areIdsEqual(c.userId, userId))
    .forEach((c) => {
      c._inactive = true;
      c.deactivatedAt = now;
    });

  mockData.userRatings
    .filter((r) => areIdsEqual(r.userId, userId))
    .forEach((r) => {
      r._inactive = true;
      r.deactivatedAt = now;
    });

  mockData.fundsHistory
    .filter((f) => areIdsEqual(f.userId, userId))
    .forEach((f) => {
      f._inactive = true;
      f.deactivatedAt = now;
    });
}

function getUserRatings() {
  return mockData.userRatings.filter((r) => !isInactive(r));
}

function getUserRatingsForCourse(courseId) {
  return mockData.userRatings.filter((r) => !isInactive(r) && areIdsEqual(r.courseId, courseId));
}
function getCertificates() {
  return mockData.certificates.filter((c) => !isInactive(c));
}

function addUserEnrollment(enrollment) {
  mockData.userEnrollments.push(enrollment);
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
};
