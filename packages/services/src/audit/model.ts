import { z } from "zod";
import type { auditLogs } from "@shipflow/db/schema";
import type { InferSelectModel } from "drizzle-orm";

type AuditLog = InferSelectModel<typeof auditLogs>;

export const getAuditListOutputSchema = z.any() as z.ZodType<{
  items: AuditLog[];
  nextCursor?: number;
}>;
