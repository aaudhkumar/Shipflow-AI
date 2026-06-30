import { router, orgMemberProcedure } from "../../trpc";
import { z } from "zod";
import { db } from "@shipflow/db";
import { prds, epics, tasks, projects, featureRequests } from "@shipflow/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const taskRouter = router({
  getKanban: orgMemberProcedure
    .input(z.object({ featureId: z.string() }))
    .query(async ({ input }) => {
      const prd = await db.query.prds.findFirst({
        where: eq(prds.featureRequestId, input.featureId)
      });
      if (!prd) return { TODO: [], IN_PROGRESS: [], DONE: [] };

      const featureEpics = await db.query.epics.findMany({
        where: eq(epics.prdId, prd.id)
      });
      
      const epicIds = featureEpics.map(e => e.id);
      
      let allTasks: any[] = [];
      if (epicIds.length > 0) {
        allTasks = await db.query.tasks.findMany({
          where: inArray(tasks.epicId, epicIds),
          with: { subtasks: true }
        });
      }
      
      let epic = null;
      if (featureEpics.length > 0) {
        epic = featureEpics[0];
      }
      
      const grouped = {
        TODO: allTasks.filter(t => t.status === "TODO" || t.status === "BACKLOG"),
        IN_PROGRESS: allTasks.filter(t => t.status === "IN_PROGRESS"),
        DONE: allTasks.filter(t => t.status === "DONE"),
        epic
      };
      
      return grouped;
    }),
    
  updateStatus: orgMemberProcedure
    .input(z.object({ taskId: z.string(), status: z.enum(["TODO", "IN_PROGRESS", "DONE"]) }))
    .mutation(async ({ input }) => {
      const [updated] = await db.update(tasks)
        .set({ status: input.status })
        .where(eq(tasks.id, input.taskId))
        .returning();
        
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      return updated;
    }),
    
  batchUpdateStatus: orgMemberProcedure
    .input(z.object({ taskIds: z.array(z.string()), status: z.enum(["TODO", "IN_PROGRESS", "DONE"]) }))
    .mutation(async ({ input }) => {
      if (input.taskIds.length === 0) return [];
      
      const updated = await db.update(tasks)
        .set({ status: input.status })
        .where(inArray(tasks.id, input.taskIds))
        .returning();
        
      return updated;
    }),
    
  assignTask: orgMemberProcedure
    .input(z.object({ taskId: z.string(), assigneeId: z.string().nullable() }))
    .mutation(async ({ input, ctx }) => {
      const [updated] = await db.update(tasks)
        .set({ assigneeId: input.assigneeId })
        .where(eq(tasks.id, input.taskId))
        .returning();
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      return updated;
    }),
    
  getMyTasks: orgMemberProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ input, ctx }) => {
      const allTasks = await db.query.tasks.findMany({
        where: and(eq(tasks.orgId, input.orgId), eq(tasks.assigneeId, ctx.member.id)),
        with: {
          epic: {
            with: {
              project: true,
              prd: {
                with: {
                  featureRequest: true
                }
              }
            }
          }
        }
      });
      
      const grouped = {
        TODO: allTasks.filter(t => t.status === "TODO" || t.status === "BACKLOG"),
        IN_PROGRESS: allTasks.filter(t => t.status === "IN_PROGRESS"),
        DONE: allTasks.filter(t => t.status === "DONE"),
      };
      
      return grouped;
    })
});
