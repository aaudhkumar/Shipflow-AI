import { NextRequest, NextResponse } from "next/server";
import { db } from "@shipflow/db";
import { githubInstallations } from "@shipflow/db/schema";
import { eq } from "drizzle-orm";
import { getGithubApp } from "@shipflow/github";
import { headers } from "next/headers";

/**
 * GitHub App installation callback handler.
 *
 * After a user installs the ShipFlow GitHub App on their GitHub account/org,
 * GitHub redirects to this route with `installation_id` and `setup_action`.
 * We persist the installation and redirect back to the integrations page.
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const installationId = searchParams.get("installation_id");
  const setupAction = searchParams.get("setup_action");

  if (!installationId || setupAction !== "install") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const installationIdNum = parseInt(installationId, 10);

  // Check if this installation is already saved
  const existing = await db
    .select()
    .from(githubInstallations)
    .where(eq(githubInstallations.installationId, installationIdNum))
    .limit(1);

  if (existing.length > 0) {
    // Already saved — redirect back
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Fetch installation details from GitHub to get the account login
  try {
    const app = getGithubApp();
    const octokit = await app.getInstallationOctokit(installationIdNum);
    const { data: installation } = await octokit.request(
      "GET /app/installations/{installation_id}",
      { installation_id: installationIdNum },
    );

    const accountLogin = (installation.account as any)?.login || "unknown";

    // For now, we store with placeholder org/user IDs.
    // The frontend will associate with the correct org after redirect.
    await db.insert(githubInstallations).values({
      orgId: searchParams.get("state") || "", // org ID passed via state param
      userId: "", // Will be filled by the frontend session
      installationId: installationIdNum,
      accountLogin,
    });
  } catch (error) {
    console.error("Failed to save GitHub installation:", error);
    return NextResponse.json(
      { error: "Failed to complete GitHub App installation" },
      { status: 500 },
    );
  }

  // Redirect back to integrations settings
  const redirectUrl = searchParams.get("state")
    ? new URL(`/`, req.url)
    : new URL("/", req.url);

  return NextResponse.redirect(redirectUrl);
}
