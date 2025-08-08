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
      const response = await request(baseUrl)
        .get('/api/learning/courses/3/progress')
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(200)

      expect(response.body).toHaveProperty('progress')
      expect(typeof response.body.progress).toBe('number')
    })

    it('POST /api/learning/courses/3/progress should update progress', async () => {
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


