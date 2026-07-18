import { requireEnv } from "@shipflow/utils";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@shipflow/db";
import { githubInstallations } from "@shipflow/db/schema";
import { eq } from "@shipflow/db";

import { getGithubApp } from "@shipflow/github";
import { auth } from "@shipflow/auth";

const GITHUB_STATE_SECRET = requireEnv("GITHUB_STATE_SECRET");
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

  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user?.id) {
    console.error("No authenticated user found during GitHub installation");
    return NextResponse.redirect(new URL("/login", req.url));
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

    const stateParam = searchParams.get("state");
    if (!stateParam) return NextResponse.redirect(new URL("/?error=missing_state", req.url));

    const stateString = Buffer.from(stateParam, "base64").toString("utf-8");
    const [orgId, timestampStr, providedHmac] = stateString.split(":");
    
    if (!orgId || !timestampStr || !providedHmac) {
      return NextResponse.json({ error: "Invalid state format" }, { status: 403 });
    }

    const timestamp = parseInt(timestampStr, 10);
    if (Date.now() - timestamp > 10 * 60 * 1000) {
      return NextResponse.json({ error: "State expired" }, { status: 403 });
    }

    const crypto = await import("crypto");
    const secret = GITHUB_STATE_SECRET;
    const expectedHmac = crypto.createHmac("sha256", secret).update(`${orgId}:${timestampStr}`).digest("hex");

    if (providedHmac !== expectedHmac) {
      return NextResponse.json({ error: "Invalid state signature" }, { status: 403 });
    }

    await db.insert(githubInstallations).values({
      orgId,
      userId: session.user.id, 
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
