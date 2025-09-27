# UUID Generator Service

This service provides UUID and unique identifier generation with multiple formats and validation capabilities.

## Features

- **Multiple UUID Versions**: v1 (timestamp + MAC), v4 (random), v7 (Unix timestamp + random)
- **Custom Formats**: Alphanumeric, Hexadecimal, Base32, Numeric
- **Batch Generation**: Generate up to 1000 UUIDs at once
- **UUID Validation**: Validate UUID format and extract version/variant information
- **Format Information**: Get details about supported formats
- **Configuration Management**: Runtime configuration updates
- **Web Interface**: HTML interface for testing and monitoring

## Installation

```bash
cd external/uuid-generator
npm install express  # Only express is needed
```

## Usage

### Start the Service

```bash
node server.js
```

The service will start on port 3114 (configurable via PORT environment variable).

### Access Points

- **Web Interface**: http://localhost:3114/
- **API Documentation**: http://localhost:3114/api/openapi
- **Health Check**: http://localhost:3114/api/health
- **Service Status**: http://localhost:3114/api/status

## API Endpoints

### Generate Single UUID

```bash
# Generate UUID v4 (default)
curl -X POST http://localhost:3114/api/generate \
  -H "Content-Type: application/json" \
  -d '{"version": "v4", "format": "uuid"}'

# Generate custom alphanumeric ID
curl -X POST http://localhost:3114/api/generate \
  -H "Content-Type: application/json" \
  -d '{"format": "alphanumeric", "length": 20}'
```

### Batch Generation

```bash
# Generate 10 UUID v4s
curl -X POST http://localhost:3114/api/batch \
  -H "Content-Type: application/json" \
  -d '{"count": 10, "version": "v4", "format": "uuid"}'

# Generate 5 custom hex IDs
curl -X POST http://localhost:3114/api/batch \
  -H "Content-Type: application/json" \
  -d '{"count": 5, "format": "hex", "length": 16}'
```

### Validate UUID

```bash
curl -X POST http://localhost:3114/api/validate \
  -H "Content-Type: application/json" \
  -d '{"id": "550e8400-e29b-41d4-a716-446655440000"}'
```

### Get Format Information

```bash
curl http://localhost:3114/api/formats
```

## Configuration

The service can be configured via the `/api/config` endpoint:

```bash
# Update configuration
curl -X POST http://localhost:3114/api/config \
  -H "Content-Type: application/json" \
  -d '{"maxBatchSize": 500}'

# Get current configuration
curl http://localhost:3114/api/config
```

## Supported Formats

### UUID Formats

- **v1**: Timestamp + MAC address simulation
- **v4**: Random (cryptographically secure)
- **v7**: Unix timestamp + random

### Custom Formats

- **alphanumeric**: A-Z, a-z, 0-9 (62 characters)
- **hex**: 0-9, A-F (16 characters)
- **base32**: A-Z, 2-7 (32 characters)
- **numeric**: 0-9 (10 characters)

## Integration with Main GAD Application

To integrate with the main GAD application, set the environment variable:

```bash
export EXTERNAL_SERVICE_UUIDGENERATOR_URL=http://localhost:3114
```

Or add to the default services in `routes/external.route.js`:

```javascript
const defaultServices = {
  // ... existing services
  uuidgenerator: "http://localhost:3114",
};
```

## Web Interface Features

The HTML interface provides:

- Single UUID generation with format selection
- Batch generation with customizable count
- UUID validation with detailed information
- Format information display
- Service status monitoring
- Configuration management
- Copy-to-clipboard functionality

## Examples

### Generate Different UUID Versions

```javascript
// UUID v4 (Random)
{
  "version": "v4",
  "format": "uuid"
}
// Result: "f47ac10b-58cc-4372-a567-0e02b2c3d479"

// UUID v1 (Timestamp + MAC)
{
  "version": "v1",
  "format": "uuid"
}
// Result: "6ba7b810-9dad-11d1-80b4-00c04fd430c8"

// UUID v7 (Unix Timestamp + Random)
{
  "version": "v7",
  "format": "uuid"
}
// Result: "017f22e2-79b0-7cc3-98c4-dc0c0c07398f"
```

### Generate Custom Formats

```javascript
// Alphanumeric ID (16 characters)
{
  "format": "alphanumeric",
  "length": 16
}
// Result: "Kf2jL9mN8pQ3rT5v"

// Hexadecimal ID (32 characters)
{
  "format": "hex",
  "length": 32
}
// Result: "A1B2C3D4E5F67890ABCDEF1234567890"

// Base32 ID (default 26 characters)
{
  "format": "base32"
}
// Result: "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
```

## Validation Results

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "isValid": true,
  "version": 4,
  "variant": "RFC 4122",
  "format": "UUID",
  "timestamp": "2025-09-27T10:30:00.000Z"
}
```

## Service Statistics

The service tracks:

- Total requests processed
- Total UUIDs generated
- Format usage statistics
- Error rates and last errors
- Service uptime

Access via `/api/status` endpoint or the web interface.
