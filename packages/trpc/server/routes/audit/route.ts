import { z } from "zod";
import { orgMemberProcedure, router } from "../../trpc";
import { auditLogs } from "@shipflow/db/schema";
import { eq, desc } from "drizzle-orm";

export const auditRouter = router({
  list: orgMemberProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      cursor: z.number().default(0), // offset
    }))
    .query(async ({ ctx, input }) => {
      const logs = await ctx.db.query.auditLogs.findMany({
        where: eq(auditLogs.orgId, ctx.orgId),
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
