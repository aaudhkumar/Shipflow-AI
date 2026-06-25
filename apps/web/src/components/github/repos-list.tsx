"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Github, Lock, Globe, Power, Loader2, RefreshCw, Database, CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { toast } from "sonner"
import { trpc } from "~/trpc/client"
import { useRouter } from "next/navigation"

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
  connectedReposMap: Record<string, { syncStatus: string; lastSyncedAt: Date | null }>
  onConnect?: (repo: GitHubRepo) => void
  onDisconnect?: (repoId: string) => void
}

export function ReposList({ orgId, connectedReposMap, onConnect, onDisconnect }: ReposListProps) {
  const [syncingRepo, setSyncingRepo] = useState<string | null>(null)
  const [connectingRepo, setConnectingRepo] = useState<string | null>(null)
  const [disconnectingRepo, setDisconnectingRepo] = useState<string | null>(null)
  const router = useRouter()

  const { data: repos, isLoading: loading, error, refetch: fetchRepos } = trpc.repository.list.useQuery({ orgId }, {
    enabled: !!orgId,
    retry: false
  });

  const isAnySyncing = Object.values(connectedReposMap).some(repo => repo.syncStatus === "SYNCING" || repo.syncStatus === "PENDING" && syncingRepo)

  useEffect(() => {
    if (!isAnySyncing) return;

    const interval = setInterval(() => {
      router.refresh()
    }, 3000)

    return () => clearInterval(interval)
  }, [isAnySyncing, router])

  const syncMutation = trpc.repository.sync.useMutation({
    onSuccess: () => {
      toast.success("Codebase sync started in the background")
      setSyncingRepo(null)
      router.refresh()
    },
    onError: (err) => {
      toast.error(err.message)
      setSyncingRepo(null)
    }
  });

  const handleSync = async (repoId: string) => {
    setSyncingRepo(repoId)
    syncMutation.mutate({ orgId, githubRepoId: repoId });
  }

  const connectMutation = trpc.repository.connect.useMutation({
    onSuccess: () => {
      toast.success("Repository connected successfully")
      setConnectingRepo(null)
      router.refresh()
    },
    onError: (err) => {
      toast.error(err.message)
      setConnectingRepo(null)
    }
  });

  const disconnectMutation = trpc.repository.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Repository disconnected successfully")
      setDisconnectingRepo(null)
      router.refresh()
    },
    onError: (err) => {
      toast.error(err.message)
      setDisconnectingRepo(null)
    }
  });

  const handleConnect = (repo: GitHubRepo) => {
    setConnectingRepo(repo.id)
    connectMutation.mutate({ orgId, repo })
    onConnect?.(repo)
  }

  const handleDisconnect = (repoId: string) => {
    setDisconnectingRepo(repoId)
    disconnectMutation.mutate({ orgId, githubRepoId: repoId })
    onDisconnect?.(repoId)
  }

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
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button variant="outline" size="sm" onClick={() => fetchRepos()}>
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
          <Button variant="ghost" size="sm" onClick={() => fetchRepos()}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {(repos || []).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No repositories found. Make sure the GitHub App has access to your repositories.
          </p>
        ) : (
          (repos || []).map((repo) => {
            const dbRepo = connectedReposMap[repo.id]
            const isConnected = !!dbRepo
            const syncStatus = dbRepo?.syncStatus || "PENDING"
            const isSyncing = syncingRepo === repo.id || syncStatus === "SYNCING"

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
                      {isConnected && (
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-normal px-1.5 py-0 ${
                            syncStatus === "SYNCED" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                            syncStatus === "SYNCING" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                            syncStatus === "FAILED" ? "bg-destructive/10 text-destructive border-destructive/20" :
                            "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          }`}
                        >
                          {syncStatus === "SYNCED" && <CheckCircle2 className="w-3 h-3 mr-1 inline-block" />}
                          {syncStatus === "SYNCING" && <Loader2 className="w-3 h-3 mr-1 animate-spin inline-block" />}
                          {syncStatus === "FAILED" && <AlertCircle className="w-3 h-3 mr-1 inline-block" />}
                          {syncStatus === "PENDING" && <Clock className="w-3 h-3 mr-1 inline-block" />}
                          {syncStatus}
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
                      disabled={isSyncing}
                      onClick={() => handleSync(repo.id)}
                    >
                      {isSyncing ? (
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                      ) : (
                        <Database className="w-3.5 h-3.5 mr-2" />
                      )}
                      {syncStatus === "SYNCED" ? "Re-sync" : "Sync Codebase"}
                    </Button>
                  )}
                  <Button
                    variant={isConnected ? "destructive" : "secondary"}
                    size="sm"
                    disabled={connectingRepo === repo.id || disconnectingRepo === repo.id}
                    className={
                      !isConnected
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20"
                    }
                    onClick={() => {
                      if (isConnected) {
                        handleDisconnect(repo.id)
                      } else {
                        handleConnect(repo)
                      }
                    }}
                  >
                    {connectingRepo === repo.id || disconnectingRepo === repo.id ? (
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    ) : (
                      <Power className="w-3.5 h-3.5 mr-2" />
                    )}
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
