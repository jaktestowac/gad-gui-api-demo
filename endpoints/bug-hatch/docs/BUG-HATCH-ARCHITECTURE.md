# BugHatch Module - Architecture Documentation

## Overview

**BugHatch** is a modern, lightweight issue/bug tracker module embedded within the GAD (GUI API Demo) application. It is designed as a **toggleable module** that can be enabled or disabled via a feature flag configuration.

### Key Characteristics

- **Self-contained module** with isolated database, endpoints, and frontend
- **Feature flag controlled** - can be turned on/off without affecting other GAD functionality
- **Layered architecture** - clear separation between HTTP handling, business logic, and data persistence
- **Demo mode support** - read-only exploration without affecting live data

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Browser)                              │
│              public/bug-hatch/ - HTML + TailwindCSS + Vanilla JS         │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │ REST API (/api/bug-hatch/*)
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          BACKEND (Express.js)                            │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ FEATURE FLAG CHECK                                                 │  │
│  │ config/config-features.js → feature_bug_hatch_module: true/false   │  │
│  └─────────────────────────────────┬──────────────────────────────────┘  │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ ROUTING LAYER (routes/validations.route.js)                        │  │
│  │ • URL pattern: /api/bug-hatch/*                                    │  │
│  │ • Feature flag gate: isBugHatchEnabled                             │  │
│  │ • Demo mode detection (?demo=true)                                 │  │
│  └─────────────────────────────────┬──────────────────────────────────┘  │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ ENDPOINT LAYER (endpoints/bug-hatch/*-endpoint.helpers.js)         │  │
│  │ • HTTP request/response handling                                   │  │
│  │ • Status code mapping                                              │  │
│  │ • Cookie management (JWT tokens)                                   │  │
│  └─────────────────────────────────┬──────────────────────────────────┘  │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ SERVICE LAYER (endpoints/bug-hatch/services/*.service.js)          │  │
│  │ • Business logic & validation                                      │  │
│  │ • RBAC (Role-Based Access Control)                                 │  │
│  │ • JWT token generation/verification                                │  │
│  │ • Audit logging orchestration                                      │  │
│  └─────────────────────────────────┬──────────────────────────────────┘  │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ DATABASE OPERATIONS (endpoints/bug-hatch/db-bug-hatch.operations.js)│ │
│  │ • CRUD operations                                                  │  │
│  │ • Atomic writes with mutex locks                                   │  │
│  │ • ID generation                                                    │  │
│  │ • File I/O                                                         │  │
│  └─────────────────────────────────┬──────────────────────────────────┘  │
└────────────────────────────────────┼─────────────────────────────────────┘
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     FILE STORAGE (JSON Files)                            │
│  db/bug-hatch-db-tmp.json       - Main data                              │
│  db/bug-hatch-audit-db-tmp.json - Audit logs                             │
│  db/bug-hatch-demo-db-tmp.json  - Demo data template                     │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Module Enable/Disable Mechanism

BugHatch is controlled via the GAD feature flag system:

### Configuration

```javascript
// config/config-features.js
{
  feature_bug_hatch_module: true,  // Set to false to disable
}

// config/enums.js
FeatureFlagConfigKeys = {
  FEATURE_BUG_HATCH_MODULE: "feature_bug_hatch_module",
}
```

### Routing Gate

```javascript
// routes/validations.route.js
const isBugHatchEnabled = getFeatureFlagConfigValue(FeatureFlagConfigKeys.FEATURE_BUG_HATCH_MODULE);

if (req.url.includes("/api/bug-hatch/") && isBugHatchEnabled === true) {
  // Route to BugHatch handlers
}
```

---

## Frontend Structure

Located in `public/bug-hatch/`:

### Pages (HTML)

| File                   | Purpose                            |
| ---------------------- | ---------------------------------- |
| `index.html`           | Landing page with feature overview |
| `login.html`           | User login form                    |
| `signup.html`          | User registration                  |
| `demo-login.html`      | Demo mode quick access             |
| `dashboard.html`       | User dashboard                     |
| `project.html`         | Single project view                |
| `issues.html`          | Issue listing with filters         |
| `issue.html`           | Single issue detail view           |
| `archived-issues.html` | Archived issues list               |
| `profile.html`         | User profile management            |
| `invitations.html`     | Project invitations                |
| `analytics.html`       | Project metrics/analytics          |

### JavaScript Modules (`js/`)

| File                   | Responsibility                                         |
| ---------------------- | ------------------------------------------------------ |
| `auth.js`              | Authentication (login, logout, signup, token handling) |
| `common.js`            | Shared utilities (confirmation modals, demo banner)    |
| `issues.js`            | Issue listing, filtering, CRUD operations              |
| `issue-detail.js`      | Single issue view logic                                |
| `issue-preview.js`     | Issue preview rendering                                |
| `project-detail.js`    | Project page logic                                     |
| `profile.js`           | User profile management                                |
| `comments-renderer.js` | Comment display/creation                               |
| `activity-renderer.js` | Activity log rendering                                 |
| `archived-issues.js`   | Archived issues handling                               |
| `toast.js`             | Toast notification system                              |
| `demo-propagate.js`    | Demo mode propagation                                  |

### Styling (`css/`)

| File              | Purpose                              |
| ----------------- | ------------------------------------ |
| `tailwind.css`    | TailwindCSS framework styles         |
| `bh-fallback.css` | Fallback styles when CDN unavailable |

---

## Backend Architecture

### Endpoint Handlers (`endpoints/bug-hatch/*-endpoint.helpers.js`)

| Handler                           | Routes Handled                                                          |
| --------------------------------- | ----------------------------------------------------------------------- |
| `auth-endpoint.helpers.js`        | `/api/bug-hatch/auth/*` (signup, login, logout, me, demo)               |
| `admin-endpoint.helpers.js`       | `/api/bug-hatch/admin/*` (init, reset, status)                          |
| `projects-endpoint.helpers.js`    | `/api/bug-hatch/projects/*`                                             |
| `issues-endpoint.helpers.js`      | `/api/bug-hatch/issues/*`, `/api/bug-hatch/projects/:id/issues`         |
| `comments-endpoint.helpers.js`    | `/api/bug-hatch/comments/*`, `/api/bug-hatch/issues/:id/comments`       |
| `attachments-endpoint.helpers.js` | `/api/bug-hatch/attachments/*`, `/api/bug-hatch/issues/:id/attachments` |
| `activity-endpoint.helpers.js`    | `/api/bug-hatch/issues/:id/activity`                                    |
| `users-endpoint.helpers.js`       | `/api/bug-hatch/users/*` (profile, search)                              |
| `invitations-endpoint.helpers.js` | `/api/bug-hatch/invitations/*`                                          |
| `filters-endpoint.helpers.js`     | `/api/bug-hatch/filters/*`                                              |
| `metrics-endpoint.helpers.js`     | `/api/bug-hatch/metrics/*`                                              |

### Service Layer (`endpoints/bug-hatch/services/*.service.js`)

| Service                 | Responsibility                                  |
| ----------------------- | ----------------------------------------------- |
| `auth.service.js`       | User authentication, validation, JWT management |
| `project.service.js`    | Project CRUD, membership, workflow management   |
| `issue.service.js`      | Issue CRUD, status transitions, archiving       |
| `comment.service.js`    | Comment CRUD                                    |
| `attachment.service.js` | File attachment handling                        |
| `activity.service.js`   | Activity log services                           |
| `user.service.js`       | User profile operations                         |
| `invitation.service.js` | Project invitation logic                        |
| `database.service.js`   | DB initialization, demo data management         |

### Database Operations (`db-bug-hatch.operations.js`)

Key functions:

- **CRUD**: `findBugHatchUserByEmail()`, `createBugHatchUser()`, `updateBugHatchProject()`, etc.
- **Locking**: `acquireBugHatchLock()` - in-memory mutex for atomic operations
- **Atomic writes**: temp file + rename pattern for data integrity
- **ID generation**: `generateBugHatchId(prefix)` - generates unique IDs

---

## Data Model

### Main Database (`bug-hatch-db-tmp.json`)

```json
{
  "users": [
    {
      "id": "usr_xxx",
      "email": "user@example.com",
      "name": "User Name",
      "password": "hashed",
      "role": "admin|member|viewer",
      "createdAt": "ISO-8601",
      "lastLogin": "ISO-8601"
    }
  ],
  "projects": [
    {
      "id": "prj_xxx",
      "key": "PROJ",
      "name": "Project Name",
      "createdBy": "usr_xxx",
      "members": ["usr_xxx", "usr_yyy"],
      "workflow": {
        "statuses": ["open", "in-progress", "done"],
        "transitions": {
          "open": ["in-progress"],
          "in-progress": ["done", "open"],
          "done": []
        }
      },
      "demo": false,
      "createdAt": "ISO-8601"
    }
  ],
  "issues": [
    {
      "id": "iss_xxx",
      "projectId": "prj_xxx",
      "key": "PROJ-1",
      "title": "Issue Title",
      "description": "Description",
      "status": "open",
      "type": "bug|task|story",
      "priority": "low|medium|high|critical",
      "assigneeId": "usr_xxx",
      "labels": ["label1", "label2"],
      "archived": false,
      "createdBy": "usr_xxx",
      "createdAt": "ISO-8601"
    }
  ],
  "comments": [],
  "attachments": [],
  "filters": [],
  "invitations": [],
  "outbox": []
}
```

### Audit Database (`bug-hatch-audit-db-tmp.json`)

```json
{
  "auditLogs": [
    {
      "id": "aud_xxx",
      "actorUserId": "usr_xxx",
      "eventType": "user.signup|issue.created|project.updated",
      "payload": {},
      "timestamp": "ISO-8601"
    }
  ]
}
```

---

## API Routes Summary

### Authentication

```
POST   /api/bug-hatch/auth/signup      - Register new user
POST   /api/bug-hatch/auth/login       - User login
POST   /api/bug-hatch/auth/logout      - User logout
POST   /api/bug-hatch/auth/demo        - Demo login (read-only)
GET    /api/bug-hatch/auth/me          - Get current user
```

### Projects

```
GET    /api/bug-hatch/projects         - List projects
POST   /api/bug-hatch/projects         - Create project
GET    /api/bug-hatch/projects/:id     - Get project details
PATCH  /api/bug-hatch/projects/:id     - Update project
DELETE /api/bug-hatch/projects/:id     - Delete project
```

### Issues

```
GET    /api/bug-hatch/issues           - List issues (with filters)
POST   /api/bug-hatch/issues           - Create issue
GET    /api/bug-hatch/issues/:id       - Get issue details
PATCH  /api/bug-hatch/issues/:id       - Update issue
DELETE /api/bug-hatch/issues/:id       - Delete issue
POST   /api/bug-hatch/issues/:id/transition - Transition status
POST   /api/bug-hatch/issues/:id/archive    - Archive issue
```

### Comments & Attachments

```
GET    /api/bug-hatch/issues/:id/comments     - List comments
POST   /api/bug-hatch/issues/:id/comments     - Add comment
GET    /api/bug-hatch/issues/:id/attachments  - List attachments
POST   /api/bug-hatch/issues/:id/attachments  - Upload attachment
```

### Users

```
GET    /api/bug-hatch/users/profile    - Get user profile
PATCH  /api/bug-hatch/users/profile    - Update profile
POST   /api/bug-hatch/users/change-password - Change password
GET    /api/bug-hatch/users            - Search users
```

### Admin

```
POST   /api/bug-hatch/admin/init       - Initialize database
POST   /api/bug-hatch/admin/reset      - Reset database
GET    /api/bug-hatch/admin/status     - Get DB status
```

---

## Key Features

### 1. Role-Based Access Control (RBAC)

| Role     | Permissions                            |
| -------- | -------------------------------------- |
| `admin`  | Full access to all projects and issues |
| `member` | CRUD on projects they're members of    |
| `viewer` | Read-only access to all projects       |
| `demo`   | Read-only access (special demo mode)   |

### 2. Demo Mode

- Special login via `/api/bug-hatch/auth/demo`
- Uses snapshot data from `bug-hatch-demo-db-tmp.json`
- All mutations blocked for demo users
- Can be forced via query param: `?demo=true`

### 3. Workflow System

Projects can define custom workflows:

- Configurable statuses
- Allowed transitions between statuses
- Enforced at service layer

### 4. Audit Logging

All significant actions are logged:

- User signups/logins
- Project/Issue CRUD
- Status transitions
- Stored in separate audit database

### 5. Atomic Database Operations

- In-memory mutex prevents concurrent write conflicts
- Temp file + atomic rename pattern ensures data integrity
- Separate locks for main and audit databases

---

## Request Flow Example: Create Issue

```
1. Client → POST /api/bug-hatch/issues
   Body: { projectId, title, description, type }

2. Router (validations.route.js)
   → Check feature flag (isBugHatchEnabled)
   → Route to handleBugHatchIssues()

3. Endpoint (issues-endpoint.helpers.js)
   → Extract JWT from cookie
   → Verify token, get currentUser
   → Call createIssueService(data, currentUser)

4. Service (issue.service.js)
   → Validate input data
   → RBAC check (user can mutate project?)
   → Generate issue key (PROJ-1, PROJ-2...)
   → Call createBugHatchIssue()
   → Call createBugHatchAuditLog()
   → Return { success: true, issue }

5. Database Ops (db-bug-hatch.operations.js)
   → Acquire lock
   → Read DB file
   → Add issue to issues[]
   → Write to temp file
   → Atomic rename
   → Release lock

6. Endpoint → HTTP 201 Created
   Response: { ok: true, data: { issue } }
```

---

## File Organization Summary

```
gad-gui-api-demo/
├── config/
│   ├── config-features.js        # feature_bug_hatch_module flag
│   └── enums.js                  # FEATURE_BUG_HATCH_MODULE enum
│
├── routes/
│   └── validations.route.js      # BugHatch routing + feature gate
│
├── endpoints/bug-hatch/
│   ├── *-endpoint.helpers.js     # HTTP handlers (10 files)
│   ├── services/
│   │   └── *.service.js          # Business logic (9 files)
│   ├── db-bug-hatch.operations.js # Database operations (1085 lines)
│   ├── bug-hatch-demo-data.js    # Demo data generator
│   ├── bug-hatch-demo.middleware.js # Demo mode middleware
│   ├── bug-hatch-init-data.js    # Initial data setup
│   └── docs/                     # Documentation
│
├── public/bug-hatch/
│   ├── *.html                    # Frontend pages (12 files)
│   ├── js/                       # JavaScript modules (12 files)
│   └── css/                      # Stylesheets (2 files)
│
└── db/
    ├── bug-hatch-db-tmp.json     # Main database
    ├── bug-hatch-audit-db-tmp.json # Audit logs
    └── bug-hatch-demo-db-tmp.json  # Demo data snapshot
```

---

## Integration with GAD

BugHatch is designed as a self-contained module within GAD:

1. **Isolated Database**: Uses separate JSON files (`bug-hatch-*.json`) - no interference with main GAD database (`db.json`)

2. **Separate Authentication**: BugHatch has its own user accounts and JWT tokens (cookie: `bug-hatch-token`)

3. **Independent Frontend**: Located in `/bug-hatch/` path, uses own styling and scripts

4. **Feature Flag Control**: Can be disabled without affecting other GAD modules

5. **Shared Utilities**: Leverages common GAD helpers (`logger-api`, `compare.helpers`, `jwtauth`, etc.)

---

## Technology Stack

| Layer    | Technology                                   |
| -------- | -------------------------------------------- |
| Frontend | HTML5, TailwindCSS (CDN), Vanilla JavaScript |
| Backend  | Node.js, Express.js                          |
| Database | JSON files (file-based storage)              |
| Auth     | JWT tokens (HTTP-only cookies)               |
| Styling  | TailwindCSS with dark theme                  |
