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
      SUBMITTED: 0,
      CLARIFYING: 0.5,
      CLARIFIED: 1,
      PRD_GENERATED: 1.5,
      TASKS_GENERATED: 1.8,
      PLAN_APPROVED: 2,
      IN_DEVELOPMENT: 3,
      IN_REVIEW: 4,
      FIX_NEEDED: 4,
      AWAITING_HUMAN_APPROVAL: 5,
      SHIPPED: 6,
      REJECTED: -1
    };
    
    const status = feature.status;
    const order = statusOrder[status] ?? 0;

    const timeline = [
      { id: "submitted", label: "Feature Submitted", completed: order >= 0 },
      { id: "clarified", label: "AI Clarification", completed: order >= 0.5 },
      { id: "plan_approved", label: "Plan Generated & Approved", completed: order >= 1.5 },
      { id: "development", label: "In Development", completed: order >= 3 },
      { id: "review", label: "Code Review", completed: order >= 4, isError: status === "FIX_NEEDED" },
      { id: "human_approval", label: "Human Approval", completed: order >= 5 },
      { id: "shipped", label: "Shipped", completed: order >= 6 },
    ];

    return NextResponse.json({ timeline, currentStatus: status });
  } catch (error) {
    console.error("Failed to fetch workflow status", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
