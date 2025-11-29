"use strict";

const { readBugHatchDb } = require("./db-bug-hatch.operations");

/**
 * Get metrics for all projects the user has access to, or a specific project
 * @param {object} currentUser - Authenticated user
 * @param {string|null} projectId - Optional specific project ID to filter by
 * @returns {Promise<object>} Metrics data
 */
async function getMetricsService(currentUser, projectId = null) {
  const db = await readBugHatchDb();
  const projects = db.projects || [];
  const issues = db.issues || [];

  // Get projects user has access to
  // Projects have a members array with user IDs, and also check if user is the creator
  let accessibleProjects = projects.filter((p) => {
    // Demo projects are accessible to all
    if (p.demo) return true;
    // Admins can see all projects
    if (currentUser.role === "admin") return true;
    // User is a member of the project
    if (p.members && p.members.includes(currentUser.id)) return true;
    // User is the creator of the project
    if (p.createdBy === currentUser.id) return true;
    return false;
  });

  // If projectId is provided, filter to just that project
  if (projectId) {
    accessibleProjects = accessibleProjects.filter((p) => p.id === projectId);
  }

  const accessibleProjectIds = new Set(accessibleProjects.map((p) => p.id));
  const accessibleIssues = issues.filter((i) => accessibleProjectIds.has(i.projectId));

  // Calculate global metrics
  const statusCounts = {};
  const priorityCounts = {};
  const typeCounts = {};
  let totalStoryPoints = 0;
  let completedStoryPoints = 0;

  for (const issue of accessibleIssues) {
    // Status counts
    statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1;

    // Priority counts
    priorityCounts[issue.priority] = (priorityCounts[issue.priority] || 0) + 1;

    // Type counts
    if (issue.type) {
      typeCounts[issue.type] = (typeCounts[issue.type] || 0) + 1;
    }

    // Story points
    if (issue.storyPoints) {
      totalStoryPoints += issue.storyPoints;
      if (issue.status === "done" || issue.status === "closed") {
        completedStoryPoints += issue.storyPoints;
      }
    }
  }

  // Calculate per-project metrics
  const projectMetrics = accessibleProjects.map((project) => {
    const projectIssues = accessibleIssues.filter((i) => i.projectId === project.id);
    const projectStatusCounts = {};
    let projectTotalPoints = 0;
    let projectCompletedPoints = 0;

    for (const issue of projectIssues) {
      projectStatusCounts[issue.status] = (projectStatusCounts[issue.status] || 0) + 1;
      if (issue.storyPoints) {
        projectTotalPoints += issue.storyPoints;
        if (issue.status === "done" || issue.status === "closed") {
          projectCompletedPoints += issue.storyPoints;
        }
      }
    }

    return {
      projectId: project.id,
      projectName: project.name,
      issueCount: projectIssues.length,
      statusBreakdown: projectStatusCounts,
      storyPoints: {
        total: projectTotalPoints,
        completed: projectCompletedPoints,
        remaining: projectTotalPoints - projectCompletedPoints,
      },
    };
  });

  return {
    summary: {
      totalProjects: accessibleProjects.length,
      totalIssues: accessibleIssues.length,
      statusBreakdown: statusCounts,
      priorityBreakdown: priorityCounts,
      typeBreakdown: typeCounts,
      storyPoints: {
        total: totalStoryPoints,
        completed: completedStoryPoints,
        remaining: totalStoryPoints - completedStoryPoints,
      },
    },
    projects: projectMetrics,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  getMetricsService,
};
