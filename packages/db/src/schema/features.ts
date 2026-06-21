import { pgTable, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { workspaces, workspaceMembers } from "./workspaces";
import { projects } from "./projects";
import { featureRequestStatusEnum } from "./enums";

export const featureRequests = pgTable("feature_requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => workspaceMembers.id),
  title: text("title").notNull(),
  rawDescription: text("raw_description").notNull(),
  status: featureRequestStatusEnum("status").default("SUBMITTED").notNull(),
  businessValueScore: integer("business_value_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
