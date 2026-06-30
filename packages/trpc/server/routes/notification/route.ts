import { z } from "zod";
import { protectedProcedure, orgMemberProcedure, router } from "../../trpc";
import { notifications } from "@shipflow/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const notificationRouter = router({
  list: orgMemberProcedure
    .query(async ({ ctx, input }) => {
      return ctx.db.query.notifications.findMany({
        where: and(
          eq(notifications.orgId, ctx.orgId),
          eq(notifications.userId, ctx.session.user.id)
        ),
        orderBy: desc(notifications.createdAt),
        limit: 50,
      });
    }),

  getUnreadCount: orgMemberProcedure
    .query(async ({ ctx }) => {
      const { db } = await import("@shipflow/db");
      const { notifications } = await import("@shipflow/db/schema");
      const { eq, and } = await import("drizzle-orm");

      const result = await db.select({ count: db.$count(notifications) })
        .from(notifications)
        .where(and(
          eq(notifications.orgId, ctx.orgId),
          eq(notifications.userId, ctx.session.user.id),
          eq(notifications.isRead, false)
        ));
      return result[0]?.count || 0;
    }),

  markAsRead: orgMemberProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.id, input.notificationId),
          eq(notifications.orgId, ctx.orgId),
          eq(notifications.userId, ctx.session.user.id)
        ));
      return { success: true };
    }),

  markAllAsRead: orgMemberProcedure
    .mutation(async ({ ctx }) => {
      await ctx.db.update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.orgId, ctx.orgId),
          eq(notifications.userId, ctx.session.user.id),
          eq(notifications.isRead, false)
        ));
      return { success: true };
    }),
});
