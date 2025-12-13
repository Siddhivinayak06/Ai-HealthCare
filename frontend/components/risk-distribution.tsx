"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface RiskDistributionProps {
  data?: Array<{
    month: string
    low: number
    moderate: number
    high: number
    critical: number
  }>
}

export function RiskDistribution({ data = [] }: RiskDistributionProps) {
  // Check if we have any data with values > 0
  const hasData = data.some(d => d.low > 0 || d.moderate > 0 || d.high > 0 || d.critical > 0)

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Risk Distribution Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p>No risk predictions yet.</p>
              <p className="text-sm mt-2">Run risk assessments to see distribution here.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
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
                    formatter={(value: number, name: string) => [`${value}`, name.charAt(0).toUpperCase() + name.slice(1)]}
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
          </>
        )}
      </CardContent>
    </Card>
  )
}

