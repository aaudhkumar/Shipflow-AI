import { NextRequest, NextResponse } from "next/server";
import { db } from "@shipflow/db";
import { deployments, repositories } from "@shipflow/db/schema";
import { eq } from "drizzle-orm";
import { inngest } from "@shipflow/workflow";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    // 1. Security Check
    // Vercel sends x-vercel-signature, but we also support a simple query parameter secret
    const urlSecret = req.nextUrl.searchParams.get("secret");
    const configuredSecret = process.env.DEPLOYMENT_WEBHOOK_SECRET;

    if (!configuredSecret) {
      console.warn("DEPLOYMENT_WEBHOOK_SECRET is not configured");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    if (urlSecret !== configuredSecret) {
      // Optional: check x-vercel-signature if urlSecret didn't match (simplified for this example)
      const signature = req.headers.get("x-vercel-signature");
      if (!signature) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      const rawBody = await req.clone().text();
      const expectedSignature = crypto
        .createHmac("sha1", configuredSecret)
        .update(rawBody)
        .digest("hex");
        
      if (signature !== expectedSignature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // 2. Parse payload
    const body = await req.json();
    
    // We expect Vercel webhook format
    const type = body.type; // e.g., "deployment.succeeded"
    const payload = body.payload;
    
    if (!type || !payload || !payload.deployment) {
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
    }

    const commitSha = payload.deployment.meta?.githubCommitSha;
    const repoFullName = payload.deployment.meta?.githubCommitRepo; // e.g. "acme/repo"
    const url = payload.deployment.url;
    const environment = payload.target || "preview"; // "production" or "preview"
    
    // Fallback: If repo is not in payload, maybe it's in query string
    const repositoryIdQuery = req.nextUrl.searchParams.get("repositoryId");

    let repositoryId = repositoryIdQuery;
    
    if (!repositoryId && repoFullName) {
      const repoRecord = await db.query.repositories.findFirst({
        where: eq(repositories.fullName, repoFullName)
      });
      if (repoRecord) {
        repositoryId = repoRecord.id;
      }
    }

    if (!repositoryId || !commitSha) {
      return NextResponse.json({ error: "Missing repository identification or commit SHA" }, { status: 400 });
    }

    let status: "PENDING" | "SUCCESS" | "FAILED" | "ERROR" = "PENDING";
    if (type === "deployment.created") status = "PENDING";
    else if (type === "deployment.succeeded") status = "SUCCESS";
    else if (type === "deployment.error" || type === "deployment.canceled") status = "FAILED";

    // 3. Upsert / Insert deployment record
    // In a real app we might update if deployment already exists for this URL, but insert is fine.
    const [deployment] = await db.insert(deployments).values({
      repositoryId,
      commitSha,
      environment,
      status,
      deploymentUrl: url ? `https://${url}` : null,
    }).returning();

    if (!deployment) {
      return NextResponse.json({ error: "Failed to create deployment record" }, { status: 500 });
    }

    // 4. Trigger Inngest workflow if deployment failed
    if (status === "FAILED") {
      await inngest.send({
        name: "deployment.failed",
        data: {
          deploymentId: deployment.id,
          repositoryId: repositoryId,
          commitSha: commitSha,
          environment: environment,
        }
      });
    }

    return NextResponse.json({ success: true, deploymentId: deployment.id });

  } catch (error) {
    console.error("Deployment webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
