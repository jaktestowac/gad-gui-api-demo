import serverManager from './helpers/server-manager.js'

// Handle graceful shutdown when the process exits
process.on('exit', async () => {
  console.log('🧹 Process exit: Stopping server...')
  try {
    await serverManager.stopServer()
    console.log('✅ Process exit: Server stopped')
  } catch (error) {
    console.error('❌ Process exit: Failed to stop server:', error.message)
  }
})

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  console.log('🧹 SIGINT received: Stopping server...')
  try {
    await serverManager.stopServer()
    console.log('✅ SIGINT: Server stopped')
    process.exit(0)
  } catch (error) {
    console.error('❌ SIGINT: Failed to stop server:', error.message)
    process.exit(1)
  }
})

// Handle SIGTERM
process.on('SIGTERM', async () => {
  console.log('🧹 SIGTERM received: Stopping server...')
  try {
    await serverManager.stopServer()
    console.log('✅ SIGTERM: Server stopped')
    process.exit(0)
  } catch (error) {
    console.error('❌ SIGTERM: Failed to stop server:', error.message)
    process.exit(1)
  }
})

export default serverManager 