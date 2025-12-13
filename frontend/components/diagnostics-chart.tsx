"use client"

import { BentoCard } from "./bento-card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface DiagnosticsChartProps {
  data?: Array<{
    month: string
    analyses: number
    predictions: number
  }>
}

export function DiagnosticsChart({ data = [] }: DiagnosticsChartProps) {
  // Convert to chart-friendly format
  const chartData = data.map(d => ({
    month: d.month,
    scans: d.analyses,
    diagnoses: d.predictions
  }))

  const hasData = chartData.length > 0 && chartData.some(d => d.scans > 0 || d.diagnoses > 0)

  return (
    <BentoCard size="lg" className="h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">Diagnostic Performance</h3>
          <p className="text-sm text-muted-foreground mt-1">Scans vs successful diagnoses</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Scans</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-xs text-muted-foreground">Predictions</span>
          </div>
        </div>
      </div>

      <div className="h-[280px]">
        {!hasData ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p>No diagnostic data yet.</p>
              <p className="text-sm mt-2">Run analyses to see performance here.</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="scansGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="diagnosesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--success)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} vertical={false} />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  color: "var(--card-foreground)",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                }}
              />
              <Area
                type="monotone"
                dataKey="scans"
                name="Total Scans"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#scansGradient)"
              />
              <Area
                type="monotone"
                dataKey="diagnoses"
                name="Predictions"
                stroke="var(--success)"
                strokeWidth={2}
                fill="url(#diagnosesGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </BentoCard>
  )
}
