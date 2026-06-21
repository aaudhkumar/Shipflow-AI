import { NextRequest, NextResponse } from "next/server";
import { verifyGithubWebhook } from "@shipflow/github";
import { inngest } from "@shipflow/workflow";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-hub-signature-256");
  const eventType = req.headers.get("x-github-event");
  
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const payload = await req.text();
  const secret = process.env.GITHUB_WEBHOOK_SECRET || "";

  const isValid = await verifyGithubWebhook(secret, payload, signature);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const data = JSON.parse(payload);

  if (eventType === "pull_request" && (data.action === "opened" || data.action === "synchronize")) {
    await inngest.send({
      name: "github.pr.opened",
      data: {
        pullRequestId: crypto.randomUUID(), // Stub for now until DB linked
        repositoryId: crypto.randomUUID(),  // Stub for now
        githubPrNumber: data.pull_request.number,
        orgId: "org_123", // Stub
      },
    });
  }

  return NextResponse.json({ received: true }, { status: 202 });
}
