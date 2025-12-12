import type React from "react"
import { cn } from "@/lib/utils"
import { BentoCard } from "./bento-card"

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon: React.ComponentType<{ className?: string }>
  description?: string
  className?: string
}

export function StatCard({ title, value, change, changeType = "neutral", icon: Icon, className }: StatCardProps) {
  return (
    <BentoCard className={cn("group", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 group-hover:bg-primary/15 group-hover:ring-primary/30 transition-all duration-300">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
          </div>

          <p className="text-4xl font-bold tracking-tight text-card-foreground">{value}</p>

          {change && (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full",
                  changeType === "positive" && "bg-success/10 text-success",
                  changeType === "negative" && "bg-destructive/10 text-destructive",
                  changeType === "neutral" && "bg-muted text-muted-foreground",
                )}
              >
                {changeType === "positive" && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
                {changeType === "negative" && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                {change}
              </span>
            </div>
          )}
        </div>
      </div>
    </BentoCard>
  )
}
