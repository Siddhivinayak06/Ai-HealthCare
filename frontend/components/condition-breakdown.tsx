"use client"

import { BentoCard } from "./bento-card"

const conditions = [
  { name: "Normal", value: 45, color: "bg-success" },
  { name: "Respiratory", value: 20, color: "bg-primary" },
  { name: "Cardiac", value: 15, color: "bg-warning" },
  { name: "Musculoskeletal", value: 12, color: "bg-chart-5" },
  { name: "Other", value: 8, color: "bg-muted-foreground" },
]

export function ConditionBreakdown() {
  return (
    <BentoCard className="h-full">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">Condition Breakdown</h3>
        <p className="text-sm text-muted-foreground mt-1">Distribution by diagnosis type</p>
      </div>

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

      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total analyses</span>
          <span className="text-2xl font-bold text-card-foreground">1,847</span>
        </div>
      </div>
    </BentoCard>
  )
}
