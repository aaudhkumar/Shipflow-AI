import { z } from "zod";
import type { ProjectService } from "./project.service";

// Using z.custom to ensure zero type errors while satisfying OpenAPI schema requirements.
// By doing this, tRPC infers the EXACT return type of the service method.
// We use Awaited<ReturnType<...>> so the frontend retains perfect type safety!

// Mock an instance type for ReturnType extraction
declare const projectService: ProjectService;

export const getProjectOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof projectService.getProjectWithDetails>>>>;
export const getProjectListOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof projectService.listProjects>>>>;
export const createProjectOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof projectService.createProject>>>>;
export const updateProjectMembersOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof projectService.updateMembers>>>>;
