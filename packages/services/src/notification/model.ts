import { z } from "zod";
import type { notifications } from "@shipflow/db/schema";
import type { InferSelectModel } from "drizzle-orm";

export const getNotificationListOutputSchema = z.any() as z.ZodType<InferSelectModel<typeof notifications>[]>;
export const getUnreadCountOutputSchema = z.number();
export const markAsReadOutputSchema = z.object({ success: z.boolean() });
export const markAllAsReadOutputSchema = z.object({ success: z.boolean() });
