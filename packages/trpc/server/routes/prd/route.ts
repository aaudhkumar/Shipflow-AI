import { router, orgMemberProcedure } from "../../trpc";
import { z } from "zod";
import { db } from "@shipflow/db";
import { prds, prdVersions } from "@shipflow/db/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const prdRouter = router({
  getByFeature: orgMemberProcedure
    .input(z.object({ featureId: z.string() }))
    .query(async ({ input }) => {
      const prd = await db.query.prds.findFirst({
        where: eq(prds.featureRequestId, input.featureId),
        with: {
          currentVersion: true,
          versions: {
            orderBy: desc(prdVersions.versionNumber)
          }
        }
      });
      if (!prd) throw new TRPCError({ code: "NOT_FOUND", message: "PRD not found for this feature" });
      return prd;
    })
});
