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
    <div className={cn("health-card p-6 group transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-4 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 group-hover:border-primary/40 group-hover:from-primary/20 transition-all duration-500 relative ring-4 ring-primary/5">
              <Icon className="h-6 w-6 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            {change && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ring-1",
                  changeType === "positive" && "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20",
                  changeType === "negative" && "bg-rose-500/10 text-rose-500 ring-rose-500/20",
                  changeType === "neutral" && "bg-slate-500/10 text-slate-500 ring-slate-500/20",
                )}
              >
                {changeType === "positive" && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
                {changeType === "negative" && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                {change}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-4xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors duration-500">
              {value}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
