"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function VolumeChart({ data }: { data: { date: string, count: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
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
          contentStyle={{ 
            backgroundColor: "hsl(var(--card))", 
            borderColor: "hsl(var(--border))",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
          }}
          itemStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorCount)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
