import { z } from "zod";
import { orgMemberProcedure, router } from "../../trpc";
import { auditLogs } from "@shipflow/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { getAuditListOutputSchema } from "@shipflow/services/audit/model";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Audit"];
const getPath = generatePath("/audit");

export const auditRouter = router({
  list: orgMemberProcedure
    .meta({ openapi: { method: "GET", path: getPath("/"), tags: TAGS } })
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      cursor: z.number().default(0), // offset
      action: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .output(getAuditListOutputSchema)
    .query(async ({ ctx, input }) => {
      const conditions = [eq(auditLogs.orgId, ctx.orgId)];
      
      if (input.action) {
        conditions.push(eq(auditLogs.action, input.action));
      }
      if (input.startDate) {
        conditions.push(gte(auditLogs.timestamp, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(auditLogs.timestamp, new Date(input.endDate)));
      }

      const logs = await ctx.db.query.auditLogs.findMany({
        where: and(...conditions),
        orderBy: desc(auditLogs.timestamp),
        limit: input.limit,
        offset: input.cursor,
      });

      return {
        items: logs,
        nextCursor: logs.length === input.limit ? input.cursor + input.limit : undefined,
      };
    }),
});
