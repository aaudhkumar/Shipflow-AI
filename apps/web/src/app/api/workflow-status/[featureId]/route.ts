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

    // Map feature status to timeline steps
    const status = feature.status;
    
    // Determine the current step index
    const steps = [
      "SUBMITTED",
      "CLARIFIED",
      "PLAN_APPROVED",
      "IN_DEVELOPMENT",
      "IN_REVIEW",
      "AWAITING_HUMAN_APPROVAL",
      "SHIPPED"
    ];
    
    let currentIndex = steps.indexOf(status);
    // Handle FIX_NEEDED
    if (status === "FIX_NEEDED") currentIndex = steps.indexOf("IN_REVIEW");

    const timeline = [
      { id: "submitted", label: "Feature Submitted", completed: currentIndex >= 0 },
      { id: "clarified", label: "AI Clarification", completed: currentIndex >= 1 },
      { id: "plan_approved", label: "Plan Generated & Approved", completed: currentIndex >= 2 },
      { id: "development", label: "In Development", completed: currentIndex >= 3 },
      { id: "review", label: "Code Review", completed: currentIndex >= 4, isError: status === "FIX_NEEDED" },
      { id: "human_approval", label: "Human Approval", completed: currentIndex >= 5 },
      { id: "shipped", label: "Shipped", completed: currentIndex >= 6 },
    ];

    return NextResponse.json({ timeline, currentStatus: status });
  } catch (error) {
    console.error("Failed to fetch workflow status", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
