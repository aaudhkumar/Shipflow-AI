import { router, protectedProcedure } from "../../trpc";
import { z } from "zod";
import { db } from "@shipflow/db";
import { projects } from "@shipflow/db/schema";
import { eq } from "drizzle-orm";

export const projectRouter = router({
  list: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ input }) => {
      return await db.query.projects.findMany({
        where: eq(projects.orgId, input.orgId),
        orderBy: (projects, { desc }) => [desc(projects.createdAt)],
      });
    }),
});
