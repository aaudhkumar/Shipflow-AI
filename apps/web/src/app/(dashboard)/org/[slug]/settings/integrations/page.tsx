import { RepoSelector } from "@/components/settings/repo-selector"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"

export default function IntegrationsSettingsPage({ params }: { params: { slug: string } }) {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">GitHub Integration</h2>
          <p className="text-muted-foreground mt-1">
            Connect repositories to allow ShipFlow AI to analyze pull requests.
          </p>
        </div>
        <Button variant="outline" className="border-border/60">
          <Github className="w-4 h-4 mr-2" /> Manage GitHub App
        </Button>
      </div>

      <RepoSelector />
    </div>
  )
}
