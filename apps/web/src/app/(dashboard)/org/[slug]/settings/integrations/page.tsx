import { db } from "@shipflow/db"
import { githubInstallations, organizations, repositories } from "@shipflow/db/schema"
import { eq } from "drizzle-orm"
import { GitHubConnectCard } from "@/components/github/connect-card"
import { ReposList } from "@/components/github/repos-list"

export default async function IntegrationsSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Look up the org
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  if (!org) {
    return <div className="text-muted-foreground">Organization not found.</div>;
  }

  // Check if GitHub App is installed for this org
  const [installation] = await db
    .select()
    .from(githubInstallations)
    .where(eq(githubInstallations.orgId, org.id))
    .limit(1);

  // Get connected repo IDs
  const connectedRepos = await db
    .select({ githubRepoId: repositories.githubRepoId })
    .from(repositories)
    .where(eq(repositories.orgId, org.id));

  const connectedRepoIds = connectedRepos.map((r) => r.githubRepoId);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">GitHub Integration</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Connect your GitHub account to {slug} for AI-powered PR reviews.
        </p>
      </div>

      <GitHubConnectCard
        orgId={org.id}
        orgSlug={slug}
        isConnected={!!installation}
        accountLogin={installation?.accountLogin}
      />

      {installation && (
        <ReposList
          orgId={org.id}
          connectedRepoIds={connectedRepoIds}
        />
      )}
    </div>
  )
}
