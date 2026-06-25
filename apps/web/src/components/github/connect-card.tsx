"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Github, ExternalLink, CheckCircle2, Loader2 } from "lucide-react"
import { trpc } from "~/trpc/client"
import { useState } from "react"

interface GitHubConnectCardProps {
  orgId: string
  orgSlug: string
  isConnected: boolean
  accountLogin?: string
}

export function GitHubConnectCard({ orgId, orgSlug, isConnected, accountLogin }: GitHubConnectCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const installMutation = trpc.organization.getGithubInstallUrl.useMutation()

  const handleInstall = async () => {
    try {
      setIsLoading(true)
      const installUrl = await installMutation.mutateAsync({ orgId })
      window.location.href = installUrl
    } catch (error) {
      console.error("Failed to generate install URL", error)
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-card/40 backdrop-blur-md border-border/50 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Github className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">GitHub App</CardTitle>
              <CardDescription>
                Connect your GitHub account to enable AI-powered PR reviews.
              </CardDescription>
            </div>
          </div>
          {isConnected ? (
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
              Not Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
            <div className="flex items-center gap-2">
              <Github className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{accountLogin}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleInstall} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5 mr-2" />}
              Manage
            </Button>
          </div>
        ) : (
          <Button className="w-full sm:w-auto" onClick={handleInstall} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Github className="w-4 h-4 mr-2" />}
            Connect GitHub
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
