import { router, orgMemberProcedure } from "../../trpc";
import { z } from "zod";
import { db } from "@shipflow/db";
import { prds, epics, tasks } from "@shipflow/db/schema";
import { eq, inArray } from "drizzle-orm";
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
          where: inArray(tasks.epicId, epicIds)
        });
      }
      
      const grouped = {
        TODO: allTasks.filter(t => t.status === "TODO"),
        IN_PROGRESS: allTasks.filter(t => t.status === "IN_PROGRESS"),
        DONE: allTasks.filter(t => t.status === "DONE"),
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
    })
});
