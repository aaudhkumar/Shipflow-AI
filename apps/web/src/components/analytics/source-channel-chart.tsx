"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Info } from "lucide-react";

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
    <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm p-6 h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold tracking-tight">Source Channel Intake</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Where your feature requests are coming from.
          </p>
        </div>
        <div className="p-2 bg-muted/50 rounded-md" title="Total requests across all channels">
          <Info className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
      
      <div className="flex-1 relative">
        {total === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            No features found
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
