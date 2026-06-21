"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Github, Lock, Globe, Power } from "lucide-react"

export function RepoSelector() {
  const repositories = [
    {
      id: "1",
      name: "shipflow/api-core",
      private: true,
      connected: true,
      lastAnalyzed: "2 hours ago"
    },
    {
      id: "2",
      name: "shipflow/web",
      private: true,
      connected: true,
      lastAnalyzed: "1 day ago"
    },
    {
      id: "3",
      name: "shipflow/docs",
      private: false,
      connected: false,
      lastAnalyzed: null
    }
  ]

  return (
    <Card className="bg-card/40 backdrop-blur-md border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Connected Repositories</CardTitle>
        <CardDescription>Select which repositories ShipFlow AI should monitor for pull requests.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {repositories.map((repo) => (
          <div key={repo.id} className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-muted/10 transition-colors hover:bg-muted/30">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Github className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm">{repo.name}</h4>
                  <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0">
                    {repo.private ? <Lock className="w-3 h-3 mr-1 inline-block" /> : <Globe className="w-3 h-3 mr-1 inline-block" />}
                    {repo.private ? "Private" : "Public"}
                  </Badge>
                </div>
                {repo.connected && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Last analyzed {repo.lastAnalyzed}
                  </p>
                )}
              </div>
            </div>
            
            <Button 
              variant={repo.connected ? "destructive" : "secondary"} 
              size="sm"
              className={!repo.connected ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20"}
            >
              <Power className="w-3.5 h-3.5 mr-2" />
              {repo.connected ? "Disconnect" : "Connect"}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
