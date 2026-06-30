import { z } from "zod";

export const getKanbanOutputSchema = z.any() as z.ZodType<any>;
export const updateTaskStatusOutputSchema = z.any() as z.ZodType<any>;
export const batchUpdateTaskStatusOutputSchema = z.any() as z.ZodType<any>;
export const assignTaskOutputSchema = z.any() as z.ZodType<any>;
export const getMyTasksOutputSchema = z.any() as z.ZodType<any>;
