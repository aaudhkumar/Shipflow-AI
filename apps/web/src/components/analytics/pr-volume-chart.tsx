"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Activity } from "lucide-react";

interface PRVolumeChartProps {
  data: { date: string; analyses: number }[];
}

export function PRVolumeChart({ data }: PRVolumeChartProps) {
  const total = data.reduce((acc, curr) => acc + curr.analyses, 0);
  const maxDay = data.reduce((max, curr) => curr.analyses > max.analyses ? curr : max, { date: "", analyses: -1 });

  return (
    <Card className="border-border/40 shadow-sm bg-card/60 backdrop-blur-xl h-full">
      <CardHeader className="pb-4 flex flex-row items-start justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Activity className="w-5 h-5 text-teal-600" />
            Analysis Volume
          </CardTitle>
          <CardDescription>Automated PR reviews over time</CardDescription>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold tracking-tighter">{total}</div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</div>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground flex-col gap-2">
            <Activity className="w-8 h-8 opacity-20" />
            <span>No analysis data for this period</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/40 w-fit px-3 py-1.5 rounded-md border border-border/40">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Peak day: <span className="font-semibold text-foreground">{maxDay.date}</span> ({maxDay.analyses} reviews)
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAnalyses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                    itemStyle={{ color: "hsl(var(--foreground))", fontWeight: 500 }}
                    labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}
                    cursor={{ stroke: "hsl(var(--muted))", strokeWidth: 1, strokeDasharray: "4 4" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="analyses"
                    stroke="#0d9488"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAnalyses)"
                    activeDot={{ r: 4, strokeWidth: 0, fill: "#0d9488" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
