"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface ReviewTimeChartProps {
  data: { severity: string; avgHours: number }[];
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "BLOCKER": return "#ef4444"; // red-500
    case "MAJOR": return "#f97316"; // orange-500
    case "MINOR": return "#eab308"; // yellow-500
    case "SUGGESTION": return "#64748b"; // slate-500
    default: return "#64748b";
  }
};

export function ReviewTimeChart({ data }: ReviewTimeChartProps) {
  return (
    <Card className="border-border/40 shadow-sm bg-card/60 backdrop-blur-xl h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Clock className="w-5 h-5 text-amber-600" />
          Review Duration by Severity
        </CardTitle>
        <CardDescription>Average time to address findings (hours)</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            <span>No severity data available</span>
          </div>
        ) : (
          <div className="h-[250px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <XAxis 
                  type="number" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                  unit="h"
                />
                <YAxis 
                  dataKey="severity" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 500, fill: "hsl(var(--foreground))" }}
                  width={80}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                  formatter={(value: number) => [`${value} hours`, "Avg Duration"]}
                  labelStyle={{ display: "none" }}
                />
                <Bar dataKey="avgHours" radius={[0, 4, 4, 0]} barSize={24}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSeverityColor(entry.severity)} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
