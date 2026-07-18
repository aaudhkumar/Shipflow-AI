import { NextRequest, NextResponse } from "next/server";
import { verifyGithubWebhook } from "@shipflow/github";
import { inngest } from "@shipflow/workflow";
import { db } from "@shipflow/db";
import { repositories, pullRequests, webhookEvents, featureRequests, tasks, epics, prds } from "@shipflow/db/schema";
import { eq, and } from "@shipflow/db";


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
    const headBranch = data.pull_request.head.ref;

    // Extract potential UUIDs from PR title and branch name
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
    const matches = new Set<string>();
    for (const match of prTitle.matchAll(uuidRegex)) matches.add(match[0].toLowerCase());
    for (const match of headBranch.matchAll(uuidRegex)) matches.add(match[0].toLowerCase());

    let featureRequestId: string | null = null;
    let taskId: string | null = null;
    
    if (data.pull_request.body) {
      const featureIdMatch = data.pull_request.body.match(/featureRequestId:\s*([0-9a-f-]+)/i);
      if (featureIdMatch) featureRequestId = featureIdMatch[1];
      
      const taskIdMatch = data.pull_request.body.match(/taskId:\s*([0-9a-f-]+)/i);
      if (taskIdMatch) taskId = taskIdMatch[1];
    }

    if (matches.size > 0) {
      for (const uuid of matches) {
        if (featureRequestId && taskId) break;
        
        if (!featureRequestId) {
          const [feature] = await db.select().from(featureRequests).where(eq(featureRequests.id, uuid)).limit(1);
          if (feature) {
            featureRequestId = feature.id;
            continue;
          }
        }
        
        if (!taskId) {
          const taskData = await db
            .select({
              taskId: tasks.id,
              featureRequestId: prds.featureRequestId
            })
            .from(tasks)
            .innerJoin(epics, eq(tasks.epicId, epics.id))
            .innerJoin(prds, eq(epics.prdId, prds.id))
            .where(eq(tasks.id, uuid))
            .limit(1);
            
          if (taskData.length > 0) {
            taskId = taskData[0]!.taskId;
            featureRequestId = featureRequestId || taskData[0]!.featureRequestId;
          }
        }
      }
    }

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
          featureRequestId,
          taskId,
        })
        .returning();
      prRecord = inserted!;
    } else {
      // Update head SHA on synchronize
      await db
        .update(pullRequests)
        .set({ 
          headSha, 
          title: prTitle, 
          updatedAt: new Date(),
          ...(featureRequestId && !prRecord.featureRequestId ? { featureRequestId } : {}),
          ...(taskId && !prRecord.taskId ? { taskId } : {}),
        })
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
  } else if (eventType === "release" && data.action === "published") {
    // Record the webhook event
    await db
      .insert(webhookEvents)
      .values({
        source: "GITHUB",
        eventId: deliveryId,
        eventType: `release.${data.action}`,
        payload: data,
        status: "RECEIVED",
      })
      .onConflictDoNothing();

    const ghRepoId = String(data.repository.id);
    const installationId = data.installation?.id;

    if (!installationId) {
      return NextResponse.json({ error: "No installation context" }, { status: 400 });
    }

    const [repo] = await db
      .select()
      .from(repositories)
      .where(eq(repositories.githubRepoId, ghRepoId))
      .limit(1);

    if (!repo) {
      return NextResponse.json({ error: "Repository not connected" }, { status: 404 });
    }

    await inngest.send({
      name: "github.release.published",
      data: {
        orgId: repo.orgId,
        repositoryId: repo.id,
        releaseId: data.release.id,
        tagName: data.release.tag_name,
        publishedAt: data.release.published_at,
      },
    });
  } else if (eventType === "issues" && (data.action === "opened" || data.action === "closed")) {
    await db
      .insert(webhookEvents)
      .values({
        source: "GITHUB",
        eventId: deliveryId,
        eventType: `issues.${data.action}`,
        payload: data,
        status: "RECEIVED",
      })
      .onConflictDoNothing();

    const ghRepoId = String(data.repository.id);
    const [repo] = await db.select().from(repositories).where(eq(repositories.githubRepoId, ghRepoId)).limit(1);

    if (!repo) {
      return NextResponse.json({ error: "Repository not connected" }, { status: 404 });
    }

    if (data.action === "opened") {
      await inngest.send({
        name: "github.issue.opened",
        data: {
          orgId: repo.orgId,
          repositoryId: repo.id,
          issueNumber: data.issue.number,
          title: data.issue.title,
          body: data.issue.body || "",
          state: data.issue.state,
          authorLogin: data.issue.user.login,
          actionAt: data.issue.created_at,
        },
      });
    } else {
      await inngest.send({
        name: "github.issue.closed",
        data: {
          orgId: repo.orgId,
          repositoryId: repo.id,
          issueNumber: data.issue.number,
          title: data.issue.title,
          body: data.issue.body || "",
          state: data.issue.state,
          authorLogin: data.issue.user.login,
          actionAt: data.issue.closed_at,
        },
      });
    }
  } else if (eventType === "issue_comment" && data.action === "created") {
    await db
      .insert(webhookEvents)
      .values({
        source: "GITHUB",
        eventId: deliveryId,
        eventType: `issue_comment.${data.action}`,
        payload: data,
        status: "RECEIVED",
      })
      .onConflictDoNothing();

    const ghRepoId = String(data.repository.id);
    const [repo] = await db.select().from(repositories).where(eq(repositories.githubRepoId, ghRepoId)).limit(1);

    if (!repo) {
      return NextResponse.json({ error: "Repository not connected" }, { status: 404 });
    }

    await inngest.send({
      name: "github.issue_comment.created",
      data: {
        orgId: repo.orgId,
        repositoryId: repo.id,
        issueNumber: data.issue.number,
        githubCommentId: data.comment.id,
        body: data.comment.body || "",
        authorLogin: data.comment.user.login,
        createdAt: data.comment.created_at,
      },
    });
  }

  return NextResponse.json({ received: true }, { status: 202 });
}
