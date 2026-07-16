import { NextResponse } from "next/server";
import { db } from "@shipflow/db";
import { featureRequests } from "@shipflow/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request, context: any) {
  const { params } = context;
  const { featureId } = await params;

  try {
    const feature = await db.query.featureRequests.findFirst({
      where: eq(featureRequests.id, featureId),
    });

    if (!feature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    // Assign numeric weights to correctly track the active step
    const statusOrder: Record<string, number> = {
      SUBMITTED: 1,
      CLARIFYING: 1,
      CLARIFIED: 2,
      PRD_GENERATED: 3,
      TASKS_GENERATED: 4,
      PLAN_APPROVED: 5,
      IN_DEVELOPMENT: 5,
      IN_REVIEW: 6,
      FIX_NEEDED: 6,
      AWAITING_HUMAN_APPROVAL: 7,
      SHIPPED: 8,
      REJECTED: -1
    };
    
    const status = feature.status;
    const order = statusOrder[status] ?? 0;

    const timeline = [
      { id: "submitted", label: "Feature Submitted", completed: order >= 0 },
      { id: "clarifying", label: "Requirement Clarification", completed: order >= 1 },
      { id: "prd", label: "PRD Generation", completed: order >= 2 },
      { id: "tasks", label: "Task Breakdown", completed: order >= 3 },
      { id: "plan", label: "Plan Approval", completed: order >= 4 },
      { id: "dev", label: "In Development", completed: order >= 5 },
      { id: "review", label: "Code Review", completed: order >= 6, isError: status === "FIX_NEEDED" },
      { id: "human_approval", label: "Human Approval", completed: order >= 7 },
      { id: "shipped", label: "Shipped", completed: order >= 8 },
    ];

    return NextResponse.json({ timeline, currentStatus: status });
  } catch (error) {
    console.error("Failed to fetch workflow status", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
