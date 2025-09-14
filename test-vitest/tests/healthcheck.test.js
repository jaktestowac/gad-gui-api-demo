import { describe, it, expect } from 'vitest'
import request from 'supertest'
import serverManager from './helpers/server-manager.js'

describe('Healthcheck Endpoints', () => {
  const baseUrl = serverManager.getBaseUrl()

  describe('Server Health Check', () => {
    it('should verify server is working by calling /api/about', async () => {
      const response = await request(baseUrl)
        .get('/api/about')
        .expect(200)

      expect(response.body).toBeDefined()
      expect.soft(response.body).toHaveProperty('name')
      expect.soft(response.body).toHaveProperty('version')
      expect.soft(response.body).toHaveProperty('description')
      
      console.log('✅ Server health check passed - app info:', {
        name: response.body.name,
        version: response.body.version
      })
    })
  })

  describe('Healthcheck Endpoints', () => {
    it('should return pong for /api/ping', async () => {
      const response = await request(baseUrl)
        .get('/api/ping')
        .expect(200)

      expect(response.body).toEqual({
        response: 'pong',
        status: 'OK'
      })
    })

    it('should return health status for /api/health', async () => {
      const response = await request(baseUrl)
        .get('/api/health')
        .expect(200)

      expect(response.body).toBeDefined()
      expect.soft(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('health')
      expect.soft(response.body.health).toHaveProperty('timestamp')
      expect.soft(response.body.health).toHaveProperty('memoryUsageMB')
    })

    it('should return config check status for /api/health/configcheck', async () => {
      const response = await request(baseUrl)
        .get('/api/health/configcheck')
        .expect(200)

      expect(response.body).toBeDefined()
      expect.soft(response.body).toHaveProperty('status')
      expect.soft(['OK', 'Down']).toContain(response.body.status)
    })

    it('should return database check status for /api/health/dbcheck', async () => {
      const response = await request(baseUrl)
        .get('/api/health/dbcheck')
        .expect(200)

      expect(response.body).toBeDefined()
      expect.soft(response.body).toHaveProperty('status')
      expect.soft(response.body).toHaveProperty('result')
      expect.soft(['OK', 'Degraded']).toContain(response.body.status)
    })

    it('should return memory usage for /api/health/memory', async () => {
      const response = await request(baseUrl)
        .get('/api/health/memory')
        .expect(200)

      expect(response.body).toBeDefined()
      expect.soft(response.body).toHaveProperty('status')
      expect.soft(response.body).toHaveProperty('rss')
      expect.soft(response.body).toHaveProperty('heapTotal')
      expect.soft(response.body).toHaveProperty('heapUsed')
    })

    it('should return uptime information for /api/health/uptime', async () => {
      const response = await request(baseUrl)
        .get('/api/health/uptime')
        .expect(200)

      expect(response.body).toBeDefined()
      expect.soft(response.body).toHaveProperty('status')
      expect.soft(response.body).toHaveProperty('uptime')
      expect(response.body).toHaveProperty('uptimeTotal')
      expect.soft(response.body.uptimeTotal).toHaveProperty('days')
      expect.soft(response.body.uptimeTotal).toHaveProperty('hours')
      expect.soft(response.body.uptimeTotal).toHaveProperty('minutes')
      expect.soft(response.body.uptimeTotal).toHaveProperty('seconds')
    })

    it('should return database entity count for /api/health/db', async () => {
      const response = await request(baseUrl)
        .get('/api/health/db')
        .expect(200)

      expect(response.body).toBeDefined()
      expect.soft(response.body).toHaveProperty('status')
      expect.soft(response.body).toHaveProperty('entities')
      expect.soft(typeof response.body.entities).toBe('object')
    })
  })
}) 