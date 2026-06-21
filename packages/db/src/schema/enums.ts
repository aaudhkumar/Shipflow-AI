import { pgEnum } from "drizzle-orm/pg-core";

export const billingPlanEnum = pgEnum("billing_plan", ["FREE", "PRO", "ENTERPRISE"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["ACTIVE", "PAST_DUE", "CANCELED"]);
export const memberRoleEnum = pgEnum("member_role", ["OWNER", "ADMIN", "PM", "ENGINEER", "VIEWER"]);
export const projectStatusEnum = pgEnum("project_status", ["ACTIVE", "ARCHIVED"]);
export const featureRequestStatusEnum = pgEnum("fr_status", [
  "SUBMITTED",
  "CLARIFYING",
  "CLARIFIED",
  "REJECTED",
  "PRD_GENERATED",
  "SHIPPED",
]);
export const taskStatusEnum = pgEnum("task_status", [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
]);
export const taskDependencyTypeEnum = pgEnum("task_dependency_type", ["BLOCKS", "RELATES_TO"]);
export const prStateEnum = pgEnum("pr_state", [
  "OPEN",
  "DRAFT",
  "IN_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "MERGED",
  "CLOSED",
]);
export const reviewStateEnum = pgEnum("review_state", [
  "APPROVED",
  "CHANGES_REQUESTED",
  "COMMENTED",
]);
export const findingTypeEnum = pgEnum("finding_type", [
  "SECURITY",
  "PERFORMANCE",
  "ARCHITECTURE",
  "PRD_DEVIATION",
]);
export const deploymentStatusEnum = pgEnum("deployment_status", ["PENDING", "SUCCESS", "FAILED", "ERROR"]);
