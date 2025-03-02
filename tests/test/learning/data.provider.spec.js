const { expect, faker } = require("../../config.js");
const { gracefulQuit } = require("../../helpers/helpers.js");
const dataProvider = require("../../../endpoints/learning/learning-data.provider.js");

describe("Learning Data Provider", () => {
  after(() => {
    gracefulQuit();
  });

  describe("User Management", () => {
    it("should get user by email", () => {
      const user = dataProvider.getUserByEmail("michael.scott@test.test.com");
      expect(user).to.exist;
      expect(user.username).to.equal("user");
    });

    it("should get user by id", () => {
      const user = dataProvider.getUserById(1);
      expect(user).to.exist;
      expect(user.email).to.equal("michael.scott@test.test.com");
    });

    it("should not return inactive users", () => {
      // First deactivate a user
      dataProvider.deactivateUserData(3);
      const user = dataProvider.getUserById(3);
      expect(user).to.be.undefined;
    });
  });

  describe("Course Management", () => {
    it("should get course by id", () => {
      const course = dataProvider.getCourseById(1);
      expect(course).to.exist;
      expect(course.title).to.include("Web Development");
    });

    it("should get instructor courses", () => {
      const courses = dataProvider.getCoursesByInstructorId(2);
      expect(courses).to.be.an("array");
      expect(courses.length).to.be.greaterThan(0);
      expect(courses[0].instructorId).to.equal(2);
    });

    it("should get course lessons", () => {
      const lessons = dataProvider.getCourseLessons(1);
      expect(lessons).to.be.an("array");
      expect(lessons.length).to.be.greaterThan(0);
      expect(lessons[0]).to.have.property("title");
    });
  });

  describe("Enrollment Management", () => {
    it("should get user enrollments", () => {
      const enrollments = dataProvider.getUserEnrollments(1);
      expect(enrollments).to.be.an("array");
      expect(enrollments.length).to.be.greaterThan(0);
      expect(enrollments[0].userId).to.equal(1);
    });

    it("should not return inactive enrollments", () => {
      // First deactivate a user which should deactivate their enrollments
      dataProvider.deactivateUserData(3);
      const enrollments = dataProvider.getUserEnrollments(3);
      expect(enrollments).to.be.empty;
    });

    it("should get enrollment by user and course", () => {
      const enrollment = dataProvider.getEnrollment(1, 1);
      expect(enrollment).to.exist;
      expect(enrollment.userId).to.equal(1);
      expect(enrollment.courseId).to.equal(1);
    });
  });

  describe("Progress and Completion", () => {
    it("should get lesson progress", () => {
      const progress = dataProvider.getLessonProgress(1, 1);
      expect(progress).to.be.an("array");
      expect(progress.length).to.be.greaterThan(0);
    });

    it("should get certificates", () => {
      const certificates = dataProvider.getUserCertificates(1);
      expect(certificates).to.be.an("array");
      expect(certificates.length).to.be.greaterThan(0);
    });

    it("should get user stats", () => {
      const stats = dataProvider.getUserStats(1);
      expect(stats).to.exist;
      expect(stats).to.have.property("completedCourses");
    });
  });

  describe("Ratings and Reviews", () => {
    it("should get course ratings", () => {
      const ratings = dataProvider.getUserRatingsForCourse(1);
      expect(ratings).to.be.an("array");
      expect(ratings.length).to.be.greaterThan(0);
    });

    it("should not return inactive ratings", () => {
      // First deactivate a user which should deactivate their ratings
      dataProvider.deactivateUserData(3);
      const ratings = dataProvider.getUserRatingsForCourse(1).filter((r) => r.userId === 3);
      expect(ratings).to.be.empty;
    });
  });

  describe("Funds Management", () => {
    it("should get user funds", () => {
      const funds = dataProvider.getUserFunds(1);
      expect(funds).to.be.a("number");
    });

    it("should get funds history", () => {
      const history = dataProvider.getFundsHistory(1);
      expect(history).to.be.an("array");
      expect(history.length).to.be.greaterThan(0);
    });

    it("should not return inactive fund history", () => {
      // First deactivate a user which should deactivate their fund history
      dataProvider.deactivateUserData(3);
      const history = dataProvider.getFundsHistory(3);
      expect(history).to.be.empty;
    });
  });

  describe("User Account Management", () => {
    it("should find user by username and password", () => {
      const user = dataProvider.getUserByUsernameAndPassword("user", "demo");
      expect(user).to.exist;
      expect(user.username).to.equal("user");
      expect(user.email).to.equal("michael.scott@test.test.com");
    });

    it("should not find user with incorrect password", () => {
      const user = dataProvider.getUserByUsernameAndPassword("user", "wrongpassword");
      expect(user).to.be.undefined;
    });

    it("should find user by username or email", () => {
      const userByUsername = dataProvider.getUserByUsernameOrEmail("user", null);
      expect(userByUsername).to.exist;
      expect(userByUsername.username).to.equal("user");

      const userByEmail = dataProvider.getUserByUsernameOrEmail(null, "michael.scott@test.test.com");
      expect(userByEmail).to.exist;
      expect(userByEmail.email).to.equal("michael.scott@test.test.com");
    });

    it("should get user failed login attempts", () => {
      const email = "test@example.com";
      dataProvider.setUserFailedLoginAttempts(email, { count: 3, lastAttempt: new Date().toISOString() });
      const attempts = dataProvider.getUserFailedLoginAttempts(email);
      expect(attempts).to.exist;
      expect(attempts.count).to.equal(3);
    });
  });

  describe("Role Management", () => {
    it("should get all roles", () => {
      const roles = dataProvider.getRoles();
      expect(roles).to.have.property("STUDENT");
      expect(roles).to.have.property("INSTRUCTOR");
      expect(roles).to.have.property("ADMIN");
    });

    it("should get role permissions", () => {
      const studentPerms = dataProvider.getRolePermissions("student");
      expect(studentPerms).to.be.an("array");
      expect(studentPerms).to.include("view_courses");

      const instructorPerms = dataProvider.getRolePermissions("instructor");
      expect(instructorPerms).to.include("create_courses");

      const adminPerms = dataProvider.getRolePermissions("admin");
      expect(adminPerms).to.include("manage_roles");
    });

    it("should update user role", () => {
      // Create test user
      const newUser = {
        id: 9999,
        username: "testrole",
        email: "testrole@test.com",
        password: "test",
        firstName: "Test",
        lastName: "Role",
        role: "student",
      };
      dataProvider.addUser(newUser);

      const success = dataProvider.updateUserRole(9999, "instructor");
      expect(success).to.be.true;

      const user = dataProvider.getUserById(9999);
      expect(user.role).to.equal("instructor");
    });
  });

  describe("Course Lesson Management", () => {
    it("should get lesson types", () => {
      const types = dataProvider.getLessonTypes();
      expect(types).to.be.an("array");
      expect(types).to.include("video");
      expect(types).to.include("quiz");
    });

    it("should set and get course lessons", () => {
      const lessons = [{ id: 1, title: "Test Lesson", type: "video" }];
      dataProvider.setCourseLessons(999, lessons);
      const result = dataProvider.getCourseLessons(999);
      expect(result).to.deep.equal(lessons);
    });

    it("should update lesson", () => {
      const courseId = 1;
      const lessonId = 1;
      const updates = { title: "Updated Title" };

      const success = dataProvider.updateLesson(courseId, lessonId, updates);
      expect(success).to.be.true;

      const lessons = dataProvider.getCourseLessons(courseId);
      const updatedLesson = lessons.find((l) => l.id === lessonId);
      expect(updatedLesson.title).to.equal("Updated Title");
    });
  });

  describe("Quiz Management", () => {
    it("should add and get quiz attempts", () => {
      const attempt = {
        id: 999,
        userId: 1,
        courseId: 1,
        lessonId: 3,
        score: 85,
        passed: true,
        answers: [1, 0, 1],
      };

      dataProvider.addQuizAttempt(attempt);
      const attempts = dataProvider.getQuizAttempts();
      expect(attempts).to.be.an("array");
      expect(attempts.find((a) => a.id === 999)).to.exist;
    });
  });

  describe("Certificate Management", () => {
    it("should add and get certificates", () => {
      const cert = {
        id: 999,
        userId: 1,
        courseId: 2,
        issueDate: new Date().toISOString(),
        certificateNumber: "TEST-2024-001",
        uuid: "test-uuid-999",
      };

      dataProvider.addCertificate(cert);
      const certs = dataProvider.getCertificates();
      expect(certs.find((c) => c.id === 999)).to.exist;
    });

    it("should get certificate by uuid", () => {
      const cert = dataProvider.getCertificate("550e8400-e29b-41d4-a716-446655440000");
      expect(cert).to.exist;
      expect(cert.certificateNumber).to.equal("CERT-2023-001");
    });
  });

  describe("Account Deactivation", () => {
    it("should not deactivate admin user", () => {
      const result = dataProvider.deactivateUserData(0); // Admin user
      expect(result.success).to.be.false;
      expect(result.error).to.include("Admin user cannot be deactivated");
    });

    it("should deactivate user and related data", () => {
      const userId = 4;
      const result = dataProvider.deactivateUserData(userId);
      expect(result.success, JSON.stringify(result)).to.be.true;

      // Check all related data is inactive
      expect(dataProvider.getUserById(userId)).to.be.undefined;
      expect(dataProvider.getUserEnrollments(userId)).to.be.empty;
      expect(dataProvider.getLessonProgress(userId, 1)).to.be.empty;
      expect(dataProvider.getUserRatings().filter((r) => r.userId === userId)).to.be.empty;
      expect(dataProvider.getFundsHistory(userId)).to.be.empty;
    });

    it("should handle non-existent user deactivation", () => {
      const result = dataProvider.deactivateUserData(99999);
      expect(result.success).to.be.false;
      expect(result.error).to.include("User not found");
    });
  });

  describe("Data Recalculation", () => {
    it("should recalculate course students count", () => {
      const courseId = 1;
      dataProvider.recalculateStudentsCount();
      const originalCount = dataProvider.getOneCourseStats(courseId).students;

      // Add new enrollment
      dataProvider.addUserEnrollment({
        id: faker.number.int(9999, 9999999),
        userId: 12,
        courseId: courseId,
        enrollmentDate: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        progress: 0,
        completed: false,
      });

      const newCount = dataProvider.getOneCourseStats(courseId).students;
      expect(newCount).to.be.greaterThan(originalCount);
    });

    it("should recalculate course ratings", async () => {
      const courseId = 1;
      dataProvider.recalculateCoursesRating();
      const originalRating = dataProvider.getOneCourseStats(courseId).rating;

      // Add new rating
      dataProvider.addUserRating({
        userId: faker.number.int(9999, 9999999),
        courseId: courseId,
        rating: 5,
        comment: "Test rating",
        createdAt: new Date().toISOString(),
      });

      const newRating = dataProvider.getOneCourseStats(courseId).rating;
      expect(newRating, JSON.stringify(newRating)).to.not.equal(originalRating);
    });
  });

  describe("Course Rating Functions", () => {
    it("should get user rating for specific course", () => {
      const rating = dataProvider.getUserRating(3, 1);
      expect(rating).to.exist;
      expect(rating.rating).to.equal(5);
      expect(rating.comment).to.equal("Great course, learned a lot!");
    });

    it("should get course ratings", () => {
      const ratings = dataProvider.getCourseRatings(1);
      expect(ratings).to.be.an("array");
      expect(ratings.length).to.be.greaterThan(0);
      expect(ratings[0]).to.have.property("rating");
      expect(ratings[0]).to.have.property("comment");
    });
  });

  describe("Course Management Extended", () => {
    it("should get all courses", () => {
      const courses = dataProvider.getAllCourses();
      expect(courses).to.be.an("array");
      expect(courses.length).to.be.greaterThan(0);
    });

    it("should add new course", () => {
      const newCourse = {
        id: 999,
        title: "Test Course",
        description: "Test Description",
        instructor: "Test Instructor",
        instructorId: 2,
        price: 99.99,
      };

      const originalCount = dataProvider.getCourses().length;
      dataProvider.addCourse(newCourse);

      expect(dataProvider.getCourses().length).to.equal(originalCount + 1);
      expect(dataProvider.getCourseById(999)).to.deep.include(newCourse);
      expect(dataProvider.getCourseLessons(999)).to.be.an("array").that.is.empty;
    });
  });

  describe("User Authentication Functions", () => {
    it("should get user by username", () => {
      const user = dataProvider.getUserByUsername("user");
      expect(user).to.exist;
      expect(user.email).to.equal("michael.scott@test.test.com");
    });

    it("should handle failed login attempts", () => {
      const email = "test@example.com";
      const attempts = { count: 1, lastAttempt: new Date().toISOString() };

      dataProvider.setUserFailedLoginAttempts(email, attempts);
      expect(dataProvider.getUserFailedLoginAttempts(email)).to.deep.equal(attempts);
    });
  });

  describe("Lesson Progress Management", () => {
    it("should add lesson progress", () => {
      const progress = {
        userId: 999,
        courseId: 1,
        lessonId: 1,
        completed: true,
        completedAt: new Date().toISOString(),
      };

      const originalCount = dataProvider.getLessonProgress(999, 1).length;
      dataProvider.addLessonProgress(progress);

      expect(dataProvider.getLessonProgress(999, 1).length).to.equal(originalCount + 1);
      expect(dataProvider.getLessonProgress(999, 1)).to.deep.include(progress);
    });
  });

  describe("User Enrollment Functions", () => {
    it("should get all user enrollments including inactive", () => {
      const allEnrollments = dataProvider.getAllUserEnrollments();
      expect(allEnrollments).to.be.an("array");
      expect(allEnrollments.length).to.be.greaterThan(0);
    });

    it("should add new enrollment and update course students count", () => {
      const newEnrollment = {
        id: 999,
        userId: 999,
        courseId: 1,
        enrollmentDate: new Date().toISOString(),
        progress: 0,
      };

      const originalStudents = dataProvider.getCourseById(1).students;
      dataProvider.addEnrollment(newEnrollment);

      expect(dataProvider.getCourseById(1).students).to.equal(originalStudents + 1);
      expect(dataProvider.getEnrollment(999, 1)).to.deep.include(newEnrollment);
    });
  });

  describe("User Management Extended", () => {
    it("should add new user", () => {
      const newUser = {
        id: 888,
        username: "testuser",
        email: "test@test.com",
        password: "password",
        firstName: "Test",
        lastName: "User",
        role: "student",
      };

      const originalCount = dataProvider.getUsers().length;
      dataProvider.addUser(newUser);

      expect(dataProvider.getUsers().length).to.equal(originalCount + 1);
      expect(dataProvider.getUserById(888)).to.deep.include(newUser);
    });

    it("should get all users", () => {
      const users = dataProvider.getUsers();
      expect(users).to.be.an("array");
      expect(users.length).to.be.greaterThan(0);
    });
  });
});
