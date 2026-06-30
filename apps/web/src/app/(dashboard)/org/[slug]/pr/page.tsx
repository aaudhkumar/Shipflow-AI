import { db } from "@shipflow/db"
import { repositories } from "@shipflow/db/schema"
import { eq } from "drizzle-orm"
import { GitPullRequest, ArrowRight, ExternalLink, Clock, CheckCircle2, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { api } from "~/trpc/server"

export default async function PRListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fetch the org by slug
  const org = await api.organization.getBySlug.query({ slug });

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-xl font-semibold">Organization not found</h2>
      </div>
    );
  }

  // Fetch all PRs for this org
  const prs = await api.pullRequest.list.query({ orgId: org.id });

  // Fetch connected repositories to show the correct empty state
  const connectedRepos = await db.select().from(repositories).where(eq(repositories.orgId, org.id));
  const hasConnectedRepos = connectedRepos.length > 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PR Insights</h1>
          <p className="text-muted-foreground mt-1">
            Track AI reviews and code quality across your pull requests.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col">
        {prs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <GitPullRequest className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No Pull Requests found</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              {hasConnectedRepos 
                ? "You have connected repositories. Open a pull request on GitHub to see AI insights appear here automatically." 
                : "Connect a repository and open a pull request on GitHub to see AI insights appear here automatically."}
            </p>
            {!hasConnectedRepos && (
              <Button asChild className="mt-6" variant="outline">
                <Link href={`/org/${slug}/settings/integrations`}>
                  Connect Repositories
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {prs.map((pr) => (
              <div key={pr.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {pr.state === "OPEN" || pr.state === "IN_REVIEW" ? (
                      <Clock className="w-5 h-5 text-yellow-500" />
                    ) : pr.state === "MERGED" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : pr.state === "CLOSED" ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <GitPullRequest className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/org/${slug}/pr/${pr.githubPrNumber}`} className="font-semibold text-lg hover:underline decoration-primary/50 underline-offset-4">
                        {pr.title}
                      </Link>
                      <Badge variant="outline" className="font-mono text-xs border-border/50 bg-background/50">
                        #{pr.githubPrNumber}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 uppercase bg-primary/10 text-primary">
                        {pr.state.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">{pr.repoName}</span>
                      <span className="opacity-50">•</span>
                      <span>Opened {new Date(pr.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {pr.url && (
                    <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground">
                      <a href={pr.url} target="_blank" rel="noreferrer" title="View on GitHub">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                  <Button variant="secondary" asChild className="shadow-sm">
                    <Link href={`/org/${slug}/pr/${pr.githubPrNumber}`}>
                      View Insights <ArrowRight className="w-4 h-4 ml-2 opacity-70" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
