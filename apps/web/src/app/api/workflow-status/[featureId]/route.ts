import { NextResponse } from "next/server";
import { db } from "@shipflow/db";
import { featureRequests } from "@shipflow/db/schema";
import { eq } from "@shipflow/db";


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
      EXECUTION_PLAN_GENERATED: 4,
      TASKS_GENERATED: 5,
      PLAN_APPROVED: 6,
      IN_DEVELOPMENT: 6,
      IN_REVIEW: 7,
      FIX_NEEDED: 7,
      AWAITING_HUMAN_APPROVAL: 8,
      SHIPPED: 9,
      REJECTED: -1
    };
    
    const status = feature.status;
    const order = statusOrder[status] ?? 0;

    const timeline = [
      { id: "submitted", label: "Feature Submitted", completed: order >= 0 },
      { id: "clarifying", label: "Requirement Clarification", completed: order >= 1 },
      { id: "prd", label: "PRD Generation", completed: order >= 2 },
      { id: "exec_plan", label: "Execution Plan Generation", completed: order >= 3 },
      { id: "tasks", label: "Task Breakdown", completed: order >= 4 },
      { id: "plan", label: "Plan Approval", completed: order >= 5 },
      { id: "dev", label: "In Development", completed: order >= 6 },
      { id: "review", label: "Code Review", completed: order >= 7, isError: status === "FIX_NEEDED" },
      { id: "human_approval", label: "Human Approval", completed: order >= 8 },
      { id: "shipped", label: "Shipped", completed: order >= 9 },
    ];

    return NextResponse.json({ timeline, currentStatus: status });
  } catch (error) {
    console.error("Failed to fetch workflow status", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
