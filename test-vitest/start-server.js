#!/usr/bin/env node

import serverManager from './tests/helpers/server-manager.js'
import config from './config.js'

console.log('🚀 Test Server Manager CLI')
console.log('📋 Current configuration:')
console.log(`   Host: ${config.host}`)
console.log(`   Port: ${config.port}`)
console.log(`   Base URL: ${config.baseUrl}`)
console.log(`   Start Timeout: ${config.startTimeout}ms`)
console.log(`   Debug Mode: ${config.debug}`)
console.log('')
console.log('💡 To customize settings, create a .env file or set environment variables:')
console.log('   TEST_SERVER_HOST, TEST_SERVER_PORT, TEST_SERVER_DEBUG, etc.')
console.log('')

async function main() {
  try {
    console.log('🔄 Starting server...')
    const baseUrl = await serverManager.startServer()
    console.log(`✅ Server is running at: ${baseUrl}`)
    console.log('')
    console.log('Press Ctrl+C to stop the server')
    
    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping server...')
      await serverManager.stopServer()
      process.exit(0)
    })
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message)
    process.exit(1)
  }
}

main() 