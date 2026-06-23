import { NextRequest, NextResponse } from "next/server";
import { verifyGithubWebhook } from "@shipflow/github";
import { inngest } from "@shipflow/workflow";
import { db } from "@shipflow/db";
import { repositories, pullRequests, webhookEvents } from "@shipflow/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-hub-signature-256");
  const eventType = req.headers.get("x-github-event");
  const deliveryId = req.headers.get("x-github-delivery");

  if (!signature || !deliveryId) {
    return NextResponse.json({ error: "Missing signature or delivery ID" }, { status: 401 });
  }

  const payload = await req.text();
  const secret = process.env.GITHUB_WEBHOOK_SECRET || "";

  const isValid = await verifyGithubWebhook(secret, payload, signature);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const data = JSON.parse(payload);

  if (
    eventType === "pull_request" &&
    (data.action === "opened" || data.action === "synchronize" || data.action === "reopened")
  ) {
    const [webhookEvent] = await db
      .insert(webhookEvents)
      .values({
        source: "GITHUB",
        eventId: deliveryId,
        eventType: `pull_request.${data.action}`,
        payload: data,
        status: "RECEIVED",
      })
      .onConflictDoNothing()
      .returning();

    if (!webhookEvent) {
      return NextResponse.json({ received: true, deduped: true }, { status: 202 });
    }

    const ghRepoId = String(data.repository.id);
    const installationId = data.installation?.id;

    if (!installationId) {
      return NextResponse.json({ error: "No installation context" }, { status: 400 });
    }

    // Look up the repository in our DB
    const [repo] = await db
      .select()
      .from(repositories)
      .where(eq(repositories.githubRepoId, ghRepoId))
      .limit(1);

    if (!repo) {
      return NextResponse.json({ error: "Repository not connected" }, { status: 404 });
    }

    // Upsert the pull request
    const prTitle = data.pull_request.title;
    const prNumber = data.pull_request.number;
    const headSha = data.pull_request.head.sha;
    const prUrl = data.pull_request.html_url;
    const baseBranch = data.pull_request.base.ref;

    const existingPrs = await db
      .select()
      .from(pullRequests)
      .where(and(eq(pullRequests.repositoryId, repo.id), eq(pullRequests.githubPrNumber, prNumber)))
      .limit(1);

    let prRecord = existingPrs[0];

    if (!prRecord) {
      const [inserted] = await db
        .insert(pullRequests)
        .values({
          orgId: repo.orgId,
          repositoryId: repo.id,
          githubPrNumber: prNumber,
          title: prTitle,
          url: prUrl,
          state: "OPEN",
          headSha,
          baseBranch,
        })
        .returning();
      prRecord = inserted!;
    } else {
      // Update head SHA on synchronize
      await db
        .update(pullRequests)
        .set({ headSha, title: prTitle, updatedAt: new Date() })
        .where(eq(pullRequests.id, prRecord.id));
    }

    const [owner, repoName] = repo.fullName.split("/");

    // Fire Inngest event with full metadata
    await inngest.send({
      name: "github.pr.opened",
      data: {
        pullRequestId: prRecord.id,
        repositoryId: repo.id,
        githubPrNumber: prNumber,
        orgId: repo.orgId,
        repoOwner: owner!,
        repoName: repoName!,
        headSha,
        installationId,
        action: data.action,
        deliveryId,
      },
    });
  }

  return NextResponse.json({ received: true }, { status: 202 });
}
