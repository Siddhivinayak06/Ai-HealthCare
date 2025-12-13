"use client"

import { BentoCard } from "./bento-card"

interface Condition {
  condition: string
  count: number
  percentage: number
  color: string
}

interface ConditionBreakdownProps {
  data?: Condition[]
  totalAnalyses?: number
}

const colorMap: Record<string, string> = {
  "hsl(var(--primary))": "bg-primary",
  "hsl(var(--chart-2))": "bg-chart-2",
  "hsl(var(--chart-3))": "bg-chart-3",
  "hsl(var(--chart-4))": "bg-chart-4",
  "hsl(var(--chart-5))": "bg-chart-5",
}

export function ConditionBreakdown({ data = [], totalAnalyses = 0 }: ConditionBreakdownProps) {
  // Map colors to Tailwind classes
  const conditions = data.map((d, idx) => ({
    name: d.condition || "Unknown",
    value: d.percentage,
    color: colorMap[d.color] || ["bg-success", "bg-primary", "bg-warning", "bg-chart-5", "bg-muted-foreground"][idx] || "bg-muted"
  }))

  return (
    <BentoCard className="h-full">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">Condition Breakdown</h3>
        <p className="text-sm text-muted-foreground mt-1">Distribution by scan type</p>
      </div>

      {conditions.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-center">
          <div>
            <p>No conditions yet.</p>
            <p className="text-sm mt-2">Run analyses to see breakdown here.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {conditions.map((condition) => (
            <div key={condition.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-card-foreground">{condition.name}</span>
                <span className="text-sm font-bold text-muted-foreground">{condition.value}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full ${condition.color} rounded-full transition-all duration-500`}
                  style={{ width: `${condition.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total analyses</span>
          <span className="text-2xl font-bold text-card-foreground">{totalAnalyses.toLocaleString()}</span>
        </div>
      </div>
    </BentoCard>
  )
}

