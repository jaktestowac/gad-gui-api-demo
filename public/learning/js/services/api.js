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
      throw new Error(error.error?.message || "Failed to update profile");
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

  async deactivateAccount(userId, password) {
    const response = await fetch(`${this.baseUrl}/users/${userId}/deactivate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("learning_access_token")}`,
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const error = await response.json();
      return error;
    }

    return response.json();
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

  async getCourseRatings(courseId) {
    const response = await fetch(`${this.baseUrl}/courses/${courseId}/ratings`, {
      headers: this.getDefaultHeaders(),
    });
    const data = await response.json();
    return data;
  }

  async getCourse(courseId) {
    const response = await fetch(`${this.baseUrl}/courses/${courseId}`, {
      headers: this.getDefaultHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch course");
    }
    return response.json();
  }

  // Enrollment methods
  async getUserEnrollments(userId) {
    const response = await fetch(`${this.baseUrl}/users/${userId}/enrollments`, {
      headers: this.getDefaultHeaders(),
    });
    const enrollments = await response.json();
    return enrollments;
  }

  async getEnrolledCourses() {
    const enrollments = await this.getUserEnrollments(this.getUserIdFromCookie());
    // TODO: refactor this method to get only user enrolled courses
    const courses = await this.getCourses();

    return enrollments.map((enrollment) => {
      const course = courses.find((c) => c.id === enrollment.courseId);
      return { ...course, ...enrollment };
    });
  }

  // Lesson methods
  async getLessons(courseId) {
    try {
      const response = await fetch(`${this.baseUrl}/courses/${courseId}/lessons`, {
        headers: this.getDefaultHeaders(),
      });
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching lessons:", error);
      return [];
    }
  }

  async getPreviewLessons(courseId) {
    try {
      const response = await fetch(`${this.baseUrl}/courses/${courseId}/lessons/preview`, {
        headers: this.getDefaultHeaders(),
      });
      const data = await response.json();
      return {
        previewLessons: Array.isArray(data.previewLessons) ? data.previewLessons : [],
        totalLessons: data.totalLessons || 0,
      };
    } catch (error) {
      console.error("Error fetching preview lessons:", error);
      return {
        previewLessons: [],
        totalLessons: 0,
      };
    }
  }

  // Get course lessons titles only
  async getCourseLessonsTitles(courseId) {
    const response = await fetch(`${this.baseUrl}/courses/${courseId}/lessons/titles`, {
      headers: this.getDefaultHeaders(),
    });
    const data = await response.json();
    return data;
  }

  async getLessonById(courseId, lessonId) {
    const lessons = await this.getLessons(courseId);
    return lessons.find((l) => l.id === lessonId);
  }

  async getCourseLessonsAsInstructor(courseId) {
    const instructorResponse = await fetch(`${this.baseUrl}/instructor/courses/${courseId}/lessons`, {
      headers: this.getDefaultHeaders(),
    });

    if (instructorResponse.ok) {
      const lessons = await instructorResponse.json();
      return Array.isArray(lessons) ? lessons : [];
    }
  }

  async getCourseLessons(courseId) {
    try {
      const response = await fetch(`${this.baseUrl}/courses/${courseId}/lessons`, {
        headers: this.getDefaultHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch lessons");
      }

      const [lessons, userProgress] = await Promise.all([response.json(), this.getUserLessonProgress(courseId)]);

      // Ensure both lessons and userProgress are arrays
      const lessonArray = Array.isArray(lessons) ? lessons : [];
      const progressArray = Array.isArray(userProgress) ? userProgress : [];

      const completedLessonIds = progressArray.map((p) => p.lessonId);

      return lessonArray.map((lesson) => ({
        ...lesson,
        completed: completedLessonIds.includes(lesson.id),
      }));
    } catch (error) {
      console.error("Error loading course lessons:", error);
      return [];
    }
  }

  async getLessonAsInstructor(courseId, lessonId) {
    const lessons = await this.getCourseLessonsAsInstructor(courseId);
    return lessons.find((l) => l.id === lessonId);
  }

  async getLesson(courseId, lessonId) {
    const lessons = await this.getCourseLessons(courseId);
    return lessons.find((l) => l.id === lessonId);
  }

  async addLesson(courseId, lessonData) {
    const response = await fetch(`${this.baseUrl}/instructor/courses/${courseId}/lessons`, {
      method: "POST",
      headers: this.getDefaultHeaders(),
      body: JSON.stringify(lessonData),
    });
    if (!response.ok) {
      throw new Error("Failed to add lesson");
    }
    return response.json();
  }

  async updateLesson(courseId, lessonId, lessonData) {
    const response = await fetch(`${this.baseUrl}/instructor/courses/${courseId}/lessons/${lessonId}`, {
      method: "PUT",
      headers: this.getDefaultHeaders(),
      body: JSON.stringify(lessonData),
    });
    if (!response.ok) {
      throw new Error("Failed to update lesson");
    }
    return response.json();
  }

  async deleteLesson(courseId, lessonId) {
    try {
      const response = await fetch(`${this.baseUrl}/instructor/courses/${courseId}/lessons/${lessonId}`, {
        method: "DELETE",
        headers: this.getDefaultHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Server returned ${response.status}: ${data.error || "Unknown error"}`);
      }

      if (!data.success) {
        throw new Error(data.message || "Server indicated failure but provided no message");
      }

      return {
        success: true,
        message: data.message || "Lesson deleted successfully",
      };
    } catch (error) {
      console.error("API Error - Delete Lesson:", {
        courseId,
        lessonId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(error.message || "Network error while deleting lesson");
    }
  }

  // Progress methods
  async getUserLessonProgress(courseId) {
    const response = await fetch(`${this.baseUrl}/courses/${courseId}/lessons/progress`, {
      headers: this.getDefaultHeaders(),
    });
    const data = await response.json();
    return data || [];
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
      document.cookie = `learning_user_role=${data.role}; max-age=86400; path=/`;
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

    const progressPromises = enrollments.map((enrollment) => this.getUserLessonProgress(enrollment.courseId));
    const allProgress = await Promise.all(progressPromises);

    for (let i = 0; i < enrollments.length; i++) {
      const course = courses[i];
      const enrollment = enrollments[i];
      const progress = allProgress[i];
      const lessons = await this.getCourseLessonsTitles(enrollment.courseId);

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
    console.log(progressData);
    return progressData;
  }

  async rateCourse(courseId, rating, comment = "") {
    try {
      const response = await fetch(`${this.baseUrl}/courses/${courseId}/rate`, {
        method: "POST",
        headers: this.getDefaultHeaders(),
        body: JSON.stringify({
          userId: this.getUserIdFromCookie(),
          rating: Number(rating),
          comment,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return error;
      }

      return response.json();
    } catch (error) {
      console.error("Rating submission error:", error);
      return error;
    }
  }

  async checkAuthStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/auth/status`, {
        headers: this.getDefaultHeaders(),
      });
      const data = await response.json();
      return data.authenticated;
    } catch (error) {
      console.error("Auth check failed:", error);
      return false;
    }
  }

  async getPublicCertificate(uuid) {
    const response = await fetch(`${this.baseUrl}/certificates/public/${uuid}`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Certificate not found");
    }

    return await response.json();
  }

  async getUserFunds(userId) {
    const response = await fetch(`${this.baseUrl}/users/${userId}/funds`, {
      headers: this.getDefaultHeaders(),
    });
    const data = await response.json();
    return data.funds;
  }

  async updateUserFunds(userId, newAmount) {
    const response = await fetch(`${this.baseUrl}/users/${userId}/funds`, {
      method: "PUT",
      headers: this.getDefaultHeaders(),
      body: JSON.stringify({ amount: newAmount }),
    });

    if (!response.ok) {
      const error = await response.json();
      return error;
    }

    return response.json();
  }

  async getUserFundsHistory(userId) {
    const response = await fetch(`${this.baseUrl}/users/${userId}/funds/history`, {
      headers: this.getDefaultHeaders(),
    });
    const data = await response.json();
    return data.history || [];
  }

  async getRoles() {
    const response = await fetch(`${this.baseUrl}/roles`, {
      headers: this.getDefaultHeaders(),
    });
    return response.json();
  }

  async assignRole(userId, role) {
    const response = await fetch(`${this.baseUrl}/users/${userId}/role`, {
      method: "PUT",
      headers: this.getDefaultHeaders(),
      body: JSON.stringify({ role }),
    });
    return response.json();
  }

  async getUserRole() {
    const user = await this.getCurrentUser();
    return user?.role;
  }

  async hasPermission(permission) {
    const user = await this.getCurrentUser();
    const response = await fetch(`${this.baseUrl}/permissions/check`, {
      method: "POST",
      headers: this.getDefaultHeaders(),
      body: JSON.stringify({ permission }),
    });
    return response.json();
  }

  // Instructor methods
  async getInstructorStats() {
    const response = await fetch(`${this.baseUrl}/instructor/stats`, {
      headers: this.getDefaultHeaders(),
    });
    return response.json();
  }

  async getInstructorCourses() {
    const response = await fetch(`${this.baseUrl}/instructor/courses`, {
      headers: this.getDefaultHeaders(),
    });
    return response.json();
  }

  async getInstructorStatsByInstructorId(instructorId) {
    const response = await fetch(`${this.baseUrl}/public/instructor/${instructorId}/stats`, {
      headers: this.getDefaultHeaders(),
    });
    return response.json();
  }

  async getInstructorCoursesByInstructorId(instructorId) {
    const response = await fetch(`${this.baseUrl}/public/instructor/${instructorId}/courses`, {
      headers: this.getDefaultHeaders(),
    });
    return response.json();
  }

  async createCourse(courseData) {
    const response = await fetch(`${this.baseUrl}/instructor/courses`, {
      method: "POST",
      headers: this.getDefaultHeaders(),
      body: JSON.stringify(courseData),
    });
    return response.json();
  }

  async updateCourse(courseId, courseData) {
    const response = await fetch(`${this.baseUrl}/instructor/courses/${courseId}`, {
      method: "PUT",
      headers: this.getDefaultHeaders(),
      body: JSON.stringify(courseData),
    });
    return response.json();
  }

  async createLesson(courseId, lessonData) {
    const response = await fetch(`${this.baseUrl}/instructor/courses/${courseId}/lessons`, {
      method: "POST",
      headers: this.getDefaultHeaders(),
      body: JSON.stringify(lessonData),
    });
    return response.json();
  }

  async getInstructorAnalytics(courseId = "all", timeRange = 30) {
    const params = new URLSearchParams();
    params.append("courseId", courseId);
    params.append("timeRange", timeRange);

    const response = await fetch(`${this.baseUrl}/instructor/analytics?${params.toString()}`, {
      headers: this.getDefaultHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.message || "Failed to fetch analytics data" };
    }

    const data = await response.json();
    if (!data.success) {
      const error = await response.json();
      return { error: error.message || "Failed to fetch analytics data" };
    }

    return data;
  }

  async getInstructorById(instructorId) {
    const response = await fetch(`${this.baseUrl}/public/instructor/${instructorId}`, {
      headers: this.getDefaultHeaders(),
    });
    return response.json();
  }

  // Health monitoring methods
  async getHealthStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: this.getDefaultHeaders(),
      });
      return response.json();
    } catch (error) {
      console.error("Health check failed:", error);
      return { status: "error", message: "Health check failed" };
    }
  }

  async getApiMetrics() {
    try {
      const response = await fetch(`${this.baseUrl}/metrics`, {
        headers: this.getDefaultHeaders(),
      });
      return response.json();
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
      return { error: "Failed to fetch metrics" };
    }
  }

  // Add retry logic for API calls
  async retryRequest(fn, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
}

window.api = new ApiService();
