import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import request from 'supertest'
import config, { getConfig, updateConfig } from '../../config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

class ServerManager {
  constructor() {
    this.serverProcess = null
    this.isStarting = false
    this.isReady = false
    this.config = getConfig()
    this.baseUrl = this.config.baseUrl
    this.port = this.config.port
    this.host = this.config.host
    this.startTimeout = this.config.startTimeout
    this.debug = this.config.debug
    this.startPromise = null
  }

  async startServer(timeoutMs = null) {
    // Use provided timeout or config timeout
    const actualTimeout = timeoutMs || this.startTimeout

    // If already starting, wait for that promise
    if (this.isStarting) {
      console.log('⏳ Server is already starting, waiting...')
      return this.startPromise
    }

    // If already ready, return immediately
    if (this.isReady) {
      console.log('✅ Server is already running')
      return this.baseUrl
    }

    console.log(`🚀 Starting server on ${this.host}:${this.port}...`)
    if (this.debug) {
      console.log('🔧 Debug mode enabled')
      console.log('📋 Configuration:', this.config)
    }
    
    this.isStarting = true

    this.startPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.isStarting = false
        reject(new Error(`Server failed to start within ${actualTimeout}ms`))
      }, actualTimeout)

      const startServerProcess = async () => {
        try {
          // Start the server process
          this.serverProcess = spawn('node', ['server.js'], {
            cwd: join(__dirname, '..', '..', '..'),
            env: { 
              ...process.env, 
              PORT: this.port.toString(),
              HOST: this.host
            },
            stdio: 'pipe'
          })

          // Wait for server to be ready
          const response = await this.waitForServerReady()
          
          clearTimeout(timeout)
          this.isStarting = false
          this.isReady = true
          console.log(`✅ Server started successfully on ${this.baseUrl}`)
          resolve(this.baseUrl)
        } catch (error) {
          this.isStarting = false
          clearTimeout(timeout)
          reject(error)
        }
      }

      startServerProcess()
    })

    return this.startPromise
  }

  async waitForServerReady() {
    console.log('⏳ Waiting for server to be ready...')
    
    return new Promise((resolve, reject) => {
      const maxAttempts = Math.floor(this.startTimeout / 1000) // Convert timeout to seconds
      let attempts = 0

      const checkServer = async () => {
        attempts++
        console.log(`⏳ Checking server readiness... (attempt ${attempts}/${maxAttempts})`)
        
        try {
          const response = await request(this.baseUrl).get('/api/about')
          if (response.status === 200) {
            console.log('✅ Server is ready!', response.body?.version)
            resolve(response) 
          } else {
            throw new Error(`Server responded with status ${response.status}`)
          }
        } catch (error) {
          if (attempts >= maxAttempts) {
            reject(new Error(`Server failed to become ready after ${maxAttempts} attempts`))
            return
          }
          // Wait 1 second before next attempt
          setTimeout(checkServer, 1000)
        }
      }

      checkServer()
    })
  }

  async stopServer() {
    if (!this.serverProcess) {
      console.log('ℹ️ No server process to stop')
      return
    }

    console.log('🛑 Stopping server via /api/debug/exit...')
    
    try {
      // Use the graceful shutdown endpoint
      const response = await request(this.baseUrl).get('/api/debug/exit')
      console.log('📋 Exit response:', response.body.message)
      
      // The process.exit(0) in the endpoint will terminate immediately
      // Wait a short time for the process to exit, then check if it's still running
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Check if process is still running
      if (this.serverProcess && !this.serverProcess.killed) {
        console.log('⚠️ Process still running, force killing...')
        this.serverProcess.kill('SIGKILL')
      }
      
      console.log('✅ Server stopped successfully')
      this.serverProcess = null
      this.isReady = false
      
    } catch (error) {
      console.log('❌ Error stopping server:', error.message)
      console.log('⚠️ Failed to stop server gracefully, force killing...')
      this.serverProcess.kill('SIGTERM')
      
      return new Promise((resolve) => {
        this.serverProcess.on('close', () => {
          this.serverProcess = null
          this.isReady = false
          console.log('✅ Server stopped successfully')
          resolve()
        })
      })
    }
  }

  getBaseUrl() {
    return this.baseUrl
  }

  getConfig() {
    return this.config
  }

  updateConfig(key, value) {
    updateConfig(key, value)
    this.config = getConfig()
    
    // Update instance properties
    this.baseUrl = this.config.baseUrl
    this.port = this.config.port
    this.host = this.config.host
    this.startTimeout = this.config.startTimeout
    this.debug = this.config.debug
  }

  isServerReady() {
    return this.isReady
  }
}

// Create a singleton instance
const serverManager = new ServerManager()

export default serverManager 