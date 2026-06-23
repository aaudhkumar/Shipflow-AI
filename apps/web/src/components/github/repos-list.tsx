"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Github, Lock, Globe, Power, Loader2, RefreshCw, Database } from "lucide-react"
import { toast } from "sonner"

interface GitHubRepo {
  id: string
  name: string
  fullName: string
  private: boolean
  defaultBranch: string
  htmlUrl: string
  description: string | null
  language: string | null
  updatedAt: string
}

interface ReposListProps {
  orgId: string
  connectedRepoIds: string[]
  onConnect?: (repo: GitHubRepo) => void
  onDisconnect?: (repoId: string) => void
}

export function ReposList({ orgId, connectedRepoIds, onConnect, onDisconnect }: ReposListProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [syncingRepo, setSyncingRepo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSync = async (repoId: string) => {
    setSyncingRepo(repoId)
    try {
      const res = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId: repoId }),
      })
      if (!res.ok) {
        throw new Error("Failed to start sync")
      }
      toast.success("Codebase sync started in the background")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSyncingRepo(null)
    }
  }

  const fetchRepos = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/github/repos?orgId=${orgId}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to fetch repositories")
      }
      const data = await res.json()
      setRepos(data.repositories)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRepos()
  }, [orgId])

  if (loading) {
    return (
      <Card className="bg-card/40 backdrop-blur-md border-border/50 shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading repositories...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-card/40 backdrop-blur-md border-border/50 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchRepos}>
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card/40 backdrop-blur-md border-border/50 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Repositories</CardTitle>
            <CardDescription>
              Select which repositories ShipFlow AI should monitor for pull requests.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchRepos}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {repos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No repositories found. Make sure the GitHub App has access to your repositories.
          </p>
        ) : (
          repos.map((repo) => {
            const isConnected = connectedRepoIds.includes(repo.id)
            return (
              <div
                key={repo.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-muted/10 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Github className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{repo.fullName}</h4>
                      <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0">
                        {repo.private ? (
                          <Lock className="w-3 h-3 mr-1 inline-block" />
                        ) : (
                          <Globe className="w-3 h-3 mr-1 inline-block" />
                        )}
                        {repo.private ? "Private" : "Public"}
                      </Badge>
                      {repo.language && (
                        <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">
                          {repo.language}
                        </Badge>
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {repo.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isConnected && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={syncingRepo === repo.id}
                      onClick={() => handleSync(repo.id)}
                    >
                      {syncingRepo === repo.id ? (
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                      ) : (
                        <Database className="w-3.5 h-3.5 mr-2" />
                      )}
                      Sync Codebase
                    </Button>
                  )}
                  <Button
                    variant={isConnected ? "destructive" : "secondary"}
                    size="sm"
                    className={
                      !isConnected
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20"
                    }
                    onClick={() => {
                      if (isConnected) {
                        onDisconnect?.(repo.id)
                      } else {
                        onConnect?.(repo)
                      }
                    }}
                  >
                    <Power className="w-3.5 h-3.5 mr-2" />
                    {isConnected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
