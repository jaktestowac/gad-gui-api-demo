"use strict";

const { readBugHatchDb } = require("./db-operations");

/**
 * Get metrics for all projects the user has access to
 * @param {object} currentUser - Authenticated user
 * @returns {Promise<object>} Metrics data
 */
async function getMetricsService(currentUser) {
  const db = await readBugHatchDb();
  const projects = db.projects || [];
  const issues = db.issues || [];
  const projectMembers = db.projectMembers || [];

  // Get projects user has access to
  const userProjectIds = new Set();
  for (const pm of projectMembers) {
    if (pm.userId === currentUser.id) {
      userProjectIds.add(pm.projectId);
    }
  }
  // Also include projects the user owns
  for (const p of projects) {
    if (p.ownerId === currentUser.id) {
      userProjectIds.add(p.id);
    }
  }

  const accessibleProjects = projects.filter((p) => userProjectIds.has(p.id));
  const accessibleIssues = issues.filter((i) => userProjectIds.has(i.projectId));

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
