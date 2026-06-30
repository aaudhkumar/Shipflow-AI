"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SourceChannelChartProps {
  data: {
    name: string;
    value: number;
    fill: string;
  }[];
}

export function SourceChannelChart({ data = [] }: SourceChannelChartProps) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Card className="border-border/40 shadow-sm bg-card/60 backdrop-blur-xl h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              Source Channel Intake
            </CardTitle>
            <CardDescription>Where your feature requests are coming from</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Requests</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1">
        {total === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm flex-col gap-2">
            <Info className="w-8 h-8 opacity-20" />
            <span>No features found</span>
          </div>
        ) : (
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--muted)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} 
                />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", backgroundColor: "var(--card)" }}
                  itemStyle={{ fontWeight: 500 }}
                  labelStyle={{ color: "var(--muted-foreground)", marginBottom: "4px" }}
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
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
