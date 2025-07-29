# Test Server Configuration

This directory contains the test setup for the API server with configurable settings.

## Configuration Options

The test server can be configured through multiple methods with the following priority order:

1. **Environment Variables** (from .env file or system)
2. **Default Values** (lowest priority)

### Available Configuration Options

| Option | Environment Variable | Default | Description |
|--------|---------------------|---------|-------------|
| Host | `TEST_SERVER_HOST` | `localhost` | Server host address |
| Port | `TEST_SERVER_PORT` | `3002` | Server port number |
| Base URL | `TEST_SERVER_BASE_URL` | Auto-generated | Full server URL |
| Start Timeout | `TEST_SERVER_START_TIMEOUT` | `30000` | Server start timeout (ms) |
| Debug Mode | `TEST_SERVER_DEBUG` | `false` | Enable debug logging |

## Usage Examples

### 1. Using Environment Variables

Create a `.env` file in the `test-vitest` directory:

```bash
# Copy the example file
cp env.example .env

# Edit the .env file with your settings
TEST_SERVER_HOST=127.0.0.1
TEST_SERVER_PORT=3003
TEST_SERVER_DEBUG=true
```

### 2. Using System Environment Variables

```bash
# Set environment variables before running tests
export TEST_SERVER_PORT=3003
export TEST_SERVER_DEBUG=true
npm test

# Or set them inline
TEST_SERVER_PORT=3003 TEST_SERVER_DEBUG=true npm test
```

### 3. Using Predefined Scripts

```bash
# Start server with default settings
npm run start-server

# Run tests with current configuration
npm test

# Run tests with custom port
npm run test:port-3003
npm run test:port-3004

# Run tests with debug mode
npm run test:debug

# Run tests with custom host and port
npm run test:custom-host

# Start server with debug mode
npm run start-server:debug

# Start server with custom port
npm run start-server:port-3003
```

### 4. Programmatic Usage

```javascript
import serverManager from './tests/helpers/server-manager.js'
import { updateConfig } from './config.js'

// Update configuration programmatically
updateConfig('port', 3003)
updateConfig('host', '127.0.0.1')
updateConfig('debug', true)

// Start server with updated config
const baseUrl = await serverManager.startServer()
console.log('Server running at:', baseUrl)
```

## Available NPM Scripts

| Script | Description | Environment Variables Set |
|--------|-------------|--------------------------|
| `npm test` | Run tests with default settings | None (uses defaults) |
| `npm run test:port-3003` | Run tests on port 3003 | `TEST_SERVER_PORT=3003` |
| `npm run test:port-3004` | Run tests on port 3004 | `TEST_SERVER_PORT=3004` |
| `npm run test:debug` | Run tests with debug mode | `TEST_SERVER_DEBUG=true` |
| `npm run test:custom-host` | Run tests with custom host | `TEST_SERVER_HOST=127.0.0.1 TEST_SERVER_PORT=3003` |
| `npm run start-server` | Start server with default settings | None (uses defaults) |
| `npm run start-server:debug` | Start server with debug mode | `TEST_SERVER_DEBUG=true` |
| `npm run start-server:port-3003` | Start server on port 3003 | `TEST_SERVER_PORT=3003` |

## Configuration Priority

The configuration system follows this priority order:

1. **Environment variables** (e.g., `TEST_SERVER_PORT=3003`)
2. **Default values** (hardcoded in config.js)

## Environment File Setup

1. Copy the example file: `cp env.example .env`
2. Edit `.env` with your preferred settings
3. The `.env` file will be automatically loaded by the configuration system

## Debug Mode

When debug mode is enabled (`TEST_SERVER_DEBUG=true`), the system will:

- Log detailed configuration information
- Show server startup progress
- Display additional diagnostic information

## Examples

### Basic Usage
```bash
# Default settings (localhost:3002)
npm test

# With custom port via environment variable
TEST_SERVER_PORT=3003 npm test

# With custom host and port
TEST_SERVER_HOST=127.0.0.1 TEST_SERVER_PORT=3003 npm test

# With debug mode
TEST_SERVER_DEBUG=true npm test
```

### Using Predefined Scripts
```bash
# Quick port changes
npm run test:port-3003
npm run test:port-3004

# Debug mode
npm run test:debug

# Custom host
npm run test:custom-host

# Server with debug
npm run start-server:debug
```

### Advanced Usage
```bash
# Custom base URL
TEST_SERVER_BASE_URL=http://localhost:3003 npm test

# Custom timeout
TEST_SERVER_START_TIMEOUT=60000 npm test

# Multiple options
TEST_SERVER_HOST=127.0.0.1 TEST_SERVER_PORT=3003 TEST_SERVER_DEBUG=true npm test
```

## Troubleshooting

### Server Won't Start
- Check if the port is already in use
- Verify the host is accessible
- Increase the start timeout if needed

### Configuration Not Applied
- Check that environment variables are properly set
- Verify the `.env` file is in the correct location
- Ensure environment variables are set before running commands

### Debug Information
- Enable debug mode to see detailed configuration
- Check console output for configuration values
- Verify environment variable loading 