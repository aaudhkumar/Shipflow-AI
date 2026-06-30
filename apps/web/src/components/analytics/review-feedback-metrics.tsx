"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Calculator, GitPullRequest } from "lucide-react";

interface ReviewFeedbackMetricsProps {
  data: {
    correct: number;
    incorrect: number;
    unmarked: number;
    total: number;
    approvalRate: number;
  };
}

export function ReviewFeedbackMetrics({ data }: ReviewFeedbackMetricsProps) {
  // We consider "Total" as the sum of rated PRs for this specific metric
  const ratedTotal = data.correct + data.incorrect;
  const percentage = ratedTotal > 0 ? Math.round((data.correct / ratedTotal) * 100) : 0;

  const chartData = [
    { name: "Recommended", value: data.correct, color: "#059669" }, // emerald-600
    { name: "Non Recommended", value: data.incorrect, color: "#ef4444" }, // red-500
  ].filter(d => d.value > 0);

  return (
    <Card className="border-border/40 shadow-sm bg-card/60 backdrop-blur-xl h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <GitPullRequest className="w-5 h-5 text-emerald-600" />
              Quality of PR Generated
            </CardTitle>
            <CardDescription>Ratio of high-quality vs low-quality pull requests</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col sm:flex-row items-center gap-6 pt-4">
        {ratedTotal === 0 ? (
          <div className="w-full h-[200px] flex items-center justify-center text-muted-foreground flex-col gap-2">
            <GitPullRequest className="w-8 h-8 opacity-20" />
            <span>No quality data available</span>
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
                <span className="text-[10px] uppercase text-muted-foreground font-medium tracking-wider">Quality</span>
              </div>
            </div>
            
            <div className="flex-1 w-full space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium">Recommended</span>
                </div>
                <span className="font-bold">{data.correct}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium">Non Recommended</span>
                </div>
                <span className="font-bold">{data.incorrect}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-medium">Total</span>
                </div>
                <span className="font-bold">{ratedTotal}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
