import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import serverManager from '../helpers/server-manager.js'

describe('Learning Endpoints (core flows)', () => {
  let baseUrl
  let auth = { token: null, userId: null, username: null }

  beforeAll(async () => {
    // Ensure server is up
    if (!serverManager.isServerReady()) {
      await serverManager.startServer()
    }
    baseUrl = serverManager.getBaseUrl()

    // Reset learning database for deterministic tests
    await request(baseUrl).get('/api/learning/system/restore').expect(200)
  })

  describe('Auth', () => {
    it('POST /api/learning/auth/login should authenticate and return token', async () => {
      const response = await request(baseUrl)
        .post('/api/learning/auth/login')
        .send({ username: 'user', password: 'demo' })
        .expect(200)

      expect(response.body).toBeDefined()
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('access_token')
      expect(response.body).toHaveProperty('id')

      auth.token = response.body.access_token
      auth.userId = response.body.id
      auth.username = response.body.username
    })

    it('GET /api/learning/auth/status should report authenticated=true with token', async () => {
      const response = await request(baseUrl)
        .get('/api/learning/auth/status')
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(200)

      expect(response.body).toBeDefined()
      expect(response.body.authenticated).toBe(true)
      expect(response.body.user).toBeDefined()
      expect(response.body.user.id).toBe(auth.userId)
    })
  })

  describe('Courses - list and details', () => {
    it('GET /api/learning/courses should return a list of courses', async () => {
      const response = await request(baseUrl)
        .get('/api/learning/courses')
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
    })

    it('GET /api/learning/courses/1 should return course details', async () => {
      const response = await request(baseUrl)
        .get('/api/learning/courses/1')
        .expect(200)

      expect(response.body).toHaveProperty('id', 1)
      expect(response.body).toHaveProperty('title')
    })

        it('DELETE /api/learning/admin/users/3/delete should remove the user and its dependencies', async () => {
      await request(baseUrl).get('/api/learning/system/restore').expect(200)

      const adminLogin = await request(baseUrl)
        .post('/api/learning/auth/login')
        .send({ username: 'admin', password: '1234' })
        .expect(200)

      const response = await request(baseUrl)
        .delete('/api/learning/admin/users/3/delete')
        .set('Authorization', `Bearer ${adminLogin.body.access_token}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.deleted.user).toBe(1)

      const data = await request(baseUrl).get('/api/learning/system/data').expect(200)
      expect(data.body.users.some((user) => user.id === 3)).toBe(false)
      expect(data.body.failedLoginAttempts['jane_smith@test.test.com']).toBeUndefined()

      for (const collection of [
        'userEnrollments',
        'lessonProgress',
        'userStats',
        'certificates',
        'userRatings',
        'fundsHistory',
        'quizAttempts',
        'roleRequests',
      ]) {
        expect(data.body[collection].some((item) => item.userId === 3)).toBe(false)
      }
    })

    it('DELETE /api/learning/admin/courses/1 should remove the course and its dependencies', async () => {
      await request(baseUrl).get('/api/learning/system/restore').expect(200)

      const adminLogin = await request(baseUrl)
        .post('/api/learning/auth/login')
        .send({ username: 'admin', password: '1234' })
        .expect(200)

      const response = await request(baseUrl)
        .delete('/api/learning/admin/courses/1')
        .set('Authorization', `Bearer ${adminLogin.body.access_token}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.deleted.course).toBe(1)
      expect(response.body.deleted.lessons).toBeGreaterThan(0)

      const data = await request(baseUrl).get('/api/learning/system/data').expect(200)
      expect(data.body.courses.some((course) => course.id === 1)).toBe(false)
      expect(data.body.courseLessons['1']).toBeUndefined()
      expect(data.body.userEnrollments.some((item) => item.courseId === 1)).toBe(false)
      expect(data.body.lessonProgress.some((item) => item.courseId === 1)).toBe(false)
      expect(data.body.certificates.some((item) => item.courseId === 1)).toBe(false)
      expect(data.body.userRatings.some((item) => item.courseId === 1)).toBe(false)
      expect(data.body.quizAttempts.some((item) => item.courseId === 1)).toBe(false)
      expect(data.body.courses.some((course) => course.id === 2)).toBe(true)
    })
  })

  describe('Enrollment and Progress', () => {
    it('POST /api/learning/courses/3/enroll should enroll authenticated user', async () => {
      const response = await request(baseUrl)
        .post('/api/learning/courses/3/enroll')
        .set('Authorization', `Bearer ${auth.token}`)
        .send({ userId: auth.userId })
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
    })

    it('GET /api/learning/courses/3/progress without token should be forbidden (no token)', async () => {
      const response = await request(baseUrl)
        .get('/api/learning/courses/3/progress')
        .expect(403)

      expect(response.body).toBeDefined()
    })

    it('GET /api/learning/courses/3/progress should return progress for enrolled user', async () => {
      // ensure enrollment
      await request(baseUrl)
        .post('/api/learning/courses/3/enroll')
        .set('Authorization', `Bearer ${auth.token}`)
        .send({ userId: auth.userId })
        .then(() => {})
        .catch(() => {})
      const response = await request(baseUrl)
        .get('/api/learning/courses/3/progress')
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(200)

      expect(response.body).toHaveProperty('progress')
      expect(typeof response.body.progress).toBe('number')
    })

    it('POST /api/learning/courses/3/progress should update progress', async () => {
      // ensure enrollment
      await request(baseUrl)
        .post('/api/learning/courses/3/enroll')
        .set('Authorization', `Bearer ${auth.token}`)
        .send({ userId: auth.userId })
        .then(() => {})
        .catch(() => {})
      const response = await request(baseUrl)
        .post('/api/learning/courses/3/progress')
        .set('Authorization', `Bearer ${auth.token}`)
        .send({ userId: auth.userId, progress: 50 })
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('progress', 50)
    })
  })
})


