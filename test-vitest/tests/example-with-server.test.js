import { describe, it, expect } from 'vitest'
import request from 'supertest'
import serverManager from './helpers/server-manager.js'

describe('Example Test with Server', () => {
  const baseUrl = serverManager.getBaseUrl()

  it('should verify server is available', async () => {
    // This test demonstrates that the server is available to all test files
    // Ensure server is ready (handles cases where global setup state is lost)
    if (!serverManager.isServerReady()) {
      await serverManager.startServer()
    }
    
    expect(serverManager.isServerReady()).toBe(true)
    
    const response = await request(baseUrl)
      .get('/api/about')
      .expect(200)

    expect.soft(response.body).toHaveProperty('name')
    expect.soft(response.body).toHaveProperty('version')
  })

  it('should test ping endpoint', async () => {
    const response = await request(baseUrl)
      .get('/api/ping')
      .expect(200)

    expect.soft(response.body.response).toBe('pong')
    expect.soft(response.body.status).toBe('OK')
  })
}) 