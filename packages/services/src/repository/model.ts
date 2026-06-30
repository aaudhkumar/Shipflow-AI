import { z } from "zod";

export const getConnectedListOutputSchema = z.any() as z.ZodType<Record<string, any>[]>;
export const getRepositoryListOutputSchema = z.any() as z.ZodType<Record<string, any>[]>;
export const syncRepositoryOutputSchema = z.object({ status: z.string() });
export const connectRepositoryOutputSchema = z.object({ success: z.boolean() });
export const disconnectRepositoryOutputSchema = z.object({ success: z.boolean() });
