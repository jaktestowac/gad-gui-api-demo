const {
  HTTP_OK,
  HTTP_NOT_FOUND,
  HTTP_BAD_REQUEST,
  HTTP_UNAUTHORIZED,
  HTTP_UNPROCESSABLE_ENTITY,
  HTTP_FORBIDDEN,
} = require("../helpers/response.helpers");
const { formatErrorResponse, generateUuid } = require("../helpers/helpers");
const { isAuthenticated, createToken } = require("../helpers/jwtauth");
const { logTrace, logDebug } = require("../helpers/logger-api");
const { verifyAccessToken } = require("../helpers/validation.helpers");
const { areIdsEqual, isUndefined, isInactive } = require("../helpers/compare.helpers");

const mockData = {
  // Role definitions
  roles: {
    STUDENT: "student",
    INSTRUCTOR: "instructor",
    ADMIN: "admin",
  },

  // Role permissions mapping
  rolePermissions: {
    student: ["view_courses", "enroll_courses", "view_own_progress", "submit_assignments"],
    instructor: [
      "view_courses",
      "create_courses",
      "edit_own_courses",
      "view_student_progress",
      "grade_assignments",
      "view_course_analytics",
    ],
    admin: ["view_courses", "manage_all_courses", "manage_users", "manage_roles", "view_analytics", "system_settings"],
  },

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
      funds: 220.02,
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
    {
      id: 3,
      username: "jane_smith",
      email: "jane_smith@test.test.com",
      password: "demo",
      firstName: "Jane",
      lastName: "Smith",
      avatar: "..\\data\\users\\face_1714589705_f.jpg",
      joinDate: "2023-02-15",
      role: "student",
    },
    {
      id: 4,
      username: "bob_ross",
      email: "bob_ross@@test.test.com",
      password: "demo",
      firstName: "Bob",
      lastName: "Ross",
      avatar: "..\\data\\users\\face_1703527925.6898403_1_m.jpg",
      joinDate: "2023-03-15",
      role: "student",
    },
    {
      id: 5,
      username: "jane_doe",
      email: "jane_doe@@test.test.com",
      password: "demo",
      firstName: "Jane",
      lastName: "Doe",
      avatar: "..\\data\\users\\face_1714589623_f.jpg",
      joinDate: "2023-04-15",
      role: "student",
    },
    {
      id: 6,
      username: "jim_halpert",
      email: "jim_halpert@@test.test.com",
      password: "demo",
      firstName: "Jim",
      lastName: "Halpert",
      avatar: "..\\data\\users\\face_1713017654.0461617_m_1.jpg",
      joinDate: "2023-04-15",
      role: "student",
    },
    {
      id: 7,
      username: "pam_beesly",
      email: "pam_beesly@@test.test.com",
      password: "demo",
      firstName: "Pam",
      lastName: "Beesly",
      avatar: "..\\data\\users\\face_1713018024.9049351_f_1.jpg",
      joinDate: "2023-04-15",
      role: "student",
    },
    {
      id: 8,
      username: "andy_bernard",
      email: "andy_bernard@@test.test.com",
      password: "demo",
      firstName: "Andy",
      lastName: "Bernard",
      avatar: "..\\data\\users\\face_1713018044.62676_m_1.jpg",
      joinDate: "2023-04-15",
      role: "student",
    },
    {
      id: 9,
      username: "dwight_schrute",
      email: "dwight_schrute@@test.test.com",
      password: "demo",
      firstName: "Dwight",
      lastName: "Schrute",
      avatar: "..\\data\\users\\face_1713018046.9542458_m_1.jpg",
      joinDate: "2023-04-15",
      role: "student",
    },
    {
      id: 10,
      username: "james_sunderland",
      email: "james_sunderland@@test.test.com",
      password: "demo",
      firstName: "James",
      lastName: "Sunderland",
      avatar: "..\\data\\users\\face_1714589459.6969566_m.jpg",
      joinDate: "2023-04-15",
      role: "instructor",
    },
    {
      id: 11,
      username: "angela_martin",
      email: "angela_martin@@test.test.com",
      password: "demo",
      firstName: "Angela",
      lastName: "Martin",
      avatar: "..\\data\\users\\face_1713017873.9196286_m_1.jpg",
      joinDate: "2023-04-15",
      role: "student",
    },
    {
      id: 12,
      username: "Maria Garcia",
      email: "maria@@test.test.com",
      password: "demo",
      firstName: "Maria",
      lastName: "Garcia",
      avatar: "..\\data\\users\\face_1713017873.9196286_m_1.jpg",
      joinDate: "2023-04-15",
      role: "student",
    },
    // Add admin user
    {
      id: 999,
      username: "admin",
      email: "admin@test.test.com",
      password: "admin123",
      firstName: "System",
      lastName: "Admin",
      avatar: "..\\data\\users\\admin.jpg",
      joinDate: "2023-01-01",
      role: "admin",
    },
  ],

  // Track course ownership
  courseOwnership: [
    {
      courseId: 1,
      instructorId: 2,
    },
    {
      courseId: 2,
      instructorId: 2,
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
      instructorId: 2,
      duration: "8 weeks",
      totalHours: 24,
      level: "Beginner",
      students: 0,
      rating: 0,
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
      instructorId: 2,
      duration: "10 weeks",
      totalHours: 30,
      level: "Advanced",
      students: 0,
      rating: 0,
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
      instructorId: 2,
      duration: "12 weeks",
      totalHours: 36,
      level: "Intermediate",
      students: 0,
      rating: 0,
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
      instructorId: 2,
      duration: "6 weeks",
      totalHours: 18,
      level: "Intermediate",
      students: 0,
      rating: 0,
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
      instructor: "James Sunderland",
      instructorId: 10,
      duration: "2 weeks",
      totalHours: 1,
      level: "Beginner",
      students: 0,
      rating: 0,
      tags: ["Python", "Programming", "Basics"],
      prerequisites: [],
      price: 59.99,
      learningObjectives: [
        "Master Python programming basics",
        "Understand Python syntax and semantics",
        "Learn data types and structures",
        "Implement Python control flow",
        "Create Python scripts and programs",
        "Debug and optimize Python code",
      ],
    },
    {
      id: 6,
      title: "Introduction to Java Programming",
      description:
        "Learn the fundamentals of Java programming. Perfect for beginners wanting to start their coding journey with Java.",
      thumbnail: "..\\data\\learning\\courses\\java-basics.jpg",
      instructor: "James Sunderland",
      instructorId: 10,
      duration: "4 weeks",
      totalHours: 12,
      level: "Beginner",
      students: 0,
      rating: 0,
      tags: ["Java", "Programming", "Basics"],
      prerequisites: [],
      price: 69.99,
      learningObjectives: [
        "Master Java programming basics",
        "Understand Java syntax and semantics",
        "Learn data types and structures",
        "Implement Java control flow",
        "Create Java scripts and programs",
        "Debug and optimize Java code",
      ],
    },
    {
      id: 7,
      title: "Manual Testing Fundamentals",
      description:
        "Learn the fundamentals of manual testing. Perfect for beginners wanting to start their testing journey with manual testing.",
      thumbnail: "..\\data\\learning\\courses\\manual-testing.jpg",
      instructor: "James Sunderland",
      instructorId: 10,
      duration: "2 weeks",
      totalHours: 1,
      level: "Beginner",
      students: 0,
      rating: 0,
      tags: ["Testing", "Manual", "Basics"],
      prerequisites: [],
      price: 0,
      learningObjectives: [
        "Master manual testing fundamentals",
        "Understand testing concepts and principles",
        "Learn testing techniques and strategies",
        "Implement manual testing best practices",
        "Create test cases and test plans",
        "Report and track software defects",
      ],
    },
    {
      id: 8,
      title: "AI in Testing",
      description:
        "Learn the fundamentals of AI in testing. Perfect for beginners wanting to start their testing journey with AI in testing.",
      thumbnail: "..\\data\\learning\\courses\\ai-testing.jpg",
      instructor: "James Sunderland",
      instructorId: 10,
      duration: "2 weeks",
      totalHours: 1,
      level: "Beginner",
      students: 0,
      rating: 0,
      tags: ["Testing", "AI", "Basics"],
      prerequisites: [],
      price: 159.99,
      learningObjectives: [
        "Master AI in testing fundamentals",
        "Understand AI testing concepts and principles",
        "Learn AI testing techniques and strategies",
        "Implement AI testing best practices",
        "Create AI test cases and test plans",
        "Report and track AI software defects",
      ],
    },
  ],

  // User enrollments with progress
  userEnrollments: [
    {
      id: 1,
      userId: 1,
      courseId: 1,
      enrollmentDate: "2024-06-01",
      lastAccessed: "2024-07-25",
      progress: 100,
      completed: true,
      certificateIssued: true,
      completionDate: "2024-06-30",
    },
    {
      id: 2,
      userId: 1,
      courseId: 2,
      enrollmentDate: "2024-07-01",
      lastAccessed: "2024-07-24",
      progress: 60,
      completed: false,
    },
    {
      id: 3,
      userId: 3,
      courseId: 1,
      enrollmentDate: "2024-07-15",
      lastAccessed: "2024-07-25",
      progress: 25,
      completed: false,
    },
    {
      id: 4,
      userId: 3,
      courseId: 2,
      enrollmentDate: "2024-07-20",
      lastAccessed: "2024-07-25",
      progress: 0,
      completed: false,
    },
    {
      id: 5,
      userId: 3,
      courseId: 3,
      enrollmentDate: "2024-07-25",
      lastAccessed: "2024-07-25",
      progress: 0,
      completed: false,
    },
    {
      id: 6,
      userId: 3,
      courseId: 4,
      enrollmentDate: "2024-07-25",
      lastAccessed: "2024-07-25",
      progress: 0,
      completed: false,
    },
    {
      id: 7,
      userId: 4,
      courseId: 4,
      enrollmentDate: "2024-07-25",
      lastAccessed: "2024-07-25",
      progress: 0,
      completed: false,
    },
    {
      id: 8,
      userId: 5,
      courseId: 1,
      enrollmentDate: "2024-07-25",
      lastAccessed: "2024-07-25",
      progress: 0,
      completed: false,
    },
    {
      id: 9,
      userId: 5,
      courseId: 2,
      enrollmentDate: "2024-09-12",
      lastAccessed: "2024-09-12",
      progress: 0,
      completed: false,
    },
    {
      id: 10,
      userId: 6,
      courseId: 1,
      enrollmentDate: "2024-10-10",
      lastAccessed: "2024-10-10",
      progress: 0,
      completed: false,
    },
    {
      id: 11,
      userId: 6,
      courseId: 2,
      enrollmentDate: "2024-12-25",
      lastAccessed: "2024-12-25",
      progress: 0,
      completed: false,
    },
    {
      id: 12,
      userId: 7,
      courseId: 1,
      enrollmentDate: "2025-01-17",
      lastAccessed: "2025-01-17",
      progress: 0,
      completed: false,
    },
    {
      id: 13,
      userId: 8,
      courseId: 1,
      enrollmentDate: "2025-02-10",
      lastAccessed: "2025-02-11",
      progress: 0,
      completed: false,
    },
    {
      id: 14,
      userId: 9,
      courseId: 1,
      enrollmentDate: "2025-02-11",
      lastAccessed: "2025-02-11",
      progress: 0,
      completed: false,
    },
    {
      id: 15,
      userId: 10,
      courseId: 1,
      enrollmentDate: "2025-02-11",
      lastAccessed: "2025-02-11",
      progress: 0,
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
      uuid: "550e8400-e29b-41d4-a716-446655440000",
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
        duration: "00:12:50",
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
        duration: "00:15:00",
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
        duration: "00:12:00",
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
        duration: "00:21:00",
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
        duration: "00:12:00",
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
        duration: "00:20:00",
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
        duration: "00:18:00",
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
        duration: "00:15:00",
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
        duration: "00:20:00",
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
        duration: "00:25:00",
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
        duration: "00:30:00",
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
        duration: "00:15:00",
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
        duration: "00:25:00",
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
        duration: "00:10:00",
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
        duration: "00:18:00",
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
        duration: "00:20:00",
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
      {
        id: 5,
        title: "Debugging and Optimization",
        type: "video",
        duration: "00:30:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/playwright-video1.mp4",
          transcript: "Debugging and optimizing Playwright tests...",
        },
      },
      {
        id: 6,
        title: "Testing Best Practices",
        type: "video",
        duration: "00:55:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/playwright-video1.mp4",
          transcript: "Best practices for automated testing are essential for successful test automation projects...",
          resources: ["Testing Standards", "Automation Testing Principles"],
        },
      },
    ],
    5: [
      {
        id: 1,
        title: "Python Basics",
        type: "video",
        duration: "00:10:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/python-video1.mp4",
          transcript: "Introduction to Python programming...",
        },
      },
    ],
    6: [
      {
        id: 1,
        title: "Java Basics",
        type: "video",
        duration: "00:20:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/java-video1.mp4",
          transcript: "Introduction to Java programming...",
        },
      },
      {
        id: 2,
        title: "Java Syntax and Semantics",
        type: "reading",
        duration: "00:35:00",
        completed: false,
        content: {
          text: "Understanding Java syntax and semantics...",
          resources: ["Java Documentation", "Java Basics Guide"],
        },
      },
      {
        id: 3,
        title: "Java Control Flow",
        type: "reading",
        duration: "00:44:00",
        completed: false,
        content: {
          text: "Learn how to control program flow in Java...",
          resources: ["Java Loops", "Decision Making"],
        },
      },
      {
        id: 4,
        title: "Java Basics Quiz",
        type: "quiz",
        completed: false,
        content: {
          questions: [
            {
              question: "What is Java?",
              options: ["Programming Language", "Coffee", "Tea"],
              correct: 0,
            },
            {
              question: "Which of the following is a Java keyword?",
              options: ["class", "method", "variable"],
              correct: 0,
            },
          ],
        },
      },
      {
        id: 5,
        title: "Java Methods",
        type: "video",
        duration: "00:53:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/java-video1.mp4",
          transcript: "Methods in Java programming language...",
        },
      },
      {
        id: 6,
        title: "Java Classes and Objects",
        type: "reading",
        duration: "00:49:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/java-video1.mp4",
          transcript:
            "Classes and objects are fundamental concepts in object-oriented programming (OOP) languages like Java...",
        },
      },
      {
        id: 7,
        title: "Java Inheritance",
        type: "video",
        duration: "00:35:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/java-video1.mp4",
          transcript:
            "Inheritance is a key feature of object-oriented programming. Learn how to use it in Java programming language...",
        },
      },
      {
        id: 8,
        title: "Java Basics Quiz",
        type: "quiz",
        completed: false,
        content: {
          questions: [
            {
              question: "What is Java?",
              options: ["Programming Language", "Coffee", "Tea"],
              correct: 0,
            },
            {
              question: "Which of the following is a Java keyword?",
              options: ["class", "method", "variable"],
              correct: 0,
            },
            {
              question: "What is a class in Java?",
              options: ["A method", "A blueprint for objects", "A variable"],
              correct: 1,
            },
            {
              question: "What is an object in Java?",
              options: ["An instance of a class", "A method", "A variable"],
              correct: 0,
            },
            {
              question: "What is inheritance in Java?",
              options: ["Reusing code", "Creating new classes", "Both of the above"],
              correct: 2,
            },
          ],
        },
      },
    ],
    7: [
      {
        id: 1,
        title: "Manual Testing Fundamentals",
        type: "video",
        duration: "00:10:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/manual-testing-video1.mp4",
          transcript: "Introduction to manual testing...",
        },
      },
      {
        id: 2,
        title: "Testing Techniques",
        type: "video",
        duration: "00:15:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/manual-testing-video1.mp4",
          transcript: "Learn manual testing techniques and strategies...",
          resources: ["Testing Guide", "Manual Testing Best Practices"],
        },
      },
      {
        id: 3,
        title: "Creating Test Cases",
        type: "video",
        duration: "00:20:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/manual-testing-video1.mp4",
          transcript: "How to create effective test cases...",
          resources: ["Test Case Examples", "Test Case Templates"],
        },
      },
      {
        id: 4,
        title: "Manual Testing Quiz",
        type: "quiz",
        completed: false,
        content: {
          questions: [
            {
              question: "What is manual testing?",
              options: ["Testing by humans", "Automated testing", "Unit testing"],
              correct: 0,
            },
            {
              question: "What is a test case?",
              options: ["A set of conditions", "A test script", "A test plan"],
              correct: 0,
            },
          ],
        },
      },
      {
        id: 5,
        title: "Reporting Defects",
        type: "video",
        duration: "00:25:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/manual-testing-video1.mp4",
          transcript: "How to report and track software defects...",
          resources: ["Defect Tracking Tools", "Defect Reporting Guidelines"],
        },
      },
      {
        id: 6,
        title: "Manual Testing Best Practices",
        type: "video",
        duration: "00:30:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/manual-testing-video1.mp4",
          transcript: "Best practices for manual testing...",
          resources: ["Testing Standards", "Manual Testing Principles"],
        },
      },
      {
        id: 7,
        title: "Manual Testing Techniques",
        type: "video",
        duration: "00:35:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/manual-testing-video1.mp4",
          transcript: "Effective manual testing techniques...",
          resources: ["Testing Strategies", "Manual Testing Patterns"],
        },
      },
      {
        id: 8,
        title: "Manual Testing Fundamentals Quiz",
        type: "quiz",
        completed: false,
        content: {
          questions: [
            {
              question: "What are the benefits of manual testing?",
              options: ["Human judgment", "Flexibility", "All of the above"],
              correct: 2,
            },
            {
              question: "What is a test case?",
              options: ["A set of conditions", "A test script", "A test plan"],
              correct: 0,
            },
          ],
        },
      },
      {
        id: 9,
        title: "Manual Testing Patterns",
        type: "video",
        duration: "00:40:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/manual-testing-video1.mp4",
          transcript: "Effective manual testing techniques and patterns...",
          resources: ["Testing Strategies", "Manual Testing Patterns"],
        },
      },
      {
        id: 10,
        title: "Manual Testing Strategies",
        type: "video",
        duration: "00:45:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/manual-testing-video1.mp4",
          transcript: "Effective manual testing techniques...",
          resources: ["Testing Strategies", "Manual Testing Patterns"],
        },
      },
      {
        id: 11,
        title: "Manual Testing Principles",
        type: "video",
        duration: "00:50:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/manual-testing-video1.mp4",
          transcript: "Effective manual testing techniques...",
          resources: ["Testing Strategies", "Manual Testing Patterns"],
        },
      },
    ],
    8: [
      {
        id: 1,
        title: "AI in Testing Fundamentals",
        type: "video",
        duration: "05:34:10",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/ai-testing-video1.mp4",
          transcript: "Introduction to AI in testing...",
        },
      },
      {
        id: 2,
        title: "AI Testing Techniques",
        type: "video",
        duration: "06:45:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/ai-testing-video1.mp4",
          transcript: "Learn AI testing techniques and strategies...",
          resources: ["Testing Guide", "AI Testing Best Practices"],
        },
      },
      {
        id: 3,
        title: "AI Testing Patterns",
        type: "video",
        duration: "07:30:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/ai-testing-video1.mp4",
          transcript: "Effective AI testing techniques and patterns...",
          resources: ["Testing Strategies", "AI Testing Patterns"],
        },
      },
      {
        id: 4,
        title: "AI Testing Fundamentals Quiz",
        type: "quiz",
        completed: false,
        content: {
          questions: [
            {
              question: "What is AI in testing?",
              options: ["Testing by machines", "Automated testing", "Manual testing"],
              correct: 0,
            },
            {
              question: "What is a test case?",
              options: ["A set of conditions", "A test script", "A test plan"],
              correct: 0,
            },
          ],
        },
      },
      {
        id: 5,
        title: "AI Testing Strategies",
        type: "video",
        duration: "08:15:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/ai-testing-video1.mp4",
          transcript: "Effective AI testing techniques...",
          resources: ["Testing Strategies", "AI Testing Patterns"],
        },
      },
      {
        id: 6,
        title: "AI Testing Best Practices",
        type: "video",
        duration: "09:00:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/ai-testing-video1.mp4",
          transcript: "Best practices for AI testing...",
          resources: ["Testing Standards", "AI Testing Principles"],
        },
      },
      {
        id: 7,
        title: "AI Testing Techniques",
        type: "video",
        duration: "09:45:00",
        completed: false,
        content: {
          videoUrl: "https://test.test.test/ai-testing-video1.mp4",
          transcript: "Effective AI testing techniques...",
          resources: ["Testing Strategies", "AI Testing Patterns"],
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

  failedLoginAttempts: {
    // Structure: { email: { count: number, lastAttempt: string } }
  },

  userRatings: [
    {
      userId: 3,
      courseId: 1,
      rating: 5,
      comment: "Great course, learned a lot!",
      createdAt: "2024-07-25T12:00:00Z",
    },
    {
      userId: 3,
      courseId: 2,
      rating: 4,
      comment: "Good content, could be more challenging.",
      createdAt: "2024-08-25T12:00:00Z",
    },
    {
      userId: 3,
      courseId: 3,
      rating: 3,
      comment: "Decent course, but could use more examples.",
      createdAt: "2024-09-25T12:00:00Z",
    },
    {
      userId: 3,
      courseId: 4,
      rating: 5,
      comment: "Excellent course, very informative!",
      createdAt: "2024-10-25T12:00:00Z",
    },
    {
      userId: 4,
      courseId: 4,
      rating: 5,
      comment: "Great course, learned a lot!",
      createdAt: "2024-07-25T12:00:00Z",
    },
    {
      userId: 5,
      courseId: 1,
      rating: 4,
      comment: "Good content, could be more challenging. Also, more examples would be helpful.",
      createdAt: "2024-08-25T12:00:00Z",
    },
    {
      userId: 5,
      courseId: 2,
      rating: 3,
      comment: "Well... it was okay.",
      createdAt: "2024-09-25T12:00:00Z",
    },
    {
      userId: 6,
      courseId: 1,
      rating: 4,
      comment: "Excellent course, very informative! I learned a lot from this course. Highly recommended.",
      createdAt: "2024-10-25T12:00:00Z",
    },
    {
      userId: 7,
      courseId: 1,
      rating: 2,
      comment: "It was very basic, not what I expected.",
      createdAt: "2024-07-25T12:00:00Z",
    },
    {
      userId: 8,
      courseId: 1,
      rating: 4,
      comment: "Good content, could be more challenging.",
      createdAt: "2024-08-25T12:00:00Z",
    },
    {
      userId: 9,
      courseId: 1,
      rating: 1,
      comment: "Not a good course, very basic content.",
      createdAt: "2025-02-13T12:35:00Z",
    },
  ],

  // Add funds transaction history
  fundsHistory: [
    {
      userId: 1,
      amount: 50.0,
      type: "credit",
      timestamp: "2023-11-01T10:30:00Z",
      description: "Account top up",
    },
    {
      userId: 1,
      amount: 49.99,
      type: "debit",
      timestamp: "2023-11-02T14:20:00Z",
      description: "Course enrollment: Introduction to Web Development",
    },
    {
      userId: 1,
      amount: 100.0,
      type: "credit",
      timestamp: "2023-11-03T09:45:00Z",
      description: "Account top up",
    },
    {
      userId: 1,
      amount: 79.99,
      type: "debit",
      timestamp: "2023-11-04T16:30:00Z",
      description: "Course enrollment: Advanced JavaScript Programming",
    },
    {
      userId: 1,
      amount: 100.0,
      type: "credit",
      timestamp: "2024-12-03T09:45:00Z",
      description: "Account top up",
    },
  ],
};

function checkIfUserRatedCourse(userId, courseId) {
  return mockData.userRatings.find((r) => areIdsEqual(r.userId, userId) && areIdsEqual(r.courseId, courseId));
}

function checkIfUserExists(email) {
  return mockData.users.find((u) => u.email === email);
}

function checkIfUserIsAuthenticated(req, res, endpoint = "endpoint", url = "") {
  const verifyTokenResult = verifyAccessToken(req, res, "learning", req.url);
  const userExists = checkIfUserExists(verifyTokenResult?.email);

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

function recalculateCoursesRating() {
  mockData.courses.forEach((course) => {
    const ratings = mockData.userRatings.filter((r) => areIdsEqual(r.courseId, course.id));
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

function parseSecondsToDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secondsLeft = seconds % 60;

  return hours > 0
    ? `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secondsLeft
        .toString()
        .padStart(2, "0")}`
    : `${minutes.toString().padStart(2, "0")}:${secondsLeft.toString().padStart(2, "0")}`;
}

function roundSecondsToHours(seconds) {
  // round to one decimal place
  return Math.round((seconds / 3600) * 10) / 10;
}

function recalculateCoursesDuration() {
  mockData.courses.forEach((course) => {
    const lessons = mockData.courseLessons[course.id];
    const totalDurationInSeconds = lessons.reduce(
      (total, lesson) => total + parseDurationToSeconds(lesson?.duration),
      0
    );

    course.totalHours = roundSecondsToHours(totalDurationInSeconds);
    course.duration = `${roundSecondsToHours(totalDurationInSeconds)} hour(s)`;
  });
}

function checkIfUserIsEnrolled(userId, courseId) {
  return mockData.userEnrollments.some((e) => areIdsEqual(e.userId, userId) && areIdsEqual(e.courseId, courseId));
}

function checkIfUserCanAccessCourse(userId, courseId) {
  // Check if user is enrolled
  const isEnrolled = checkIfUserIsEnrolled(userId, courseId);

  // Check if user is the course instructor
  const isInstructorOfCourse = mockData.courseOwnership.some(
    (ownership) => areIdsEqual(ownership.courseId, courseId) && areIdsEqual(ownership.instructorId, userId)
  );

  return isEnrolled || isInstructorOfCourse;
}

function findUserIdByEmail(email) {
  const user = mockData.users.find((u) => u.email === email);
  return user?.id;
}

recalculateStudentsCount();
recalculateCoursesRating();
recalculateCoursesDuration();

function getUserFunds(userId) {
  const user = mockData.users.find((u) => areIdsEqual(u.id, userId));
  return user ? user.funds : 0;
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

function updateUserFunds(userId, newAmount) {
  const user = mockData.users.find((u) => areIdsEqual(u.id, userId));
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
  const userPermissions = mockData.rolePermissions[user.role];
  return userPermissions?.includes(permission);
}

function isInstructor(user) {
  return user?.role === mockData.roles.INSTRUCTOR;
}

function isAdmin(user) {
  return user?.role === mockData.roles.ADMIN;
}

function canManageCourse(user, courseId) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (!isInstructor(user)) return false;

  return mockData.courseOwnership.some(
    (ownership) => areIdsEqual(ownership.courseId, courseId) && areIdsEqual(ownership.instructorId, user.id)
  );
}

function calculateInstructorStats(instructorId) {
  const instructorCourses = mockData.courses.filter((course) =>
    mockData.courseOwnership.some(
      (ownership) => ownership.instructorId === instructorId && ownership.courseId === course.id
    )
  );

  const stats = {
    totalCourses: instructorCourses.length,
    totalStudents: 0,
    averageRating: 0,
    totalRevenue: 0,
  };

  instructorCourses.forEach((course) => {
    // Calculate total students
    const courseEnrollments = mockData.userEnrollments.filter((e) => e.courseId === course.id);
    stats.totalStudents += courseEnrollments.length;

    // Calculate total revenue
    stats.totalRevenue += courseEnrollments.reduce(
      (total, enrollment) => total + (enrollment.paidAmount || course.price),
      0
    );

    // Calculate average rating
    const courseRatings = mockData.userRatings.filter((r) => r.courseId === course.id);
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
      const certificate = mockData.certificates.find((c) => c.uuid === certUuid);
      if (!certificate) {
        res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Certificate not found"));
        return;
      }

      // Get additional data
      const course = mockData.courses.find((c) => areIdsEqual(c.id, certificate.courseId));
      const user = mockData.users.find((u) => areIdsEqual(u.id, certificate.userId));

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

      const user = mockData.users.find((u) => u.email === verifyTokenResult.email);
      res.status(HTTP_OK).send({
        authenticated: true,
        // user: {
        //   id: user.id,
        //   email: user.email,
        //   firstName: user.firstName,
        //   lastName: user.lastName,
        //   avatar: user.avatar,
        // },
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

      const lessons = mockData.courseLessons[courseId];
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
      const lessons = mockData.courseLessons[courseId];

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
      const lessons = mockData.courseLessons[courseId];

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

      if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult.email)) {
        res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
        return;
      }

      const stats = mockData.userStats.find((s) => areIdsEqual(s.userId, userId));
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

      if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult.email)) {
        res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
        return;
      }

      const certificates = mockData.certificates.filter((c) => areIdsEqual(c.userId, userId)) || [];
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

      const lessons = mockData.courseLessons[courseId];
      const progress = mockData.lessonProgress.filter(
        (p) => areIdsEqual(p.userId, userId) && areIdsEqual(p.courseId, courseId)
      );

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
      const enrollment = mockData.userEnrollments.find(
        (e) => areIdsEqual(e.userId, userId) && areIdsEqual(e.courseId, courseId)
      );
      res.status(HTTP_OK).send({ progress: enrollment?.progress || 0 });
      return;
    }

    // Get course by ID
    // /learning/courses/:courseId
    if (urlParts.length === 4 && urlParts[1] === "learning" && urlParts[2] === "courses") {
      const courseId = parseInt(urlParts[3]);
      const course = mockData.courses.find((c) => areIdsEqual(c.id, courseId));

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

      if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult.email)) {
        res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
        return;
      }

      const user = mockData.users.find((u) => areIdsEqual(u.id, userId));
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
          res.status(HTTP_OK).send(mockData.courses);
          return;
      }
    }

    if (urlParts.length === 4 && urlParts[1] === "learning" && urlParts[2] === "quiz" && urlParts[3] === "attempts") {
      res.status(HTTP_OK).send(mockData.quizAttempts);
      return;
    }

    // Get course ratings
    // /learning/courses/{courseId}/ratings
    if (req.method === "GET" && urlParts.length === 5 && urlParts[4] === "ratings") {
      const courseId = parseInt(urlParts[3]);
      const ratings = mockData.userRatings.filter((r) => areIdsEqual(r.courseId, courseId));

      // Enhance ratings with user info
      const ratingsWithUserInfo = ratings.map((rating) => {
        const user = mockData.users.find((u) => areIdsEqual(u.id, rating.userId));
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

      const user = mockData.users.find((u) => u.email === verifyTokenResult?.email);

      if (!hasPermission(user, "manage_roles")) {
        res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Insufficient permissions"));
        return;
      }

      res.status(HTTP_OK).send({
        roles: Object.values(mockData.roles),
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
      if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult.email)) {
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
      if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult.email)) {
        res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
        return;
      }

      const history = mockData.fundsHistory.filter((t) => areIdsEqual(t.userId, userId));
      history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by timestamp desc

      res.status(HTTP_OK).send({ history });
      return;
    }

    // Add instructor endpoints
    // /api/learning/instructor/
    if (urlParts[2] === "instructor") {
      logDebug("Instructor endpoint:", { urlParts });
      if (!checkIfUserIsAuthenticated(req, res)) {
        res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
        return;
      }

      const user = mockData.users.find((u) => u.email === verifyTokenResult?.email);
      if (!isInstructor(user)) {
        res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Must be an instructor"));
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
          // check for /api/learning/instructor/courses/:id/lessons
          if (urlParts[5] === "lessons") {
            const courseId = parseInt(urlParts[4]);
            const lessons = mockData.courseLessons[courseId];
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
            const course = mockData.courses.find((c) => c.id === courseId);
            if (course) {
              res.status(HTTP_OK).send(course);
            } else {
              res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Course not found"));
            }
            return;
          }
          // check for /api/learning/instructor/courses
          else {
            const courses = mockData.courses.filter((course) =>
              mockData.courseOwnership.some(
                (ownership) => ownership.instructorId === user.id && ownership.courseId === course.id
              )
            );
            res.status(HTTP_OK).send(courses);
            return;
          }
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
              ? mockData.courses.filter((course) =>
                  mockData.courseOwnership.some(
                    (o) => areIdsEqual(o.instructorId, user.id) && areIdsEqual(o.courseId, course.id)
                  )
                )
              : mockData.courses.filter(
                  (course) =>
                    areIdsEqual(course.id, courseId) &&
                    mockData.courseOwnership.some(
                      (o) => areIdsEqual(o.instructorId, user.id) && areIdsEqual(o.courseId, course.id)
                    )
                );

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
              completion: calculateCompletionMetrics(targetCourses),
              rating: calculateRatingMetrics(targetCourses),
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
          return;
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
          const user = mockData.users.find((u) => u.username === username && u.password === password);

          if (user) {
            if (mockData.failedLoginAttempts[user.email]) {
              delete mockData.failedLoginAttempts[user.email];
            }
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
            const foundUser = mockData.users.find((u) => u.username === username);
            if (foundUser) {
              const email = foundUser.email;
              if (!mockData.failedLoginAttempts[email]) {
                mockData.failedLoginAttempts[email] = { count: 0, lastAttempt: null };
              }
              mockData.failedLoginAttempts[email].count++;
              mockData.failedLoginAttempts[email].lastAttempt = new Date().toISOString();
            }
            res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Invalid credentials"));
          }
          return;
        }
        // /learning/auth/register
        case "register": {
          const { username, password, email, avatar, firstName, lastName } = req.body;

          if (mockData.users.find((u) => u.username === username || u.email === email)) {
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
          if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult.email)) {
            res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
            return;
          }

          const course = mockData.courses.find((c) => areIdsEqual(c.id, courseId));
          if (!course) {
            res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Course not found"));
            return;
          }

          // Add instructor check
          const isInstructorOfCourse = mockData.courseOwnership.some(
            (ownership) => areIdsEqual(ownership.courseId, courseId) && areIdsEqual(ownership.instructorId, userId)
          );

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
            id: mockData.userEnrollments.length + 1,
            userId,
            courseId,
            enrollmentDate: new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
            progress: 0,
            completed: false,
            paidAmount: course.price,
          };

          mockData.userEnrollments.push(enrollment);
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

          if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult.email)) {
            res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
            return;
          }

          const { progress } = req.body;
          const enrollment = mockData.userEnrollments.find(
            (e) => areIdsEqual(e.courseId, courseId) && areIdsEqual(e.userId, userId)
          );

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

                  const maxCertId = mockData.certificates.reduce((max, cert) => (cert.id > max ? cert.id : max), 0);
                  mockData.certificates.push({
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

    // Add inside handleLearning function before the final else
    if (req.method === "POST" && urlParts.length === 5 && urlParts[4] === "rate") {
      if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
        res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
        return;
      }

      const courseId = parseInt(urlParts[3]);
      const { userId, rating, comment } = req.body;

      if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult.email)) {
        res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not authorized"));
        return;
      }

      const course = mockData.courses.find((c) => areIdsEqual(c.id, courseId));
      if (!course) {
        res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Course not found"));
        return;
      }

      // Check if user is enrolled in the course
      const isEnrolled = mockData.userEnrollments.find(
        (e) => areIdsEqual(e.userId, userId) && areIdsEqual(e.courseId, courseId)
      );

      if (!isEnrolled) {
        res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User not enrolled in this course"));
        return;
      }

      // Remove any existing rating by this user for this course
      const existingRatingIndex = mockData.userRatings.findIndex(
        (r) => areIdsEqual(r.userId, userId) && areIdsEqual(r.courseId, courseId)
      );

      if (existingRatingIndex !== -1) {
        mockData.userRatings.splice(existingRatingIndex, 1);
      }

      // Add new rating
      mockData.userRatings.push({
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

    // Inside handleLearning function, in the POST section where instructor endpoints are handled
    // /learning/instructor/courses/:courseId/lessons
    if (urlParts[2] === "instructor") {
      if (!checkIfUserIsAuthenticated(req, res)) {
        res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
        return;
      }

      const user = mockData.users.find((u) => u.email === verifyTokenResult?.email);
      if (!isInstructor(user) && !isAdmin(user)) {
        res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Must be an instructor"));
        return;
      }

      switch (urlParts[3]) {
        // /learning/instructor/courses/:courseId/lessons
        case "courses": {
          if (req.method === "POST") {
            const { title, description, price, level, tags } = req.body;

            if (!title || !description || price === undefined || !level) {
              res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Missing required fields"));
              return;
            }

            const maxCourseId = Math.max(...mockData.courses.map((c) => c.id), 0);
            const newCourse = {
              id: maxCourseId + 1,
              title,
              description,
              thumbnail: "..\\data\\learning\\courses\\default-course.jpg",
              instructor: `${user.firstName} ${user.lastName}`,
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

            mockData.courses.push(newCourse);
            mockData.courseOwnership.push({
              courseId: newCourse.id,
              instructorId: user.id,
            });

            mockData.courseLessons[newCourse.id] = [];

            res.status(HTTP_OK).send({
              success: true,
              message: "Course created successfully",
              course: newCourse,
            });
            return;
          }
          break;
        }
      }
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
    // /learning/users/{userId}/password
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

    // Update user funds
    // /learning/users/{userId}/funds
    if (urlParts.length === 5 && urlParts[1] === "learning" && urlParts[2] === "users" && urlParts[4] === "funds") {
      if (checkIfUserIsAuthenticated(req, res, "learning", urlEnds) === false) {
        res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authenticated"));
        return;
      }

      const userId = parseInt(urlParts[3]);
      if (!checkIfUserIdMatchesEmail(userId, verifyTokenResult.email)) {
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

      const user = mockData.users.find((u) => u.email === verifyTokenResult?.email);

      if (!hasPermission(user, "manage_roles")) {
        res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Must be an admin to modify roles"));
        return;
      }

      const targetUserId = parseInt(urlParts[3]);
      const { role } = req.body;

      if (!Object.values(mockData.roles).includes(role)) {
        res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Invalid role"));
        return;
      }

      const targetUser = mockData.users.find((u) => u.id === targetUserId);
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

      const user = mockData.users.find((u) => u.email === verifyTokenResult?.email);
      if (!isInstructor(user) && !isAdmin(user)) {
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
      const courseLessons = mockData.courseLessons[courseId];
      if (!courseLessons) {
        res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Course not found"));
        return;
      }

      const lessonIndex = courseLessons.findIndex((lesson) => lesson.id === lessonId);
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
  const enrollments = mockData.userEnrollments.filter(
    (e) => courses.some((c) => c.id === e.courseId) && new Date(e.enrollmentDate) >= startDate
  );

  const previousStartDate = new Date(startDate);
  previousStartDate.setDate(startDate.getDate() - (new Date() - startDate) / (1000 * 60 * 60 * 24));

  const previousEnrollments = mockData.userEnrollments.filter(
    (e) =>
      courses.some((c) => c.id === e.courseId) &&
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
  const currentRevenue = mockData.userEnrollments
    .filter((e) => courses.some((c) => c.id === e.courseId) && new Date(e.enrollmentDate) >= startDate)
    .reduce((total, enrollment) => {
      const course = courses.find((c) => c.id === enrollment.courseId);
      return total + (enrollment.paidAmount || course?.price || 0);
    }, 0);

  const previousStartDate = new Date(startDate);
  previousStartDate.setDate(startDate.getDate() - (new Date() - startDate) / (1000 * 60 * 60 * 24));

  const previousRevenue = mockData.userEnrollments
    .filter(
      (e) =>
        courses.some((c) => c.id === e.courseId) &&
        new Date(e.enrollmentDate) >= previousStartDate &&
        new Date(e.enrollmentDate) < startDate
    )
    .reduce((total, enrollment) => {
      const course = courses.find((c) => c.id === enrollment.courseId);
      return total + (enrollment.paidAmount || course?.price || 0);
    }, 0);

  return {
    total: currentRevenue,
    trend: previousRevenue ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100) : 0,
  };
}

function calculateCompletionMetrics(courses) {
  const completedCount = mockData.userEnrollments.filter(
    (e) => courses.some((c) => c.id === e.courseId) && e.completed
  ).length;

  const totalEnrollments = mockData.userEnrollments.filter((e) => courses.some((c) => c.id === e.courseId)).length;

  return {
    rate: totalEnrollments ? Math.round((completedCount / totalEnrollments) * 100) : 0,
    trend: 0, // Calculate trend if needed
  };
}

function calculateRatingMetrics(courses) {
  const ratings = mockData.userRatings.filter((r) => courses.some((c) => c.id === r.courseId));

  const average = ratings.length ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;

  return {
    average: Number(average.toFixed(1)),
    trend: 0, // Calculate trend if needed
  };
}

function getTopPerformingCourses(courses) {
  return courses
    .map((course) => ({
      title: course.title,
      enrollments: mockData.userEnrollments.filter((e) => e.courseId === course.id).length,
      revenue: course.price * mockData.userEnrollments.filter((e) => e.courseId === course.id).length,
      rating: course.rating,
    }))
    .sort((a, b) => b.enrollments - a.enrollments)
    .slice(0, 5);
}

function getRecentReviews(courses, startDate) {
  return mockData.userRatings
    .filter((r) => courses.some((c) => c.id === r.courseId) && new Date(r.createdAt) >= startDate)
    .map((review) => ({
      courseTitle: courses.find((c) => c.id === review.courseId)?.title,
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

    const count = mockData.userEnrollments.filter(
      (e) =>
        courses.some((c) => c.id === e.courseId) &&
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

    const amount = mockData.userEnrollments
      .filter(
        (e) =>
          courses.some((c) => c.id === e.courseId) &&
          new Date(e.enrollmentDate) >= dayStart &&
          new Date(e.enrollmentDate) <= dayEnd
      )
      .reduce((total, enrollment) => {
        const course = courses.find((c) => c.id === enrollment.courseId);
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
  checkIfUserCanAccessCourse, // Export the new function
};
