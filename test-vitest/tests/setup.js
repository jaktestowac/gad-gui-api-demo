import serverManager from './helpers/server-manager.js'
import './cleanup.js' // Import cleanup to register process event handlers

// Global setup function that runs once for the entire test run
export default async function globalSetup() {
  console.log('🔧 Global test setup: Starting server...')
  try {
    await serverManager.startServer(45000) // 45 second timeout for global setup
    console.log('✅ Global test setup: Server is ready for all tests')
  } catch (error) {
    console.error('❌ Global test setup failed:', error.message)
    throw error
  }
}

// Note: This function runs only once before all test files start
// The server will stay running for all test files and be stopped by the cleanup handlers 