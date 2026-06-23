import { NextRequest, NextResponse } from "next/server";
import { db } from "@shipflow/db";
import { githubInstallations } from "@shipflow/db/schema";
import { eq } from "drizzle-orm";
import { getInstallationOctokit } from "@shipflow/github";

/**
 * Fetches accessible repositories for a GitHub App installation.
 *
 * Query params:
 *   - orgId: The ShipFlow organization ID to look up the installation for.
 */
export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("orgId");

  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }

  // Look up the installation for this org
  const [installation] = await db
    .select()
    .from(githubInstallations)
    .where(eq(githubInstallations.orgId, orgId))
    .limit(1);

  if (!installation) {
    return NextResponse.json(
      { error: "No GitHub installation found for this organization" },
      { status: 404 },
    );
  }

  try {
    const octokit = await getInstallationOctokit(installation.installationId);

    const { data } = await octokit.request(
      "GET /installation/repositories",
      {
        per_page: 100,
      },
    );

    const repos = data.repositories.map((repo: any) => ({
      id: String(repo.id),
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      defaultBranch: repo.default_branch,
      htmlUrl: repo.html_url,
      description: repo.description,
      language: repo.language,
      updatedAt: repo.updated_at,
    }));

    return NextResponse.json({ repositories: repos });
  } catch (error) {
    console.error("Failed to fetch repositories:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories from GitHub" },
      { status: 500 },
    );
  }
}
