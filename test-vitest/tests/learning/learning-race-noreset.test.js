import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import serverManager from '../helpers/server-manager.js'

async function createIsolatedUser(baseUrl) {
  const ts = Date.now() + Math.floor(Math.random() * 100000)
  const user = {
    username: `lrace_${ts}`,
    password: 'demo',
    email: `lrace_${ts}@test.test`,
    firstName: 'Race',
    lastName: 'Tester'
  }

  // Register (accept already exists), then login
  await request(baseUrl)
    .post('/api/learning/auth/register')
    .send(user)
    .expect((res) => {
      if (![200, 422].includes(res.status)) throw new Error(`unexpected status ${res.status}`)
    })

  const login = await request(baseUrl)
    .post('/api/learning/auth/login')
    .send({ username: user.username, password: user.password })
    .expect(200)

  return { token: login.body.access_token, userId: login.body.id }
}

async function tryTopUpFunds(baseUrl, auth, amount = 300) {
  // Try POST first
  const endpoints = [
    { method: 'post', url: `/api/learning/users/${auth.userId}/funds` },
    { method: 'put', url: `/api/learning/users/${auth.userId}/funds` }
  ]
  for (const ep of endpoints) {
    try {
      const res = await request(baseUrl)[ep.method](ep.url)
        .set('Authorization', `Bearer ${auth.token}`)
        .send({ amount })
      if (res.status === 200) return true
    } catch (_) {
      // continue
    }
  }
  return false
}

async function pickNonEnrolledCourse(baseUrl, auth, preferFree = false) {
  // Without querying enrollments (may be forbidden in some configs), just pick a course
  const coursesRes = await request(baseUrl).get('/api/learning/courses').expect(200)
  const courses = coursesRes.body
  const candidate = preferFree ? (courses.find((c) => Number(c.price) === 0) || courses[0]) : courses[0]
  if (!candidate) throw new Error('No available course to enroll for race test')
  return candidate
}

describe('Learning Race-Condition Probes (no reset)', () => {
  let baseUrl
  let auth
  let course
  let canAssertFunds = false

  beforeAll(async () => {
    if (!serverManager.isServerReady()) {
      await serverManager.startServer(60000)
    }
    baseUrl = serverManager.getBaseUrl()

    auth = await createIsolatedUser(baseUrl)

    // Pick course; if paid, try to top up; if top-up fails, prefer free course
    course = await pickNonEnrolledCourse(baseUrl, auth)
    if (Number(course.price) > 0) {
      const topped = await tryTopUpFunds(baseUrl, auth, Math.ceil(Number(course.price)) + 50)
      if (!topped) {
        // fallback to free course if available
        course = await pickNonEnrolledCourse(baseUrl, auth, true)
        canAssertFunds = Number(course.price) > 0 ? false : false
      } else {
        canAssertFunds = true
      }
    } else {
      canAssertFunds = false
    }
  })

  describe('Concurrent enrollment', () => {
    it('should not create duplicate enrollments or multiple charges', async () => {
      // Snapshot before
      const [fundsBeforeRes, fundsHistBeforeRes] = await Promise.all([
        request(baseUrl)
          .get(`/api/learning/users/${auth.userId}/funds`)
          .set('Authorization', `Bearer ${auth.token}`)
          .expect(canAssertFunds ? 200 : (r) => [200, 401, 403, 404].includes(r.status)),
        request(baseUrl)
          .get(`/api/learning/users/${auth.userId}/funds/history`)
          .set('Authorization', `Bearer ${auth.token}`)
          .expect(canAssertFunds ? 200 : (r) => [200, 401, 403, 404].includes(r.status))
      ])

      const fundsBefore = Number(fundsBeforeRes.body?.funds ?? 0)
      const historyBefore = (fundsHistBeforeRes.body?.history || []).length

      // Fire parallel enroll attempts
      const attempts = 8
      const results = await Promise.all(
        Array.from({ length: attempts }, () =>
          request(baseUrl)
            .post(`/api/learning/courses/${course.id}/enroll`)
            .set('Authorization', `Bearer ${auth.token}`)
            .send({ userId: auth.userId })
        )
      )

      const successCount = results.filter((r) => r.status === 200 && r.body?.success === true).length
      const alreadyCounts = results.filter((r) => r.status === 400).length

      // Some servers may race to 400 for all requests. The key invariant is final state.
      expect(successCount).toBeLessThanOrEqual(1)
      expect(alreadyCounts).toBeGreaterThanOrEqual(attempts - 1)

      // After-state
      const [fundsAfterRes, fundsHistAfterRes] = await Promise.all([
        request(baseUrl)
          .get(`/api/learning/users/${auth.userId}/funds`)
          .set('Authorization', `Bearer ${auth.token}`)
          .expect(canAssertFunds ? 200 : (r) => [200, 401, 403, 404].includes(r.status)),
        request(baseUrl)
          .get(`/api/learning/users/${auth.userId}/funds/history`)
          .set('Authorization', `Bearer ${auth.token}`)
          .expect(canAssertFunds ? 200 : (r) => [200, 401, 403, 404].includes(r.status))
      ])

      // Follow-up enroll should now return 400 if exactly one enrollment exists
      const followUp = await request(baseUrl)
        .post(`/api/learning/courses/${course.id}/enroll`)
        .set('Authorization', `Bearer ${auth.token}`)
        .send({ userId: auth.userId })
      expect([400, 403]).toContain(followUp.status)

      const priceNum = Number(course.price)
      if (canAssertFunds && priceNum > 0 && fundsBefore >= priceNum) {
        const fundsAfter = Number(fundsAfterRes.body.funds)
        expect(fundsAfter).toBeCloseTo(fundsBefore - priceNum, 2)

        const fundsHistoryAfter = fundsHistAfterRes.body.history || []
        const newHistory = fundsHistoryAfter.slice(historyBefore)
        // Exactly one new debit for this course
        const newDebits = newHistory.filter(
          (h) => h.type === 'debit' && String(h.description || '').includes(course.title)
        )
        expect(newDebits.length).toBe(1)
        expect(newDebits[0].amount).toBeCloseTo(priceNum, 2)
      }
    })
  })

  describe('Concurrent progress updates', () => {
    it('should update progress without producing errors', async () => {
      // Ensure enrolled (idempotent)
      await request(baseUrl)
        .post(`/api/learning/courses/${course.id}/enroll`)
        .set('Authorization', `Bearer ${auth.token}`)
        .send({ userId: auth.userId })

      const updates = [10, 35, 60, 80, 55]
      const responses = await Promise.all(
        updates.map((progress) =>
          request(baseUrl)
            .post(`/api/learning/courses/${course.id}/progress`)
            .set('Authorization', `Bearer ${auth.token}`)
            .send({ userId: auth.userId, progress })
        )
      )

      // No 5xx, ideally all 200
      expect(responses.every((r) => r.status >= 200 && r.status < 500)).toBe(true)

      const progressRes = await request(baseUrl)
        .get(`/api/learning/courses/${course.id}/progress`)
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(200)

      const value = Number(progressRes.body.progress)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(100)
    })
  })

  describe('Concurrent lesson completion and certificate', () => {
    it('should issue at most one certificate after completing all lessons', async () => {
      // Ensure enrolled
      await request(baseUrl)
        .post(`/api/learning/courses/${course.id}/enroll`)
        .set('Authorization', `Bearer ${auth.token}`)
        .send({ userId: auth.userId })

      const certsBeforeRes = await request(baseUrl)
        .get(`/api/learning/users/${auth.userId}/certificates`)
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(200)
      const beforeCount = certsBeforeRes.body.certificates.filter((c) => c.courseId === course.id).length

      // Fetch only lesson titles (ids)
      const lessonsRes = await request(baseUrl)
        .get(`/api/learning/courses/${course.id}/lessons/titles`)
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(200)
      const lessonIds = lessonsRes.body.map((l) => l.id)
      expect(lessonIds.length).toBeGreaterThan(0)

      await Promise.all(
        lessonIds.map((lessonId) =>
          request(baseUrl)
            .post(`/api/learning/courses/${course.id}/lessons/${lessonId}/complete`)
            .set('Authorization', `Bearer ${auth.token}`)
            .send({ userId: auth.userId })
        )
      )

      const certsAfterRes = await request(baseUrl)
        .get(`/api/learning/users/${auth.userId}/certificates`)
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(200)
      const afterCount = certsAfterRes.body.certificates.filter((c) => c.courseId === course.id).length

      expect(afterCount - beforeCount).toBeLessThanOrEqual(1)
    })
  })
})


