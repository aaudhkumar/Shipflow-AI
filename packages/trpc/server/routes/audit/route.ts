import { z } from "zod";
import { orgMemberProcedure, router } from "../../trpc";
import { auditLogs, featureRequests, projects, members, repositories } from "@shipflow/db/schema";
import { eq, desc, and, gte, lte, inArray } from "drizzle-orm";
import { getAuditListOutputSchema } from "@shipflow/services/audit/model";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Audit"];
const getPath = generatePath("/audit");

export const auditRouter = router({
  list: orgMemberProcedure
    .meta({ openapi: { method: "GET", path: getPath("/"), tags: TAGS } })
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      cursor: z.number().default(0), // offset
      action: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .output(getAuditListOutputSchema)
    .query(async ({ ctx, input }) => {
      const conditions = [eq(auditLogs.orgId, ctx.orgId)];
      
      if (input.action) {
        conditions.push(eq(auditLogs.action, input.action));
      }
      if (input.startDate) {
        conditions.push(gte(auditLogs.timestamp, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(auditLogs.timestamp, new Date(input.endDate)));
      }

      const logs = await ctx.db.query.auditLogs.findMany({
        where: and(...conditions),
        orderBy: desc(auditLogs.timestamp),
        limit: input.limit,
        offset: input.cursor,
        with: {
          actor: {
            with: { user: true }
          }
        }
      });

      const featureIds = logs.filter(l => l.targetEntity === 'FEATURE').map(l => l.targetEntityId);
      const projectIds = logs.filter(l => l.targetEntity === 'PROJECT').map(l => l.targetEntityId);
      const memberIds = logs.filter(l => l.targetEntity === 'MEMBER').map(l => l.targetEntityId);
      const repoIds = logs.filter(l => l.targetEntity === 'REPOSITORY').map(l => l.targetEntityId);

      const [features, projectsData, membersData, repos] = await Promise.all([
        featureIds.length ? ctx.db.query.featureRequests.findMany({ where: inArray(featureRequests.id, featureIds), columns: { id: true, title: true } }) : Promise.resolve([]),
        projectIds.length ? ctx.db.query.projects.findMany({ where: inArray(projects.id, projectIds), columns: { id: true, name: true } }) : Promise.resolve([]),
        memberIds.length ? ctx.db.query.members.findMany({ where: inArray(members.id, memberIds), with: { user: { columns: { name: true } } } }) : Promise.resolve([]),
        repoIds.length ? ctx.db.query.repositories.findMany({ where: inArray(repositories.id, repoIds), columns: { id: true, fullName: true } }) : Promise.resolve([]),
      ]);

      const entityNameMap = new Map<string, string>();
      features.forEach(f => entityNameMap.set(f.id, f.title));
      projectsData.forEach(p => entityNameMap.set(p.id, p.name));
      membersData.forEach(m => entityNameMap.set(m.id, m.user?.name || 'Unknown User'));
      repos.forEach(r => entityNameMap.set(r.id, r.fullName));

      const enrichedLogs = logs.map(log => ({
        ...log,
        entityName: entityNameMap.get(log.targetEntityId) || log.targetEntityId,
      }));

      return {
        items: enrichedLogs,
        nextCursor: logs.length === input.limit ? input.cursor + input.limit : undefined,
      };
    }),
});
