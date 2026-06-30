import { DiffViewer } from "@/components/pr/diff-viewer"
import { SecurityAlerts } from "@/components/pr/security-alerts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GitPullRequest, ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { api } from "~/trpc/server"
import { redirect } from "next/navigation"

import { ReviewRatingButtons } from "@/components/pr/review-rating-buttons"

export default async function PRInsightsPage({ params }: { params: Promise<{ slug: string, id: string }> }) {
  const { slug, id } = await params;
  
  const org = await api.organization.getBySlug.query({ slug });
  if (!org) redirect("/onboarding");

  let pr;
  try {
    pr = await api.pullRequest.getWithReviews.query({ orgId: org.id, githubPrNumber: parseInt(id) });
  } catch (err) {
    console.error("Failed to fetch PR:", err);
    return (
      <div className="space-y-6 max-w-6xl mx-auto p-8 text-center">
        <h2 className="text-xl font-semibold">Pull Request #{id} not found</h2>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/org/${slug}`}>Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  // Get the most recent review if exists
  const latestReview = pr.reviews?.[0];
  const findings = latestReview?.findings || [];
  const blockers = findings.filter((f: any) => f.severity === "BLOCKER" || f.isBlocking);

  // Get readiness if available
  let readiness = null;
  if (pr.featureRequest && pr.featureRequest.status === "AWAITING_HUMAN_APPROVAL") {
    readiness = await api.feature.getReleaseReadiness.query({ orgId: org.id, featureId: pr.featureRequest.id });
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
          <Link href={`/org/${slug}`}><ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard</Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{pr.title}</h1>
            <Badge variant="outline" className="font-mono text-sm border-border/50">#{pr.githubPrNumber}</Badge>
          </div>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <GitPullRequest className="w-4 h-4" />
            <span className="font-mono text-sm">Repo</span>
            <span className="opacity-50">•</span>
            <span>Target: <strong>{pr.baseBranch}</strong></span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-border/60 bg-background/50 backdrop-blur-sm" asChild>
            <a href={pr.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2 opacity-70" /> View on GitHub
            </a>
          </Button>
          {pr.featureRequest && pr.featureRequest.status === "AWAITING_HUMAN_APPROVAL" && blockers.length === 0 && (
            <form action={async () => {
              "use server"
              await api.feature.approveHumanRelease.mutate({ 
                orgId: org.id, 
                featureId: pr.featureRequest!.id 
              });
              redirect(`/org/${slug}/features`);
            }}>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Approve Release
              </Button>
            </form>
          )}
        </div>
      </div>

      {(latestReview?.reviewMeta as any)?.shouldMerge !== undefined && (
        <div className={`rounded-xl border p-5 flex items-start gap-4 ${
          (latestReview?.reviewMeta as any)?.shouldMerge 
            ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400" 
            : "border-destructive/20 bg-destructive/5 text-destructive dark:text-destructive"
        }`}>
          <div className="mt-0.5">
            {(latestReview?.reviewMeta as any)?.shouldMerge ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <GitPullRequest className="w-5 h-5 text-destructive" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold mb-1">
              AI Merge Recommendation
            </h3>
            <p className="text-sm font-medium opacity-90 mb-4">
              {(latestReview?.reviewMeta as any)?.shouldMerge 
                ? "This PR provides valuable additions and should be merged." 
                : "This PR does not seem to provide valuable addons and is likely not suitable for merging."}
            </p>
            {latestReview && <ReviewRatingButtons orgId={org.id} reviewId={latestReview.id} />}
          </div>
        </div>
      )}

      {readiness && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> 
              Release Readiness Verdict
            </h3>
            <Badge variant={readiness.isReady ? "default" : "destructive"}>
              Score: {readiness.overallScore}/100
            </Badge>
          </div>
          <p className="text-sm font-medium">{readiness.recommendation}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {readiness.blockers && readiness.blockers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-destructive">Blockers</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  {readiness.blockers.map((b: string, i: number) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            )}
            {readiness.warnings && readiness.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-amber-500">Warnings</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  {readiness.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
          </div>

          {readiness.releaseNotes && (
            <div className="mt-4 pt-4 border-t border-primary/10">
              <h4 className="text-sm font-semibold mb-2">Draft Release Notes</h4>
              <div className="bg-background/50 rounded-lg p-4 text-sm font-mono whitespace-pre-wrap">
                {readiness.releaseNotes}
              </div>
            </div>
          )}
        </div>
      )}

      <SecurityAlerts findings={findings} />

      <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden mt-8">
        <div className="border-b border-border/50 bg-muted/20 px-4 py-3 flex items-center justify-between">
          <h3 className="font-medium text-sm">AI Annotated Findings</h3>
          <Badge variant="secondary" className="text-xs font-normal">{findings.length} total findings</Badge>
        </div>
        <DiffViewer findings={findings} />
      </div>
    </div>
  )
}
