import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { billingPlanEnum, memberRoleEnum } from "./enums";

export const workspaces = pgTable("workspace", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  billingPlan: billingPlanEnum("billing_plan").default("FREE").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const workspaceMembers = pgTable("workspace_member", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: memberRoleEnum("role").default("VIEWER").notNull(),
  status: text("status").default("ACTIVE").notNull(),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});
