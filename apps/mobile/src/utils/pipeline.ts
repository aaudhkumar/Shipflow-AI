/**
 * Maps the real `fr_status` enum (packages/db/models/enums.ts) onto the
 * nine-stage pipeline used across the product:
 * Request → Product Thinking → PRD → Tasks → Implementation → Review →
 * Fixes → Approval → Release.
 */

export type FeatureRequestStatus =
  | "SUBMITTED"
  | "CLARIFYING"
  | "CLARIFIED"
  | "PRD_GENERATED"
  | "TASKS_GENERATED"
  | "PLAN_APPROVED"
  | "IN_DEVELOPMENT"
  | "IN_REVIEW"
  | "FIX_NEEDED"
  | "AWAITING_HUMAN_APPROVAL"
  | "SHIPPED"
  | "REJECTED";

export type StageKey =
  | "request"
  | "thinking"
  | "prd"
  | "tasks"
  | "implementation"
  | "review"
  | "fixes"
  | "approval"
  | "release";

export type Tone = "neutral" | "red" | "green";

export const STAGE_ORDER: { key: StageKey; label: string; tone: Tone }[] = [
  { key: "request", label: "Request", tone: "neutral" },
  { key: "thinking", label: "Thinking", tone: "neutral" },
  { key: "prd", label: "PRD", tone: "neutral" },
  { key: "tasks", label: "Tasks", tone: "neutral" },
  { key: "implementation", label: "Build", tone: "neutral" },
  { key: "review", label: "Review", tone: "neutral" },
  { key: "fixes", label: "Fixes", tone: "red" },
  { key: "approval", label: "Approval", tone: "green" },
  { key: "release", label: "Release", tone: "neutral" },
];

const STATUS_TO_STAGE: Record<FeatureRequestStatus, StageKey> = {
  SUBMITTED: "request",
  CLARIFYING: "thinking",
  CLARIFIED: "thinking",
  PRD_GENERATED: "prd",
  TASKS_GENERATED: "tasks",
  PLAN_APPROVED: "tasks",
  IN_DEVELOPMENT: "implementation",
  IN_REVIEW: "review",
  FIX_NEEDED: "fixes",
  AWAITING_HUMAN_APPROVAL: "approval",
  SHIPPED: "release",
  REJECTED: "fixes", // terminal, red — rendered with its own label below
};

const STATUS_LABEL: Record<FeatureRequestStatus, string> = {
  SUBMITTED: "Request submitted",
  CLARIFYING: "Clarifying scope",
  CLARIFIED: "Scope clarified",
  PRD_GENERATED: "PRD generated",
  TASKS_GENERATED: "Broken into tasks",
  PLAN_APPROVED: "Plan approved",
  IN_DEVELOPMENT: "In development",
  IN_REVIEW: "In review",
  FIX_NEEDED: "Changes requested",
  AWAITING_HUMAN_APPROVAL: "Awaiting approval",
  SHIPPED: "Shipped",
  REJECTED: "Rejected",
};

export function stageIndexFor(status: FeatureRequestStatus): number {
  const key = STATUS_TO_STAGE[status];
  return STAGE_ORDER.findIndex((s) => s.key === key);
}

export function toneFor(status: FeatureRequestStatus): Tone {
  if (status === "REJECTED") return "red";
  if (status === "FIX_NEEDED") return "red";
  if (status === "AWAITING_HUMAN_APPROVAL" || status === "SHIPPED") return "green";
  return "neutral";
}

export function labelFor(status: FeatureRequestStatus): string {
  return STATUS_LABEL[status];
}
