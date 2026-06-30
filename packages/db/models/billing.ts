import { pgTable, text, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { subscriptionStatusEnum } from "./enums";

export const subscriptions = pgTable("subscription", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  razorpaySubscriptionId: text("razorpay_subscription_id").unique(),
  status: subscriptionStatusEnum("status").notNull().default("ACTIVE"),
  planId: text("plan_id").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  usageCount: integer("usage_count").default(0),
  usageLimit: integer("usage_limit").default(10),
  renewalDate: timestamp("renewal_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const invoices = pgTable("invoice", {
  id: text("id").primaryKey(),
  subscriptionId: text("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  razorpayInvoiceId: text("razorpay_invoice_id").unique(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usageRecords = pgTable("usage_record", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  tokenUsage: integer("token_usage").notNull().default(0),
  prAnalyses: integer("pr_analyses").notNull().default(0),
  monthStart: timestamp("month_start").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  unq: unique("workspace_month_unq").on(t.orgId, t.monthStart)
}));
