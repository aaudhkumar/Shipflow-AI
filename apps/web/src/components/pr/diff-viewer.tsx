"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react"

export function DiffViewer() {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="font-mono text-sm">
      <div className="px-4 py-2 bg-muted/30 border-b border-border/30 text-xs flex justify-between">
        <span>src/app/api/webhooks/razorpay/route.ts</span>
        <span className="text-emerald-500">+12</span>
        <span className="text-destructive">-4</span>
      </div>
      
      <div className="bg-[#0f111a] text-[#a6accd] overflow-x-auto">
        <div className="table w-full border-collapse">
          {/* Unchanged */}
          <div className="table-row hover:bg-white/5">
            <div className="table-cell select-none border-r border-white/10 px-2 py-0.5 text-right text-white/30 w-12">42</div>
            <div className="table-cell select-none border-r border-white/10 px-2 py-0.5 text-right text-white/30 w-12">42</div>
            <div className="table-cell px-4 py-0.5 whitespace-pre">  const body = await req.text()</div>
          </div>
          
          {/* Removed */}
          <div className="table-row bg-rose-500/10 hover:bg-rose-500/20">
            <div className="table-cell select-none border-r border-rose-500/20 px-2 py-0.5 text-right text-rose-400 w-12">43</div>
            <div className="table-cell select-none border-r border-rose-500/20 px-2 py-0.5 text-right text-white/30 w-12"></div>
            <div className="table-cell px-4 py-0.5 whitespace-pre text-rose-300">- const signature = req.headers.get("x-razorpay-signature")</div>
          </div>
          
          {/* Added */}
          <div className="table-row bg-emerald-500/10 hover:bg-emerald-500/20">
            <div className="table-cell select-none border-r border-emerald-500/20 px-2 py-0.5 text-right text-white/30 w-12"></div>
            <div className="table-cell select-none border-r border-emerald-500/20 px-2 py-0.5 text-right text-emerald-400 w-12">43</div>
            <div className="table-cell px-4 py-0.5 whitespace-pre text-emerald-300">+ const signature = req.headers.get("x-razorpay-signature") as string</div>
          </div>

          <div className="table-row bg-emerald-500/10 hover:bg-emerald-500/20">
            <div className="table-cell select-none border-r border-emerald-500/20 px-2 py-0.5 text-right text-white/30 w-12"></div>
            <div className="table-cell select-none border-r border-emerald-500/20 px-2 py-0.5 text-right text-emerald-400 w-12">44</div>
            <div className="table-cell px-4 py-0.5 whitespace-pre text-emerald-300">+ if (!signature) return new Response("Missing sig", {"{ status: 400 }"})</div>
          </div>

          {/* AI Annotation */}
          {expanded && (
            <div className="table-row bg-primary/10">
              <div className="table-cell border-r border-primary/20"></div>
              <div className="table-cell border-r border-primary/20"></div>
              <div className="table-cell p-4">
                <div className="rounded-lg bg-card border border-primary/30 p-4 shadow-lg flex flex-col gap-3 font-sans relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary">
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-semibold text-sm">ShipFlow AI Insight</span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground">
                    Good job adding the null check for the signature header. However, consider logging this failure to your monitoring stack (e.g. Sentry or Datadog) to track potential webhook probing attacks.
                  </p>
                  <Separator className="bg-border/50" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground mr-2">Was this helpful?</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6"><ThumbsUp className="w-3 h-3 text-muted-foreground" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6"><ThumbsDown className="w-3 h-3 text-muted-foreground" /></Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Unchanged */}
          <div className="table-row hover:bg-white/5">
            <div className="table-cell select-none border-r border-white/10 px-2 py-0.5 text-right text-white/30 w-12">44</div>
            <div className="table-cell select-none border-r border-white/10 px-2 py-0.5 text-right text-white/30 w-12">45</div>
            <div className="table-cell px-4 py-0.5 whitespace-pre">  </div>
          </div>
        </div>
      </div>
    </div>
  )
}
