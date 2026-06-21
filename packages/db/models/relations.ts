import { relations } from "drizzle-orm";
import { organizations, members } from "./organizations";
import { projects, repositories } from "./projects";
import { featureRequests } from "./features";
import { auditLogs } from "./operations";
import { tasks, epics, subtasks, taskDependencies } from "./tasks";
import { pullRequests, pullRequestReviews, reviewFindings } from "./github";
import { subscriptions, invoices, usageRecords } from "./billing";
import { deployments } from "./deployments";

export const organizationRelations = relations(organizations, ({ many, one }) => ({
  members: many(members),
  projects: many(projects),
  featureRequests: many(featureRequests),
  auditLogs: many(auditLogs),
  subscription: one(subscriptions, { fields: [organizations.id], references: [subscriptions.orgId] }),
  usageRecords: many(usageRecords),
}));

export const featureRequestRelations = relations(featureRequests, ({ many }) => ({
  pullRequests: many(pullRequests),
}));

export const taskRelations = relations(tasks, ({ one, many }) => ({
  epic: one(epics, { fields: [tasks.epicId], references: [epics.id] }),
  assignee: one(members, {
    fields: [tasks.assigneeId],
    references: [members.id],
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
  featureRequest: one(featureRequests, { fields: [pullRequests.featureRequestId], references: [featureRequests.id] }),
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

export const subscriptionRelations = relations(subscriptions, ({ one, many }) => ({
  workspace: one(organizations, { fields: [subscriptions.orgId], references: [organizations.id] }),
  invoices: many(invoices),
}));

export const invoiceRelations = relations(invoices, ({ one }) => ({
  subscription: one(subscriptions, { fields: [invoices.subscriptionId], references: [subscriptions.id] }),
}));

export const usageRecordRelations = relations(usageRecords, ({ one }) => ({
  workspace: one(organizations, { fields: [usageRecords.orgId], references: [organizations.id] }),
}));

export const repositoryRelations = relations(repositories, ({ many }) => ({
  deployments: many(deployments),
}));

export const deploymentRelations = relations(deployments, ({ one }) => ({
  repository: one(repositories, { fields: [deployments.repositoryId], references: [repositories.id] }),
}));
