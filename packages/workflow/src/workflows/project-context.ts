import { inngest } from "@shipflow/services/workflow/client";
import { db } from "@shipflow/db";
import { projects, featureRequests } from "@shipflow/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { runProjectContextGenerator } from "@shipflow/ai";

export const generateProjectContextWorkflow = inngest.createFunction(
  { id: "generate-project-context" },
  { event: "project.context.generate" },
  async ({ event, step }) => {
    const { projectId, orgId } = event.data;

    const projectData = await step.run("fetch-project-data", async () => {
      const [project] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)))
        .limit(1);

      if (!project) throw new Error("Project not found");
      return project;
    });

    const shippedFeatures = await step.run("fetch-shipped-features", async () => {
      // Fetch features that are either COMPLETED, SHIPPED, or in development
      const features = await db
        .select({
          title: featureRequests.title,
          description: featureRequests.rawDescription,
        })
        .from(featureRequests)
        .where(
          and(
            eq(featureRequests.projectId, projectId),
            eq(featureRequests.orgId, orgId)
          )
        )
        .orderBy(desc(featureRequests.createdAt))
        .limit(20); // Limit to most recent 20 features for context

      return features;
    });

    const generatedContext = await step.run("run-ai-context-generator", async () => {
      const { result } = await runProjectContextGenerator(
        projectData.name,
        projectData.description,
        shippedFeatures as any[]
      );
      return result.document;
    });

    await step.run("save-project-context", async () => {
      await (db as any)
        .update(projects)
        .set({ contextDocument: generatedContext, updatedAt: new Date() })
        .where(eq((projects as any).id, projectId));
    });

    return { success: true, documentLength: generatedContext.length };
  }
);
