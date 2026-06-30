import { pgTable, text, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { organizations, members } from "./organizations";
import { projects } from "./projects";
import { featureRequestStatusEnum } from "./enums";

export const featureRequests = pgTable("feature_requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => members.id),
  title: text("title").notNull(),
  rawDescription: text("raw_description").notNull(),
  status: featureRequestStatusEnum("status").default("SUBMITTED").notNull(),
  sourceChannel: text("source_channel", { 
    enum: ["IN_APP", "EMAIL", "TICKET", "CALL"] 
  }).notNull().default("IN_APP"),
  businessValueScore: integer("business_value_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIdx: index("feature_requests_org_idx").on(table.orgId)
}));

export const clarificationThreads = pgTable("clarification_threads", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  featureRequestId: text("feature_request_id")
    .notNull()
    .references(() => featureRequests.id, { onDelete: "cascade" }),
  isResolved: boolean("is_resolved").default(false).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clarificationMessages = pgTable("clarification_messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  threadId: text("thread_id")
    .notNull()
    .references(() => clarificationThreads.id, { onDelete: "cascade" }),
  sender: text("sender").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const releaseReadiness = pgTable("release_readiness", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  featureRequestId: text("feature_request_id")
    .notNull()
    .references(() => featureRequests.id, { onDelete: "cascade" }),
  isReady: boolean("is_ready").notNull(),
  overallScore: integer("overall_score").notNull(),
  blockers: jsonb("blockers").$type<string[]>(),
  warnings: jsonb("warnings").$type<string[]>(),
  recommendation: text("recommendation"),
  releaseNotes: text("release_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
