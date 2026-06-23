import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@shipflow/workflow";
import { db } from "@shipflow/db";
import { repositories, githubInstallations } from "@shipflow/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { repositoryId } = await req.json();

    if (!repositoryId) {
      return NextResponse.json({ error: "Missing repositoryId" }, { status: 400 });
    }

    // Look up the repository
    const [repo] = await db
      .select()
      .from(repositories)
      .where(eq(repositories.id, repositoryId))
      .limit(1);

    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    // Look up the installation
    const [installation] = await db
      .select()
      .from(githubInstallations)
      .where(eq(githubInstallations.orgId, repo.orgId))
      .limit(1);

    if (!installation) {
      return NextResponse.json({ error: "GitHub App not installed for this org" }, { status: 404 });
    }

    const [owner, name] = repo.fullName.split("/");

    // Fire the sync event
    await inngest.send({
      name: "repo.sync.requested",
      data: {
        repositoryId: repo.id,
        orgId: repo.orgId,
        installationId: installation.installationId,
        repoOwner: owner!,
        repoName: name!,
        defaultBranch: repo.defaultBranch || "main",
      },
    });

    return NextResponse.json({ success: true, message: "Sync started" });
  } catch (error: any) {
    console.error("Failed to start sync:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
