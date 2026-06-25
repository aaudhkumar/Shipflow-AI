import { router, orgMemberProcedure } from "../../trpc";
import { z } from "zod";
import { db } from "@shipflow/db";
import { members, users } from "@shipflow/db/schema";
import { eq } from "drizzle-orm";

export const memberRouter = router({
  list: orgMemberProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ input }) => {
      const results = await db
        .select({
          id: members.id,
          role: members.role,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
            image: users.image,
          }
        })
        .from(members)
        .innerJoin(users, eq(members.userId, users.id))
        .where(eq(members.orgId, input.orgId));
      return results;
    }),
  invite: orgMemberProcedure
    .input(z.object({ orgId: z.string(), email: z.string().email(), role: z.enum(["OWNER", "ADMIN", "PM", "DEVELOPER", "REVIEWER"]) }))
    .mutation(async ({ input }) => {
      // Placeholder for email invitation logic
      console.log(`Sending invite to ${input.email} for org ${input.orgId} with role ${input.role}`);
      return { status: "SENT" };
    })
});
