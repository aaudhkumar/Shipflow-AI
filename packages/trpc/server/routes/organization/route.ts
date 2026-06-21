import { router, protectedProcedure } from "../../trpc";
import { z } from "zod";
import { organizationService } from "@shipflow/services/src/organization/organization.service";

export const organizationRouter = router({
  create: protectedProcedure
    .input(z.object({ name: z.string(), slug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await organizationService.createOrganization(input.name, input.slug, ctx.session.user.id);
    }),
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return await organizationService.getUserOrganizations(ctx.session.user.id);
    })
});
