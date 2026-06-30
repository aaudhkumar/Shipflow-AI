import { router, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { projects } from "@shipflow/db/schema";
import { eq, desc } from "drizzle-orm";
import { projectService } from "@shipflow/services/project";

export const projectRouter = router({
  list: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ input }) => {
      return projectService.listProjects(input.orgId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        name: z.string().min(3),
        description: z.string().max(500).optional(),
        repositoryIds: z.array(z.string()).optional(),
        memberIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await projectService.createProject({
          ...input,
          userId: ctx.session.user.id,
        });
      } catch (err: any) {
        if (err.message.startsWith("UNAUTHORIZED")) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: err.message });
        }
        if (err.message.startsWith("FORBIDDEN")) {
          throw new TRPCError({ code: "FORBIDDEN", message: err.message });
        }
        throw err;
      }
    }),

  getById: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      return projectService.getProjectWithDetails(input.projectId);
    }),

  updateMembers: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        projectId: z.string(),
        memberIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await projectService.updateMembers({
          ...input,
          userId: ctx.session.user.id,
        });
      } catch (err: any) {
        if (err.message.startsWith("UNAUTHORIZED")) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: err.message });
        }
        if (err.message.startsWith("FORBIDDEN")) {
          throw new TRPCError({ code: "FORBIDDEN", message: err.message });
        }
        if (err.message.startsWith("NOT_FOUND")) {
          throw new TRPCError({ code: "NOT_FOUND", message: err.message });
        }
        throw err;
      }
    }),
});
