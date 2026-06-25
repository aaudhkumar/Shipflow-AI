"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProductivityHeatmapProps {
  data: { date: string; count: number }[];
}

export function ProductivityHeatmap({ data }: ProductivityHeatmapProps) {
  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  // Determine intensity classes
  const getIntensityClass = (count: number) => {
    if (count === 0) return "bg-muted/30 border-border/40";
    if (count <= 2) return "bg-blue-200 dark:bg-blue-900/40 border-blue-300 dark:border-blue-800";
    if (count <= 5) return "bg-blue-400 dark:bg-blue-700/60 border-blue-500 dark:border-blue-600";
    if (count <= 10) return "bg-blue-600 dark:bg-blue-600 border-blue-700 dark:border-blue-500";
    return "bg-blue-800 dark:bg-blue-400 border-blue-900 dark:border-blue-300";
  };

  return (
    <Card className="border-border/40 shadow-sm bg-card/60 backdrop-blur-xl h-full">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Users className="w-5 h-5 text-blue-600" />
              Team Productivity Heatmap
            </CardTitle>
            <CardDescription>Daily PR and review throughput</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Actions</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[150px] flex items-center justify-center text-muted-foreground">
            <span>No activity data available</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5 p-4 rounded-xl border border-border/40 bg-muted/10">
              <TooltipProvider delayDuration={100}>
                {data.map((day, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div 
                        className={`w-6 h-6 rounded-sm border ${getIntensityClass(day.count)} transition-all hover:ring-2 hover:ring-foreground/20 cursor-pointer`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs font-medium">
                      {day.count} activities on {day.date}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
            
            <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm border bg-muted/30 border-border/40" />
                <div className="w-3 h-3 rounded-sm border bg-blue-200 dark:bg-blue-900/40 border-blue-300 dark:border-blue-800" />
                <div className="w-3 h-3 rounded-sm border bg-blue-400 dark:bg-blue-700/60 border-blue-500 dark:border-blue-600" />
                <div className="w-3 h-3 rounded-sm border bg-blue-600 dark:bg-blue-600 border-blue-700 dark:border-blue-500" />
                <div className="w-3 h-3 rounded-sm border bg-blue-800 dark:bg-blue-400 border-blue-900 dark:border-blue-300" />
              </div>
              <span>More</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
