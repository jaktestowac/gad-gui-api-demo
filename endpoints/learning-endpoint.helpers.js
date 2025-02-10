const {
  HTTP_OK,
  HTTP_NOT_FOUND,
  HTTP_BAD_REQUEST,
  HTTP_UNAUTHORIZED,
  HTTP_UNPROCESSABLE_ENTITY,
  HTTP_FORBIDDEN,
} = require("../helpers/response.helpers");
const { formatErrorResponse } = require("../helpers/helpers");
const { isAuthenticated, createToken } = require("../helpers/jwtauth");
const { logTrace, logDebug } = require("../helpers/logger-api");
const { verifyAccessToken } = require("../helpers/validation.helpers");
const { areIdsEqual, isUndefined, isInactive } = require("../helpers/compare.helpers");

const mockData = {
  // Users data
  users: [
    {
      id: 1,
      username: "user",
      email: "michael.scott@test.test.com",
      password: "demo",
      firstName: "Michael",
      lastName: "Scott",
      avatar: "..\\data\\users\\face_1713017873.9196286_m_1.jpg",
      joinDate: "2023-05-15",
      role: "student",
    },
    {
      id: 2,
      username: "john_doe",
      email: "john.doe@test.test.com",
      password: "demo",
      firstName: "John",
      lastName: "Doe",
      avatar: "..\\data\\users\\face_1713017346.0038195_m_1.jpg",
      joinDate: "2023-01-15",
      role: "instructor",
    },
  ],

  // Course catalog
  courses: [
    {
      id: 1,
      title: "Introduction to Web Development",
      description:
        "Learn the fundamentals of web development including HTML, CSS, and JavaScript. Perfect for beginners wanting to start their web development journey.",
      thumbnail: "..\\data\\learning\\courses\\web-dev.jpg",
      instructor: "John Doe",
      duration: "8 weeks",
      totalHours: 24,
      level: "Beginner",
      students: 0,
      rating: 4.5,
      tags: ["HTML", "CSS", "JavaScript"],
      prerequisites: [],
      price: 49.99,
      learningObjectives: [
        "Build complete web applications from scratch",
        "Master HTML5, CSS3, and modern JavaScript",
        "Understand responsive design principles",
        "Create interactive user interfaces",
        "Learn web development best practices",
        "Implement modern web standards",
      ],
    },
    {
      id: 2,
      title: "Advanced JavaScript Programming",
      description:
        "Master modern JavaScript features, async programming, and advanced patterns. Take your JavaScript skills to the next level.",
      thumbnail: "..\\data\\learning\\courses\\js-advanced.jpg",
      instructor: "John Doe",
      duration: "10 weeks",
      totalHours: 30,
      level: "Advanced",
      students: 0,
      rating: 4.8,
      tags: ["JavaScript", "ES6+", "Async"],
      prerequisites: ["Basic JavaScript"],
      price: 79.99,
      learningObjectives: [
        "Master advanced JavaScript concepts",
        "Build complex applications using modern JS",
        "Implement async programming patterns",
        "Use modern ES6+ features effectively",
        "Create scalable application architectures",
        "Debug and optimize JavaScript code",
      ],
    },
    {
      id: 3,
      title: "React.js Fundamentals",
      description: "Build modern web applications with React. Learn components, state management, and best practices.",
      thumbnail: "..\\data\\learning\\courses\\react.jpg",
      instructor: "John Doe",
      duration: "12 weeks",
      totalHours: 36,
      level: "Intermediate",
      students: 0,
      rating: 4.7,
      tags: ["React", "JavaScript", "Web Development"],
      prerequisites: ["JavaScript"],
      price: 89.99,
      learningObjectives: [
        "Build modern React applications",
        "Master component-based architecture",
        "Implement state management patterns",
        "Create reusable React components",
        "Handle routing and navigation",
        "Optimize React application performance",
      ],
    },
    {
      id: 4,
      title: "Playwright Automation Testing",
      description:
        "Learn end-to-end testing with Playwright. Automate browser interactions, test web applications, and write reliable tests.",
      thumbnail: "..\\data\\learning\\courses\\playwright.jpg",
      instructor: "John Doe",
      duration: "6 weeks",
      totalHours: 18,
      level: "Intermediate",
      students: 0,
      rating: 4.6,
      tags: ["Playwright", "Testing", "Automation"],
      prerequisites: ["JavaScript", "Testing Basics"],
      price: 129.99,
      learningObjectives: [
        "Master Playwright automation testing",
        "Automate browser interactions",
        "Write reliable end-to-end tests",
        "Test web applications effectively",
        "Debug and optimize test scripts",
        "Implement testing best practices",
      ],
    },
    {
      id: 5,
      title: "Python Programming Basics",
      description:
        "Learn the basics of Python programming. Perfect for beginners wanting to start their coding journey with Python.",
      thumbnail: "..\\data\\learning\\courses\\python-basics.jpg",
      instructor: "John Doe",
      duration: "2 weeks",
      totalHours: 1,
      level: "Beginner",
      students: 0,
      rating: 4.4,
      tags: ["Python", "Programming", "Basics"],
      prerequisites: [],
      price: 0,
      learningObjectives: [
        "Master Python programming basics",
        "Understand Python syntax and semantics",
        "Learn data types and structures",
        "Implement Python control flow",
        "Create Python scripts and programs",
        "Debug and optimize Python code",
      ],
    },
  ],

  // User enrollments with progress
  userEnrollments: [
    {
      id: 1,
      userId: 1,
      courseId: 1,
      enrollmentDate: "2023-06-01",
      lastAccessed: "2023-07-25",
      progress: 100,
      completed: true,
      certificateIssued: true,
      completionDate: "2023-06-30",
    },
    {
      id: 2,
      userId: 1,
      courseId: 2,
      enrollmentDate: "2023-07-01",
      lastAccessed: "2023-07-24",
      progress: 60,
      completed: false,
    },
  ],

  // User progress tracking
  lessonProgress: [
    {
      userId: 1,
      courseId: 1,
      lessonId: 1,
      completed: true,
      completedAt: "2023-06-15T10:30:00Z",
      score: null,
    },
    {
      userId: 1,
      courseId: 1,
      lessonId: 2,
      completed: true,
      completedAt: "2023-06-16T14:20:00Z",
      score: null,
    },
    {
      userId: 1,
      courseId: 1,
      lessonId: 3,
      completed: true,
      completedAt: "2023-06-17T09:45:00Z",
      score: 90,
    },
  ],

  // Certificates with user reference
  certificates: [
    {
      id: 1,
      userId: 1,
      courseId: 1,
      issueDate: "2023-06-30",
      certificateNumber: "CERT-2023-001",
      courseTitle: "Introduction to Web Development",
      recipientName: "Michael Scott",
      issuedBy: "John Doe",
    },
  ],

  // Course content
  courseLessons: {
    1: [
      {
        id: 1,
        title: "Introduction to HTML",
        type: "video",
        duration: "12:50",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/video1.mp4",
          transcript: "Introduction to HTML basics...",
        },
      },
      {
        id: 2,
        title: "HTML Structure and Elements",
        type: "reading",
        duration: "15:00",
        completed: false,
        content: {
          text: "The basic structure of an HTML document...",
          resources: ["HTML5 Specification", "MDN Documentation"],
        },
      },
      {
        id: 3,
        title: "HTML Fundamentals Quiz",
        type: "quiz",
        completed: true,
        content: {
          questions: [
            {
              question: "What does HTML stand for?",
              options: ["Hypertext Markup Language", "High-Level Text Language", "Hyperlink and Text Markup Language"],
              correct: 0,
            },
            {
              question: "Which tag is used for creating a paragraph?",
              options: ["p", "paragraph", "text"],
              correct: 0,
            },
          ],
        },
      },
      {
        id: 4,
        title: "Working with Forms",
        type: "video",
        duration: "12:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/video2.mp4",
          transcript: "Learn how to create HTML forms...",
        },
      },
      {
        id: 5,
        title: "CSS Integration",
        type: "reading",
        duration: "21:00",
        completed: false,
        content: {
          text: "Learn how to style your HTML with CSS...",
          resources: ["CSS Guide", "Styling Best Practices"],
        },
      },
      {
        id: 6,
        title: "Module 1 Quiz",
        type: "quiz",
        completed: false,
        content: {
          questions: [
            {
              question: "What does HTML stand for?",
              options: ["Hypertext Markup Language", "High-Level Text Language", "Hyperlink and Text Markup Language"],
              correct: 0,
            },
            {
              question: "Which tag is used for creating a paragraph?",
              options: ["p", "paragraph", "text"],
              correct: 0,
            },
          ],
        },
      },
    ],
    2: [
      {
        id: 1,
        title: "Modern JavaScript Features",
        type: "video",
        duration: "12:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/js-video1.mp4",
          transcript: "Let's explore modern JavaScript features...",
        },
      },
      {
        id: 2,
        title: "Async Programming",
        type: "reading",
        duration: "20:00",
        completed: false,
        content: {
          text: "Asynchronous programming in JavaScript allows you to execute code concurrently...",
          resources: ["MDN Documentation", "Async/Await Guide"],
        },
      },
      {
        id: 3,
        title: "ES6+ Features",
        type: "reading",
        duration: "18:00",
        completed: false,
        content: {
          text: "ES6 introduced many new features to JavaScript, such as arrow functions, classes, and modules...",
          resources: ["Babel Documentation", "ES6 Overview"],
        },
      },
      {
        id: 4,
        title: "JavaScript Basics",
        type: "video",
        duration: "15:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/js-video1.mp4",
          transcript: "Introduction to JavaScript programming...",
        },
      },
      {
        id: 5,
        title: "Variables and Data Types",
        type: "reading",
        duration: "20:00",
        completed: false,
        content: {
          text: "Understanding JavaScript variables and data types...",
          resources: ["JavaScript Guide", "MDN Variables"],
        },
      },
      {
        id: 6,
        title: "Functions and Scope",
        type: "video",
        duration: "25:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/js-video2.mp4",
          transcript: "Deep dive into JavaScript functions...",
        },
      },
      {
        id: 7,
        title: "Arrays and Objects",
        type: "reading",
        duration: "30:00",
        completed: false,
        content: {
          text: "Working with complex data structures...",
          resources: ["Array Methods", "Object Manipulation"],
        },
      },
      {
        id: 8,
        title: "JavaScript Fundamentals Quiz",
        type: "quiz",
        completed: false,
        content: {
          questions: [
            {
              question: "Which operator is used for strict equality?",
              options: ["===", "==", "="],
              correct: 0,
            },
            {
              question: "What is the result of typeof []?",
              options: ["object", "array", "undefined"],
              correct: 0,
            },
          ],
        },
      },
    ],
    3: [
      {
        id: 1,
        title: "React Components",
        type: "video",
        duration: "15:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/react-video1.mp4",
          transcript: "Understanding React components...",
        },
      },
      {
        id: 2,
        title: "State Management",
        type: "reading",
        duration: "25:00",
        completed: false,
        content: {
          text: "State management is a crucial part of building React applications...",
          resources: ["Redux Documentation", "Context API Guide"],
        },
      },
    ],
    4: [
      {
        id: 1,
        title: "Introduction to Playwright",
        type: "video",
        duration: "10:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/playwright-video1.mp4",
          transcript: "Getting started with Playwright automation...",
        },
      },
      {
        id: 2,
        title: "Automating Browser Interactions",
        type: "reading",
        duration: "18:00",
        completed: false,
        content: {
          text: "Learn how to automate browser interactions using Playwright...",
          resources: ["Playwright Documentation", "Automated Testing Guide"],
        },
      },
      {
        id: 3,
        title: "Writing Reliable Tests",
        type: "reading",
        duration: "20:00",
        completed: false,
        content: {
          text: "Best practices for writing reliable end-to-end tests...",
          resources: ["Testing Strategies", "Playwright Patterns"],
        },
      },
      {
        id: 4,
        title: "Playwright Automation Quiz",
        type: "quiz",
        completed: false,
        content: {
          questions: [
            {
              question: "What is Playwright used for?",
              options: ["Automation Testing", "Unit Testing", "Manual Testing"],
              correct: 0,
            },
            {
              question: "Which browser engines are supported by Playwright?",
              options: ["Chromium, WebKit, Firefox", "Chrome, Safari, Edge", "IE, Firefox, Opera"],
              correct: 0,
            },
          ],
        },
      },
    ],
    5: [
      {
        id: 1,
        title: "Python Basics",
        type: "video",
        duration: "10:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/python-video1.mp4",
          transcript: "Introduction to Python programming...",
        },
      },
    ],
  },

  // Quiz attempts tracking
  quizAttempts: [
    {
      id: 1,
      userId: 1,
      courseId: 1,
      lessonId: 3,
      attemptDate: "2023-06-17T09:45:00Z",
      score: 90,
      passed: true,
      answers: [0, 0], // User's selected answers
    },
  ],

  // User statistics cache
  userStats: [
    {
      userId: 1,
      coursesInProgress: 1,
      completedCourses: 1,
      totalHours: 28,
      totalCertificates: 1,
      lastUpdated: "2023-07-25T12:00:00Z",
    },
  ],
};

function checkIfUserExists(email) {
  return mockData.users.find((u) => u.email === email);
}

function checkIfUserIsAuthenticated(req, res, endpoint = "endpoint", url = "") {
  const verifyTokenResult = verifyAccessToken(req, res, "learning", req.url);
  const userExists = checkIfUserExists(verifyTokenResult.email);

  if (!verifyTokenResult || !userExists) {
    return false;
  }

  return true;
}

const checkIfUserIdMatchesEmail = (userId, email) => {
  const user = mockData.users.find((u) => areIdsEqual(u.id, userId));
  return user && user.email === email;
};

function recalculateStudentsCount() {
  mockData.courses.forEach((course) => {
    course.students = mockData.userEnrollments.filter((e) => areIdsEqual(e.courseId, course.id)).length || 0;
  });
}

recalculateStudentsCount();

function handleLearning(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");
  const urlParts = urlEnds.split("/").filter(Boolean);
  const verifyTokenResult = verifyAccessToken(req, res, "learning", req.url);

  // GET endpoints
  if (req.method === "GET") {
    // Specific endpoints should come before more general ones
    // Get lesson content (most specific)
    if (
      urlParts.length === 7 &&
      urlParts[1] === "learning" &&
      urlParts[2] === "courses" &&
      urlParts[4] === "lessons" &&
      urlParts[6] === "content"
    ) {
      const courseId = parseInt(urlParts[3]);
      const lessonId = parseInt(urlParts[5]);
      const lessons = mockData.courseLessons[courseId];
      const lesson = lessons?.find((l) => l.id === lessonId);

      if (lesson?.content) {
        res.status(HTTP_OK).send({ content: lesson.content });
      } else {
        res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Lesson content not found"));
      }
      return;
    }

    // Get course lessons
    if (urlParts.length === 5 && urlParts[1] === "learning" && urlParts[2] === "courses" && urlParts[4] === "lessons") {
      const courseId = parseInt(urlParts[3]);
      const lessons = mockData.courseLessons[courseId];
      if (lessons) {
        res.status(HTTP_OK).send(lessons);
      } else {
        res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Lessons not found"));
      }
      return;
    }

    // Get user stats
    if (urlParts.length === 5 && urlParts[1] === "learning" && urlParts[2] === "users" && urlParts[4] === "stats") {
      if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
        res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
        return;
      }

      const userId = parseInt(urlParts[3]);
      const stats = mockData.userStats.find((s) => s.userId === userId);
      if (stats) {
        res.status(HTTP_OK).send(stats);
      } else {
        res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User stats not found"));
      }
      return;
    }

    // Get user enrollments
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

      if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult.email)) {
        res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
        return;
      }

      const enrollments = mockData.userEnrollments.filter((e) => areIdsEqual(e.userId, userId));

      if (enrollments) {
        res.status(HTTP_OK).send(enrollments);
      } else {
        res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Enrollments not found"));
      }
      return;
    }

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

      if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult.email)) {
        res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
        return;
      }

      const certificates = mockData.certificates.filter((c) => c.userId === userId) || [];
      res.status(HTTP_OK).send({ certificates });
      return;
    }

    // Get course progress
    if (
      urlParts.length === 5 &&
      urlParts[1] === "learning" &&
      urlParts[2] === "courses" &&
      urlParts[4] === "progress"
    ) {
      const courseId = parseInt(urlParts[3]);
      const enrollment = mockData.userEnrollments.find((e) => e.courseId === courseId);
      res.status(HTTP_OK).send({ progress: enrollment?.progress || 0 });
      return;
    }

    // Get course by ID
    if (urlParts.length === 4 && urlParts[1] === "learning" && urlParts[2] === "courses") {
      const courseId = parseInt(urlParts[3]);
      const course = mockData.courses.find((c) => c.id === courseId);

      if (course) {
        res.status(HTTP_OK).send(course);
      } else {
        res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Course not found"));
      }
      return;
    }

    // Get user by ID
    if (urlParts.length === 4 && urlParts[1] === "learning" && urlParts[2] === "users") {
      if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
        res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
        return;
      }

      const userId = parseInt(urlParts[3]);

      if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult.email)) {
        res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
        return;
      }

      const user = mockData.users.find((u) => u.id === userId);
      if (user) {
        res.status(HTTP_OK).send({ ...user, password: undefined });
      } else {
        res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
      }
      return;
    }

    if (urlParts.length === 3 && urlParts[1] === "learning") {
      switch (urlParts[2]) {
        case "users":
          res.status(HTTP_OK).send(mockData.users.map((user) => ({ ...user, password: undefined })));
          return;
        case "courses":
          res.status(HTTP_OK).send(mockData.courses);
          return;
        case "enrollments":
          res.status(HTTP_OK).send(mockData.userEnrollments);
          return;
        case "certificates":
          res.status(HTTP_OK).send({ certificates: mockData.certificates || [] });
          return;
      }
    }

    // Progress endpoints
    if (urlParts.length === 4 && urlParts[1] === "learning" && urlParts[2] === "progress") {
      if (urlParts[3] === "lessons") {
        res.status(HTTP_OK).send(mockData.lessonProgress);
        return;
      }
    }

    if (urlParts.length === 4 && urlParts[1] === "learning" && urlParts[2] === "quiz" && urlParts[3] === "attempts") {
      res.status(HTTP_OK).send(mockData.quizAttempts);
      return;
    }
  }

  // POST endpoints
  if (req.method === "POST") {
    if (urlParts.length === 4 && urlParts[1] === "learning" && urlParts[2] === "auth") {
      switch (urlParts[3]) {
        case "login": {
          const { username, password } = req.body;
          const user = mockData.users.find((u) => u.username === username && u.password === password);
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
            });
          } else {
            res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Invalid credentials"));
          }
          return;
        }
        case "register": {
          const { username, password, email, avatar, firstName, lastName } = req.body;

          if (mockData.users.find((u) => u.username === username || u.email === email)) {
            res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("User already exists"));
            return;
          }

          const maxId = mockData.users.reduce((max, user) => (user.id > max ? user.id : max), 0);

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
          mockData.users.push(newUser);
          res.status(HTTP_OK).send({ success: true });
          return;
        }
      }
    }

    // Course-related actions
    if (urlParts.length >= 5 && urlParts[1] === "learning" && urlParts[2] === "courses") {
      const courseId = parseInt(urlParts[3]);

      switch (urlParts[4]) {
        case "enroll": {
          if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
            res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
            return;
          }

          const { userId } = req.body;

          if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult.email)) {
            res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
            return;
          }

          const course = mockData.courses.find((c) => areIdsEqual(c.id, courseId));
          if (!course) {
            res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Course not found"));
            return;
          }

          // Check if already enrolled
          const existingEnrollment = mockData.userEnrollments.find(
            (e) => areIdsEqual(e.userId, userId) && areIdsEqual(e.courseId, courseId)
          );

          if (existingEnrollment) {
            res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Already enrolled in this course"));
            return;
          }

          // Create new enrollment
          const enrollment = {
            id: mockData.userEnrollments.length + 1,
            userId,
            courseId,
            enrollmentDate: new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
            progress: 0,
            completed: false,
          };

          mockData.userEnrollments.push(enrollment);

          recalculateStudentsCount();

          res.status(HTTP_OK).send({ success: true, enrollment });
          return;
        }

        case "certificate":
          // Add certificate generation logic here
          res.status(HTTP_OK).send({ success: true });
          return;
        case "progress": {
          if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
            res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
            return;
          }

          const { progress } = req.body;
          const enrollment = mockData.userEnrollments.find((e) => areIdsEqual(e.courseId, courseId));

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
      if (urlParts.length === 7 && urlParts[4] === "lessons") {
        const lessonId = parseInt(urlParts[5]);

        switch (urlParts[6]) {
          case "complete": {
            const { userId } = req.body;

            if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
              res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
              return;
            }

            if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult.email)) {
              res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
              return;
            }

            const now = new Date().toISOString();
            mockData.lessonProgress.push({
              userId,
              courseId,
              lessonId,
              completed: true,
              completedAt: now,
            });

            // Check if all lessons are completed and update enrollment
            const lessons = mockData.courseLessons[courseId];
            const progress = mockData.lessonProgress.filter(
              (p) => areIdsEqual(p.userId, userId) && areIdsEqual(p.courseId, courseId)
            ).length;

            const enrollment = mockData.userEnrollments.find(
              (e) => areIdsEqual(e.userId, userId) && areIdsEqual(e.courseId, courseId)
            );

            if (enrollment) {
              enrollment.lastAccessed = now;
              enrollment.progress = Math.round((progress / lessons.length) * 100);

              logDebug("Lesson completed:", { progress: enrollment.progress, userId, courseId, lessonId });

              if (enrollment.progress === 100) {
                logDebug("All lessons completed:", { progress: enrollment.progress, userId, courseId, lessonId });
                enrollment.completed = true;
                enrollment.completionDate = now;

                const existingCertificate = mockData.certificates.find(
                  (cert) => areIdsEqual(cert.userId, userId) && areIdsEqual(cert.courseId, courseId)
                );

                if (!existingCertificate) {
                  const course = mockData.courses.find((c) => areIdsEqual(c.id, courseId));
                  const user = mockData.users.find((u) => areIdsEqual(u.id, userId));

                  mockData.certificates.push({
                    id: mockData.certificates.length + 1,
                    userId,
                    courseId,
                    issueDate: now,
                    certificateNumber: `CERT-${new Date().getFullYear()}-${String(
                      mockData.certificates.length + 1
                    ).padStart(3, "0")}`,
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
          case "quiz": {
            const { userId, answers } = req.body;

            if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
              res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
              return;
            }

            if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult.email)) {
              res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
              return;
            }

            mockData.quizAttempts.push({
              id: mockData.quizAttempts.length + 1,
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
  }

  // PUT endpoints
  if (req.method === "PUT") {
    // Update user profile
    if (urlParts.length === 5 && urlParts[1] === "learning" && urlParts[2] === "users" && urlParts[4] === "profile") {
      if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
        res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
        return;
      }

      const userId = parseInt(urlParts[3]);
      if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult.email)) {
        res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
        return;
      }

      const { firstName, lastName, email, currentPassword } = req.body;
      const user = mockData.users.find((u) => areIdsEqual(u.id, userId));

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
    if (urlParts.length === 5 && urlParts[1] === "learning" && urlParts[2] === "users" && urlParts[4] === "password") {
      if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
        res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
        return;
      }

      const userId = parseInt(urlParts[3]);
      if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult.email)) {
        res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
        return;
      }

      const { currentPassword, newPassword } = req.body;
      const user = mockData.users.find((u) => areIdsEqual(u.id, userId));

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
  }

  res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Endpoint not found"));
}

module.exports = {
  handleLearning,
};
