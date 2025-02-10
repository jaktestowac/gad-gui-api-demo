class ApiService {
  constructor() {
    this.baseUrl = "/api/learning";
  }

  getUserIdFromCookie() {
    const cookie = document.cookie.split("; ").find((row) => row.startsWith("learning_user_id="));
    return cookie ? parseInt(cookie.split("=")[1]) : null;
  }

  getAccessToken() {
    const cookie = document.cookie.split("; ").find((row) => row.startsWith("learning_access_token="));
    return cookie ? cookie.split("=")[1] : null;
  }

  getDefaultHeaders() {
    let auth = undefined;
    const token = this.getAccessToken();

    if (token !== undefined) auth = `Bearer ${token}`;

    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      authorization: auth,
    };
  }

  // User methods
  async getUsers() {
    const response = await fetch(`${this.baseUrl}/users`, {
      headers: this.getDefaultHeaders(),
    });
    const data = await response.json();
    return data;
  }

  async getUserById(userId) {
    const response = await fetch(`${this.baseUrl}/users/${userId}`, {
      headers: this.getDefaultHeaders(),
    });
    const data = await response.json();
    return data;
  }

  async getCurrentUser() {
    return this.getUserById(this.getUserIdFromCookie());
  }

  async getUserStats(userId) {
    const response = await fetch(`${this.baseUrl}/users/${userId}/stats`, {
      headers: this.getDefaultHeaders(),
    });
    const data = await response.json();
    return data;
  }

  async updateUserProfile(userId, userData) {
    const response = await fetch(`${this.baseUrl}/users/${userId}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("learning_access_token")}`,
      },
      body: JSON.stringify({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        currentPassword: userData.currentPassword,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update profile");
    }

    document.cookie = `learning_username=${userData.username}; max-age=86400; path=/`;
    document.cookie = `learning_first_name=${userData.firstName}; max-age=86400; path=/`;
    document.cookie = `learning_last_name=${userData.lastName}; max-age=86400; path=/`;

    return response.json();
  }

  async changePassword(userId, currentPassword, newPassword) {
    const response = await fetch(`${this.baseUrl}/users/${userId}/password`, {
      method: "PUT",
      headers: this.getDefaultHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await response.json();
    return data;
  }

  // Course methods
  async getCourses() {
    const response = await fetch(`${this.baseUrl}/courses`, {
      headers: this.getDefaultHeaders(),
    });
    const data = await response.json();
    return data;
  }

  async getCourseById(courseId) {
    const response = await fetch(`${this.baseUrl}/courses/${courseId}`, {
      headers: this.getDefaultHeaders(),
    });
    const data = await response.json();
    return data;
  }

  // Enrollment methods
  async getEnrollments() {
    const response = await fetch(`${this.baseUrl}/enrollments`, {
      headers: this.getDefaultHeaders(),
    });
    const data = await response.json();
    return data;
  }

  async getUserEnrollments(userId) {
    const response = await fetch(`${this.baseUrl}/users/${userId}/enrollments`, {
      headers: this.getDefaultHeaders(),
    });
    const enrollments = await response.json();
    return enrollments;
  }

  async getEnrolledCourses() {
    const enrollments = await this.getUserEnrollments(this.getUserIdFromCookie());
    const courses = await this.getCourses();

    return enrollments.map((enrollment) => {
      const course = courses.find((c) => c.id === enrollment.courseId);
      return { ...course, ...enrollment };
    });
  }

  // Lesson methods
  async getLessons(courseId) {
    const response = await fetch(`${this.baseUrl}/courses/${courseId}/lessons`, {
      headers: this.getDefaultHeaders(),
    });
    const data = await response.json();
    return data;
  }

  async getLessonById(courseId, lessonId) {
    const lessons = await this.getLessons(courseId);
    return lessons.find((l) => l.id === lessonId);
  }

  // Progress methods
  async getLessonProgress() {
    const response = await fetch(`${this.baseUrl}/progress/lessons`, {
      headers: this.getDefaultHeaders(),
    });
    const data = await response.json();
    return data;
  }

  async getUserLessonProgress(userId, courseId) {
    const progress = await this.getLessonProgress();
    return progress.filter((p) => p.userId === userId && p.courseId === courseId);
  }

  // Certificate methods
  async getUserCertificates(userId) {
    const response = await fetch(`${this.baseUrl}/users/${userId}/certificates`, {
      headers: this.getDefaultHeaders(),
    });
    const data = await response.json();
    return data.certificates || [];
  }

  async getCurrentUserCertificates() {
    return this.getUserCertificates(this.getUserIdFromCookie());
  }

  // Quiz methods
  async getQuizAttempts() {
    const response = await fetch(`${this.baseUrl}/quiz/attempts`, {
      headers: this.getDefaultHeaders(),
    });
    const data = await response.json();
    return data;
  }

  async getUserQuizAttempts(userId, courseId, lessonId) {
    const attempts = await this.getQuizAttempts();
    return attempts.filter((a) => a.userId === userId && a.courseId === courseId && a.lessonId === lessonId);
  }

  // Action methods
  async enrollCourse(courseId) {
    const response = await fetch(`${this.baseUrl}/courses/${courseId}/enroll`, {
      method: "POST",
      headers: this.getDefaultHeaders(),
      body: JSON.stringify({ userId: this.getUserIdFromCookie() }),
    });
    const data = await response.json();
    return data;
  }

  async markLessonComplete(courseId, lessonId) {
    const response = await fetch(`${this.baseUrl}/courses/${courseId}/lessons/${lessonId}/complete`, {
      method: "POST",
      headers: this.getDefaultHeaders(),
      body: JSON.stringify({ userId: this.getUserIdFromCookie() }),
    });
    const data = await response.json();
    return data;
  }

  async generateCertificate(courseId) {
    const response = await fetch(`${this.baseUrl}/courses/${courseId}/certificate`, {
      method: "POST",
      headers: this.getDefaultHeaders(),
      body: JSON.stringify({ userId: this.getUserIdFromCookie() }),
    });
    const data = await response.json();
    return data;
  }

  async submitQuiz(courseId, lessonId, answers) {
    const response = await fetch(`${this.baseUrl}/courses/${courseId}/lessons/${lessonId}/quiz`, {
      method: "POST",
      headers: this.getDefaultHeaders(),
      body: JSON.stringify({
        userId: this.getUserIdFromCookie(),
        answers,
      }),
    });
    const data = await response.json();
    return data;
  }

  // Authentication
  async login(username, password) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: "POST",
      headers: this.getDefaultHeaders(),
      body: JSON.stringify({ username, password }),
    });

    if (response.status === 401) {
      throw new Error("Invalid username or password");
    }

    const data = await response.json();
    if (data.success) {
      document.cookie = `learning_user_id=${data.id}; path=/; max-age=86400`;
      document.cookie = `learning_access_token=${data.access_token}; max-age=86400; path=/`;
      document.cookie = `learning_username=${data.username}; max-age=86400; path=/`;
      document.cookie = `learning_first_name=${data.firstName}; max-age=86400; path=/`;
      document.cookie = `learning_last_name=${data.lastName}; max-age=86400; path=/`;
      document.cookie = `learning_user_avatar=${data.avatar}; max-age=86400; path=/`;
    }
    return data;
  }

  async register(userData) {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: "POST",
      headers: this.getDefaultHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    return data;
  }

  async getCourseProgress(courseId) {
    const response = await fetch(`${this.baseUrl}/courses/${courseId}/progress`, {
      headers: this.getDefaultHeaders(),
    });
    const data = await response.json();
    return data.progress || 0;
  }

  async updateCourseProgress(courseId, progress) {
    const response = await fetch(`${this.baseUrl}/courses/${courseId}/progress`, {
      method: "POST",
      headers: this.getDefaultHeaders(),
      body: JSON.stringify({ progress }),
    });
    const data = await response.json();
    return data;
  }

  async getCourseLessons(courseId) {
    const [lessons, userProgress] = await Promise.all([
      this.getLessons(courseId),
      this.getUserLessonProgress(this.getUserIdFromCookie(), courseId),
    ]);

    const completedLessonIds = userProgress.map((p) => p.lessonId);

    return lessons.map((lesson) => ({
      ...lesson,
      completed: completedLessonIds.includes(lesson.id),
    }));
  }

  async getLessonContent(courseId, lessonId) {
    const response = await fetch(`${this.baseUrl}/courses/${courseId}/lessons/${lessonId}/content`, {
      headers: this.getDefaultHeaders(),
    });
    const data = await response.json();
    if (!data) {
      throw new Error("Lesson content not found");
    }
    return data.content;
  }

  calculateTotalHours(enrollments) {
    return enrollments.reduce(async (total, enrollment) => {
      const courses = await this.getCourses();
      const course = courses.find((c) => c.id === enrollment.courseId);
      return total + (course?.totalHours || 0) * (enrollment.progress / 100);
    }, 0);
  }

  async calculateLearningProgress() {
    const enrollments = await this.getUserEnrollments(this.getUserIdFromCookie());
    const progressData = {
      totalCourses: enrollments.length,
      completedCourses: 0,
      totalLessons: 0,
      completedLessons: 0,
      averageProgress: 0,
      totalHours: 0,
      completedHours: 0,
    };

    if (enrollments.length === 0) return progressData;

    const coursesPromises = enrollments.map((e) => this.getCourseById(e.courseId));
    const courses = await Promise.all(coursesPromises);

    progressData.totalHours = courses.reduce((total, course) => total + (course?.totalHours || 0), 0);

    const progressPromises = enrollments.map((enrollment) =>
      this.getUserLessonProgress(this.getUserIdFromCookie(), enrollment.courseId)
    );
    const allProgress = await Promise.all(progressPromises);

    for (let i = 0; i < enrollments.length; i++) {
      const course = courses[i];
      const enrollment = enrollments[i];
      const progress = allProgress[i];
      const lessons = await this.getLessons(enrollment.courseId);

      progressData.totalLessons += lessons.length;
      progressData.completedLessons += progress.length;

      if (enrollment.completed) {
        progressData.completedCourses++;
        progressData.completedHours += course.totalHours;
      } else {
        const completionRate = progress.length / lessons.length;
        progressData.completedHours += course.totalHours * completionRate;
      }
    }

    progressData.averageProgress = Math.round((progressData.completedLessons / progressData.totalLessons) * 100) || 0;

    return progressData;
  }
}

window.api = new ApiService();
