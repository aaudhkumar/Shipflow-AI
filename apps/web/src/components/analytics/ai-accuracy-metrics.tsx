"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface AiAccuracyMetricsProps {
  data: {
    truePositives: number;
    falsePositives: number;
    open: number;
    total: number;
    accuracyRate: number;
  };
}

export function AiAccuracyMetrics({ data }: AiAccuracyMetricsProps) {
  const chartData = [
    { name: "Addressed (True Positive)", value: data.truePositives, color: "#059669" }, // emerald-600
    { name: "Ignored (False Positive)", value: data.falsePositives, color: "#64748b" }, // slate-500
    { name: "Unmarked", value: data.open, color: "#d97706" }, // amber-600
  ].filter(d => d.value > 0);

  const percentage = data.open > 0 ? Math.round((data.truePositives / data.open) * 100) : 0;

  return (
    <Card className="border-border/40 shadow-sm bg-card/60 backdrop-blur-xl h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <BrainCircuit className="w-5 h-5 text-indigo-600" />
              AI Review Accuracy
            </CardTitle>
            <CardDescription>Quality of automated review findings</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col sm:flex-row items-center gap-6 pt-4">
        {data.total === 0 ? (
          <div className="w-full h-[200px] flex items-center justify-center text-muted-foreground flex-col gap-2">
            <BrainCircuit className="w-8 h-8 opacity-20" />
            <span>No AI review data available</span>
          </div>
        ) : (
          <>
            <div className="w-[160px] h-[160px] relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                    itemStyle={{ color: "var(--foreground)", fontWeight: 500 }}
                  />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold tracking-tighter">{percentage}%</span>
                <span className="text-[10px] uppercase text-muted-foreground font-medium tracking-wider">Useful</span>
              </div>
            </div>
            
            <div className="flex-1 w-full space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium">True Positives</span>
                </div>
                <span className="font-bold">{data.truePositives}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-500/20 bg-slate-500/5">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium">False Positives</span>
                </div>
                <span className="font-bold">{data.falsePositives}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium">Unmarked</span>
                </div>
                <span className="font-bold">{data.open}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
