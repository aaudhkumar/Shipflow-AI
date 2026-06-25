"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, CalendarDays } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface FeatureTimelineProps {
  data: { id: string; title: string; durationDays: number; shippedAt: Date | string }[];
}

export function FeatureTimeline({ data }: FeatureTimelineProps) {
  const avgDuration = data.length > 0 ? Math.round(data.reduce((acc, curr) => acc + curr.durationDays, 0) / data.length) : 0;

  return (
    <Card className="border-border/40 shadow-sm bg-card/60 backdrop-blur-xl h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Rocket className="w-5 h-5 text-indigo-500" />
              Feature-to-Ship Timeline
            </CardTitle>
            <CardDescription>Recently shipped features and their lead times</CardDescription>
          </div>
          {data.length > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold">{avgDuration}d</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Avg Lead Time</div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 px-6 pb-6">
        {data.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground flex-col gap-2">
            <CalendarDays className="w-8 h-8 opacity-20" />
            <span>No shipped features in this period</span>
          </div>
        ) : (
          <ScrollArea className="h-[250px] pr-4">
            <div className="space-y-4">
              {data.map((feature, i) => (
                <div key={feature.id} className="relative pl-6 pb-4 last:pb-0">
                  {/* Timeline connecting line */}
                  {i !== data.length - 1 && (
                    <div className="absolute left-[9px] top-5 bottom-[-10px] w-px bg-border/50" />
                  )}
                  {/* Timeline dot */}
                  <div className="absolute left-1.5 top-1.5 w-2 h-2 rounded-full bg-indigo-400 ring-4 ring-background" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-border/40 bg-muted/20 rounded-lg p-3 hover:bg-muted/30 transition-colors">
                    <div>
                      <h4 className="text-sm font-medium leading-none mb-1">{feature.title}</h4>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        Shipped on {format(new Date(feature.shippedAt), "MMM d, yyyy")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`text-xs px-2 py-1 rounded-md font-medium ${
                        feature.durationDays <= 3 ? "bg-emerald-500/10 text-emerald-600" :
                        feature.durationDays <= 7 ? "bg-amber-500/10 text-amber-600" :
                        "bg-rose-500/10 text-rose-600"
                      }`}>
                        {feature.durationDays} days
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
