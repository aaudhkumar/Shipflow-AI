import { z } from "zod";
import { protectedProcedure, orgMemberProcedure, router } from "../../trpc";
import { notifications } from "@shipflow/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { zodUndefinedModel } from "../../schema";
import { generatePath } from "../../utils/path-generator";
import {
  getNotificationListOutputSchema,
  getUnreadCountOutputSchema,
  markAsReadOutputSchema,
  markAllAsReadOutputSchema
} from "@shipflow/services/notification/model";

const TAGS = ["Notification"];
const getPath = generatePath("/notifications");

export const notificationRouter = router({
  list: orgMemberProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{orgId}"), tags: TAGS } })
    .input(z.object({ orgId: z.string() }))
    .output(getNotificationListOutputSchema)
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
    .meta({ openapi: { method: "GET", path: getPath("/{orgId}/unread/count"), tags: TAGS } })
    .input(z.object({ orgId: z.string() }))
    .output(getUnreadCountOutputSchema)
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
    .meta({ openapi: { method: "POST", path: getPath("/{orgId}/{notificationId}/read"), tags: TAGS } })
    .input(z.object({ orgId: z.string(), notificationId: z.string() }))
    .output(markAsReadOutputSchema)
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
    .meta({ openapi: { method: "POST", path: getPath("/{orgId}/read/all"), tags: TAGS } })
    .input(z.object({ orgId: z.string() }))
    .output(markAllAsReadOutputSchema)
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
