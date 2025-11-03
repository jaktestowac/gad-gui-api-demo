# External Services - Creating New Services

This directory contains external services that can be integrated with the main GAD application. Each service runs independently and can be accessed via the main application's `/api/external/` endpoints.

## Quick Start - Creating a New Service

### 1. Copy the Template

```bash
# Navigate to the external directory
cd external

# Copy the template to create your new service
cp -r _template my-new-service
cd my-new-service
```

### 2. Customize Your Service

Edit `server.js` and update the following:

```javascript
// Service Configuration
const CONFIG = {
  serviceName: "MyNewService", // ← Change this
  version: "1.0.0",
  enableDiagnostics: false,
  customSetting: "my-value", // ← Add your settings here
};

const PORT = process.env.PORT || 3114; // ← Use a unique port
```

### 3. Add Your Custom Endpoints

Replace the example endpoints in the "CUSTOM SERVICE ENDPOINTS" section:

```javascript
/* ===== CUSTOM SERVICE ENDPOINTS ===== */

app.get("/api/my-endpoint", (req, res) => {
  res.json({
    message: "Hello from my new service!",
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/process", (req, res) => {
  const { data } = req.body || {};

  // Your business logic here
  const result = processData(data);

  res.json({
    success: true,
    result,
    processedAt: new Date().toISOString(),
  });
});
```

### 4. Install Dependencies (if needed)

```bash
npm init -y
npm install express  # Usually just express is needed
```

### 5. Test Your Service

```bash
# Start your service
node server.js

# Test the standard endpoints
curl http://localhost:3114/api/ping
curl http://localhost:3114/api/health
curl http://localhost:3114/api/status

# Test your custom endpoints
curl http://localhost:3114/api/my-endpoint
```

### 6. Register with Main Application

Add your service to the main application by updating the environment configuration or by editing `routes/external.route.js`:

**Option A: Environment Variable (Recommended)**

```bash
# Set environment variable
export EXTERNAL_SERVICE_MYNEWSERVICE_URL=http://localhost:3114
```

**Option B: Edit Configuration**

```javascript
// In routes/external.route.js, add to defaultServices:
const defaultServices = {
  // ... existing services
  mynewservice: "http://localhost:3114",
};
```

### 7. Access Your Service

Your service will be available through the main application at:

- `http://localhost:3000/api/external/mynewservice/my-endpoint`
- `http://localhost:3000/api/external/mynewservice/process`

## Template Features

The template provides these standard endpoints out of the box:

| Endpoint            | Method   | Description                         |
| ------------------- | -------- | ----------------------------------- |
| `/api/ping`         | GET      | Simple connectivity test            |
| `/api/health`       | GET      | Health status with uptime           |
| `/api/status`       | GET      | Detailed service metrics            |
| `/api/capabilities` | GET      | Service features and endpoints list |
| `/api/config`       | GET/POST | Configuration management            |
| `/api/openapi`      | GET      | Auto-generated API documentation    |

## Service Structure

```
my-new-service/
├── server.js          # Main service file
└── package.json       # Dependencies (optional)
```

## Best Practices

### 1. Port Management

- Use unique ports for each service (3111-3120 are reserved)
- Check the existing services for port conflicts:
  - Template: 3111
  - Hasher: 3112
  - MiniTemplate: 3113

### 2. Error Handling

The template includes error handling middleware. Always throw meaningful errors:

```javascript
app.post("/api/process", (req, res) => {
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({
      error: "Missing required field: data",
    });
  }

  try {
    const result = processData(data);
    res.json({ result });
  } catch (error) {
    // Will be caught by error middleware
    throw new Error(`Processing failed: ${error.message}`);
  }
});
```

### 3. Configuration Management

Use the built-in config system for runtime configuration:

```javascript
const CONFIG = {
  serviceName: "MyService",
  version: "1.0.0",
  maxItems: 100, // Custom setting
  enableFeatureX: false, // Feature flags
};

// Update via POST /api/config
app.post("/api/config", (req, res) => {
  const updates = req.body || {};
  const allowedKeys = ["maxItems", "enableFeatureX"]; // ← Define allowed keys

  // Update logic is handled by template
});
```

### 4. Service Discovery

The template automatically lists all endpoints in:

- Console output on startup
- `/api/capabilities` endpoint
- `/api/openapi` endpoint

## Example Services

Look at the existing services for inspiration:

### Hasher Service (`hasher/`)

- **Purpose**: Hash generation with queue processing
- **Features**: Job queuing, multiple algorithms, job tracking
- **Key Endpoints**: `/api/jobs`, `/api/jobs/:id`, `/api/history`

### MiniTemplate Service (`miniTemplate/`)

- **Purpose**: Template rendering and processing
- **Features**: Template compilation, job processing, file serving
- **Key Endpoints**: `/api/jobs`, `/api/render`, static file serving

## Troubleshooting

### Service Not Found

```json
{
  "error": "External service 'myservice' not configured"
}
```

**Solution**: Set the environment variable `EXTERNAL_SERVICE_MYSERVICE_URL`

### Connection Refused

```json
{
  "error": "Failed to proxy request to external service"
}
```

**Solution**: Ensure your service is running on the correct port

### Port Already in Use

```
Error: listen EADDRINUSE :::3114
```

**Solution**: Use a different port or stop the conflicting service

## Advanced Configuration

### Custom Headers

Add custom headers to your responses:

```javascript
app.use((req, res, next) => {
  res.setHeader("X-Service-Name", CONFIG.serviceName);
  res.setHeader("X-Service-Version", CONFIG.version);
  next();
});
```

### Authentication

Add authentication middleware:

```javascript
const authenticateRequest = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token || !isValidToken(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

app.use("/api/secure", authenticateRequest);
```

### Database Integration

Add database support:

```javascript
// Example with JSON file storage
const fs = require("fs");
const dataFile = "./data.json";

const loadData = () => {
  try {
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch {
    return [];
  }
};

const saveData = (data) => {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
};
```

## Environment Variables

| Variable                      | Description              | Example                 |
| ----------------------------- | ------------------------ | ----------------------- |
| `PORT`                        | Service port             | `3114`                  |
| `EXTERNAL_SERVICE_{NAME}_URL` | Service URL for main app | `http://localhost:3114` |
| `NODE_ENV`                    | Environment              | `development`           |

## Getting Help

1. Check the existing services (`hasher/`, `miniTemplate/`) for examples
2. Review the template (`_template/server.js`) for all available features
3. Test endpoints using the built-in `/api/status` and `/api/openapi` endpoints
4. Use the main application's `/api/external/list` to see all configured services

Happy coding! 🚀
