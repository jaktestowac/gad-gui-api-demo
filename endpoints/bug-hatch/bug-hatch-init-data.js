// Base (non-demo) initial seed data for BugHatch.
// This dataset is used ONCE on first run if the main BugHatch DB file does not yet exist.
// It is intentionally smaller / simpler than the richer demo dataset.
// You can safely modify or extend this file; a restart with an existing DB will NOT overwrite data.

const now = new Date().toISOString();

module.exports = {
  users: [
    {
      id: "seed-user-001",
      email: "founder@example.gad",
      name: "Founder",
      password: "changeme", // plain stored per current simple auth approach
      role: "admin",
      createdAt: now,
      lastLoginAt: null,
    },
    {
      id: "seed-user-002",
      email: "dev@example.gad",
      name: "Developer",
      password: "changeme",
      role: "member",
      createdAt: now,
      lastLoginAt: null,
    },
    {
      id: "seed-user-003",
      email: "viewer@example.gad",
      name: "Viewer",
      password: "changeme",
      role: "viewer",
      createdAt: now,
      lastLoginAt: null,
    },
  ],
  projects: [
    {
      id: "seed-proj-app",
      key: "APP",
      name: "App Platform",
      members: ["seed-user-001", "seed-user-002"],
      archived: false,
      workflow: {
        statuses: ["Backlog", "In Progress", "Review", "Done"],
        transitions: {
          Backlog: ["In Progress"],
          "In Progress": ["Review", "Backlog"],
          Review: ["Done", "In Progress"],
          Done: [],
        },
      },
      createdAt: now,
    },
  ],
  issues: [
    {
      id: "seed-issue-001",
      key: "APP-1",
      projectId: "seed-proj-app",
      type: "task",
      title: "Initial project scaffolding",
      description: "Set up baseline structure and configuration files.",
      status: "Backlog",
      priority: "medium",
      assigneeId: "seed-user-002",
      labels: ["setup"],
      storyPoints: 3,
      attachments: [],
      createdBy: "seed-user-001",
      createdAt: now,
      updatedAt: now,
      archived: false,
    },
    {
      id: "seed-issue-002",
      key: "APP-2",
      projectId: "seed-proj-app",
      type: "bug",
      title: "Fix authentication redirect",
      description: "Ensure login redirects to dashboard after successful auth.",
      status: "Backlog",
      priority: "high",
      assigneeId: null,
      labels: ["auth"],
      storyPoints: 5,
      attachments: [],
      createdBy: "seed-user-001",
      createdAt: now,
      updatedAt: now,
      archived: false,
    },
  ],
  comments: [],
  attachments: [],
  filters: [],
  outbox: [],
};
