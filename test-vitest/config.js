import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '.env') })

// Configuration with fallback priority: environment variables > defaults
const config = {
  // Server configuration
  port: process.env.TEST_SERVER_PORT || 3002,
  host: process.env.TEST_SERVER_HOST || 'localhost',
  
  // Base URL configuration
  baseUrl: process.env.TEST_SERVER_BASE_URL || null,
  
  // Timeout configuration
  startTimeout: process.env.TEST_SERVER_START_TIMEOUT || 30000,
  
  // Debug configuration
  debug: process.env.TEST_SERVER_DEBUG === 'true' || false
}

// Generate baseUrl if not provided
if (!config.baseUrl) {
  config.baseUrl = `http://${config.host}:${config.port}`
}

// Helper function to get full configuration
export function getConfig() {
  return { ...config }
}

// Helper function to get specific config value
export function getConfigValue(key) {
  return config[key]
}

// Helper function to update config
export function updateConfig(key, value) {
  config[key] = value
  // Recalculate baseUrl if host or port changed
  if (key === 'host' || key === 'port') {
    config.baseUrl = `http://${config.host}:${config.port}`
  }
}

// Export individual config values for convenience
export const { port, host, baseUrl, startTimeout, debug } = config

export default config 