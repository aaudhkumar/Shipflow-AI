import { relations } from "drizzle-orm";
import { users } from "./users";
import { organizations, members } from "./organizations";
import { projects, repositories, projectMembers } from "./projects";
import { featureRequests, clarificationThreads, clarificationMessages } from "./features";
import { auditLogs } from "./operations";
import { tasks, epics, subtasks, taskDependencies } from "./tasks";
import { pullRequests, pullRequestReviews, reviewFindings } from "./github";
import { subscriptions, invoices, usageRecords } from "./billing";
import { deployments } from "./deployments";
import { orgInvitations } from "./invitations";

export const organizationRelations = relations(organizations, ({ many, one }) => ({
  members: many(members),
  projects: many(projects),
  featureRequests: many(featureRequests),
  auditLogs: many(auditLogs),
  subscription: one(subscriptions, { fields: [organizations.id], references: [subscriptions.orgId] }),
  usageRecords: many(usageRecords),
  invitations: many(orgInvitations),
}));

export const projectRelations = relations(projects, ({ many }) => ({
  members: many(projectMembers),
}));

export const memberRelations = relations(members, ({ one, many }) => ({
  projects: many(projectMembers),
  user: one(users, { fields: [members.userId], references: [users.id] }),
}));

export const projectMemberRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, { fields: [projectMembers.projectId], references: [projects.id] }),
  member: one(members, { fields: [projectMembers.memberId], references: [members.id] }),
}));

import { prds, prdVersions } from "./prds";

export const prdRelations = relations(prds, ({ one, many }) => ({
  currentVersion: one(prdVersions, {
    fields: [prds.currentVersionId],
    references: [prdVersions.id]
  }),
  versions: many(prdVersions),
  featureRequest: one(featureRequests, {
    fields: [prds.featureRequestId],
    references: [featureRequests.id]
  }),
}));

export const prdVersionsRelations = relations(prdVersions, ({ one }) => ({
  prd: one(prds, {
    fields: [prdVersions.prdId],
    references: [prds.id]
  })
}));

export const featureRequestRelations = relations(featureRequests, ({ many }) => ({
  pullRequests: many(pullRequests),
  prds: many(prds),
  clarificationThreads: many(clarificationThreads),
}));

export const clarificationThreadRelations = relations(clarificationThreads, ({ one, many }) => ({
  featureRequest: one(featureRequests, {
    fields: [clarificationThreads.featureRequestId],
    references: [featureRequests.id]
  }),
  messages: many(clarificationMessages),
}));

export const clarificationMessageRelations = relations(clarificationMessages, ({ one }) => ({
  thread: one(clarificationThreads, {
    fields: [clarificationMessages.threadId],
    references: [clarificationThreads.id]
  })
}));

export const epicRelations = relations(epics, ({ one, many }) => ({
  project: one(projects, { fields: [epics.projectId], references: [projects.id] }),
  prd: one(prds, { fields: [epics.prdId], references: [prds.id] }),
  tasks: many(tasks),
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

export const reviewFindingRelations = relations(reviewFindings, ({ one }) => ({
  review: one(pullRequestReviews, {
    fields: [reviewFindings.reviewId],
    references: [pullRequestReviews.id],
  }),
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

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  task: one(tasks, {
    fields: [subtasks.taskId],
    references: [tasks.id],
  }),
}));
