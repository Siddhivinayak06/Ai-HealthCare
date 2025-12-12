"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const riskData = [
  { month: "Jul", low: 45, moderate: 30, high: 15, critical: 10 },
  { month: "Aug", low: 48, moderate: 28, high: 14, critical: 10 },
  { month: "Sep", low: 52, moderate: 26, high: 13, critical: 9 },
  { month: "Oct", low: 55, moderate: 25, high: 12, critical: 8 },
  { month: "Nov", low: 58, moderate: 24, high: 11, critical: 7 },
  { month: "Dec", low: 60, moderate: 23, high: 10, critical: 7 },
]

export function RiskDistribution() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Risk Distribution Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={riskData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--card-foreground)",
                }}
                formatter={(value: number, name: string) => [`${value}%`, name.charAt(0).toUpperCase() + name.slice(1)]}
              />
              <Area
                type="monotone"
                dataKey="low"
                stackId="1"
                stroke="var(--success)"
                fill="var(--success)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="moderate"
                stackId="1"
                stroke="var(--warning)"
                fill="var(--warning)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="high"
                stackId="1"
                stroke="var(--chart-4)"
                fill="var(--chart-4)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="critical"
                stackId="1"
                stroke="var(--destructive)"
                fill="var(--destructive)"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-sm text-muted-foreground">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-sm text-muted-foreground">Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-chart-4" />
            <span className="text-sm text-muted-foreground">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-sm text-muted-foreground">Critical</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
