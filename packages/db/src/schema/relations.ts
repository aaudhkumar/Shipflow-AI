import { relations } from "drizzle-orm";
import { workspaces, workspaceMembers } from "./workspaces";
import { projects, repositories } from "./projects";
import { featureRequests } from "./features";
import { auditLogs } from "./operations";
import { tasks, epics, subtasks, taskDependencies } from "./tasks";
import { pullRequests, pullRequestReviews, reviewFindings } from "./github";

export const workspaceRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  projects: many(projects),
  featureRequests: many(featureRequests),
  auditLogs: many(auditLogs),
}));

export const taskRelations = relations(tasks, ({ one, many }) => ({
  epic: one(epics, { fields: [tasks.epicId], references: [epics.id] }),
  assignee: one(workspaceMembers, {
    fields: [tasks.assigneeId],
    references: [workspaceMembers.id],
  }),
  subtasks: many(subtasks),
  pullRequests: many(pullRequests),
  dependencies: many(taskDependencies, { relationName: "dependent_tasks" }),
}));

export const taskDependenciesRelations = relations(taskDependencies, ({ one }) => ({
  dependentTask: one(tasks, {
    fields: [taskDependencies.dependentTaskId],
    references: [tasks.id],
    relationName: "dependent_tasks"
  }),
  dependsOnTask: one(tasks, {
    fields: [taskDependencies.dependsOnTaskId],
    references: [tasks.id],
    relationName: "depends_on_tasks"
  })
}));

export const pullRequestRelations = relations(pullRequests, ({ one, many }) => ({
  task: one(tasks, { fields: [pullRequests.taskId], references: [tasks.id] }),
  repository: one(repositories, {
    fields: [pullRequests.repositoryId],
    references: [repositories.id],
  }),
  reviews: many(pullRequestReviews),
}));

export const reviewRelations = relations(pullRequestReviews, ({ one, many }) => ({
  pullRequest: one(pullRequests, {
    fields: [pullRequestReviews.pullRequestId],
    references: [pullRequests.id],
  }),
  findings: many(reviewFindings),
}));
