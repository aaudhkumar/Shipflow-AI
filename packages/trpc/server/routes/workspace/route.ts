import { router, protectedProcedure } from "../../trpc";
import { z } from "zod";
import { workspaceService } from "@shipflow/services/src/workspace/workspace.service";

export const workspaceRouter = router({
  create: protectedProcedure
    .input(z.object({ name: z.string(), slug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await workspaceService.createWorkspace(input.name, input.slug, ctx.session.user.id);
    }),
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return await workspaceService.getUserWorkspaces(ctx.session.user.id);
    })
});
