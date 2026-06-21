import { inngest } from "../client";
import { db } from "@shipflow/db";
import { featureRequests } from "@shipflow/db/schema";
import { eq } from "drizzle-orm";

export const featurePrdGenerated = inngest.createFunction(
  { id: "feature-prd-generated" },
  { event: "feature.prd.generated" },
  async ({ event, step }) => {
    const { featureId, orgId } = event.data;

    await step.run("update-state-prd-generated", async () => {
      await db.update(featureRequests)
        .set({ status: "PRD_GENERATED", updatedAt: new Date() })
        .where(eq(featureRequests.id, featureId));
    });
    
    // Here we could trigger task generation if it's automated
    return { success: true, featureId, status: "PRD_GENERATED" };
  }
);

export const featureTasksGenerated = inngest.createFunction(
  { id: "feature-tasks-generated" },
  { event: "feature.tasks.generated" },
  async ({ event, step }) => {
    const { featureId } = event.data;

    await step.run("update-state-tasks-generated", async () => {
      await db.update(featureRequests)
        .set({ status: "TASKS_GENERATED", updatedAt: new Date() })
        .where(eq(featureRequests.id, featureId));
    });

    return { success: true, featureId, status: "TASKS_GENERATED" };
  }
);

export const featurePlanApproved = inngest.createFunction(
  { id: "feature-plan-approved" },
  { event: "feature.plan.approved" },
  async ({ event, step }) => {
    const { featureId } = event.data;

    await step.run("update-state-plan-approved", async () => {
      await db.update(featureRequests)
        .set({ status: "PLAN_APPROVED", updatedAt: new Date() })
        .where(eq(featureRequests.id, featureId));
    });

    return { success: true, featureId, status: "PLAN_APPROVED" };
  }
);

export const featureReviewFailed = inngest.createFunction(
  { id: "feature-review-failed" },
  { event: "feature.review.failed" },
  async ({ event, step }) => {
    const { featureId } = event.data;

    await step.run("update-state-fix-needed", async () => {
      await db.update(featureRequests)
        .set({ status: "FIX_NEEDED", updatedAt: new Date() })
        .where(eq(featureRequests.id, featureId));
    });

    return { success: true, featureId, status: "FIX_NEEDED" };
  }
);

export const featureHumanApproved = inngest.createFunction(
  { id: "feature-human-approved" },
  { event: "feature.human.approved" },
  async ({ event, step }) => {
    const { featureId } = event.data;

    await step.run("update-state-shipped", async () => {
      await db.update(featureRequests)
        .set({ status: "SHIPPED", updatedAt: new Date() })
        .where(eq(featureRequests.id, featureId));
    });

    return { success: true, featureId, status: "SHIPPED" };
  }
);
