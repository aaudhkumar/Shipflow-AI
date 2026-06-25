"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, CartesianGrid } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

interface SecurityTrendsChartProps {
  data: { date: string; blocking: number; nonBlocking: number }[];
}

export function SecurityTrendsChart({ data }: SecurityTrendsChartProps) {
  const totalFindings = data.reduce((acc, curr) => acc + curr.blocking + curr.nonBlocking, 0);

  return (
    <Card className="border-border/40 shadow-sm bg-card/60 backdrop-blur-xl h-full">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              Security Finding Trends
            </CardTitle>
            <CardDescription>Blocking vs Non-blocking findings over time</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{totalFindings}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Findings</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {totalFindings === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground flex-col gap-2">
            <ShieldAlert className="w-8 h-8 opacity-20" />
            <span>No security findings in this period</span>
          </div>
        ) : (
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
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
                  itemStyle={{ fontWeight: 500 }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                />
                <Legend 
                  iconType="circle" 
                  wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} 
                />
                <Bar dataKey="blocking" name="Blocking" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} barSize={32} />
                <Bar dataKey="nonBlocking" name="Non-blocking" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
