import { router, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { z, zodUndefinedModel } from "../../schema";
import { projects } from "@shipflow/db/schema";
import { eq, desc } from "drizzle-orm";
import { projectService } from "@shipflow/services/project";
import { 
  getProjectListOutputSchema,
  createProjectOutputSchema,
  getProjectOutputSchema,
  updateProjectMembersOutputSchema
} from "@shipflow/services/project/model";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Project"];
const getPath = generatePath("/projects");

export const projectRouter = router({
  list: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/"), tags: TAGS } })
    .input(z.object({ orgId: z.string() }))
    .output(getProjectListOutputSchema)
    .query(async ({ input, ctx }) => {
      return projectService.listProjects(input.orgId, ctx.session.user.id);
    }),

  create: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(
      z.object({
        orgId: z.string(),
        name: z.string().min(3).max(100),
        description: z.string().max(500).optional(),
        repositoryIds: z.array(z.string()).optional(),
        memberIds: z.array(z.string()).optional(),
      })
    )
    .output(createProjectOutputSchema)
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
    .meta({ openapi: { method: "GET", path: getPath("/{projectId}"), tags: TAGS } })
    .input(z.object({ orgId: z.string(), projectId: z.string() }))
    .output(getProjectOutputSchema)
    .query(async ({ input, ctx }) => {
      return projectService.getProjectWithDetails(input.projectId, input.orgId, ctx.session.user.id);
    }),

  delete: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/{projectId}"), tags: TAGS } })
    .input(z.object({ orgId: z.string(), projectId: z.string() }))
    .output(z.any())
    .mutation(async ({ input, ctx }) => {
      return projectService.deleteProject(input.projectId, input.orgId, ctx.session.user.id);
    }),


  updateMembers: protectedProcedure
    .meta({ openapi: { method: "PUT", path: getPath("/{projectId}/members"), tags: TAGS } })
    .input(
      z.object({
        orgId: z.string(),
        projectId: z.string(),
        memberIds: z.array(z.string()),
      })
    )
    .output(updateProjectMembersOutputSchema)
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
    
  regenerateContext: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{projectId}/regenerate-context"), tags: TAGS } })
    .input(z.object({ orgId: z.string(), projectId: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await projectService.regenerateContext(input.projectId, input.orgId, ctx.session.user.id);
      } catch (err: any) {
        if (err.message.startsWith("UNAUTHORIZED")) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: err.message });
        }
        throw err;
      }
    }),
});
