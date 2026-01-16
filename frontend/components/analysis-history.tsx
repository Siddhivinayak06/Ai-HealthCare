"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Clock, History, Activity, ChevronRight, ExternalLink } from "lucide-react"
import Link from "next/link"

interface AnalysisHistoryProps {
  analyses?: any[]
  maxItems?: number
}

function formatDate(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return `Today, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
  } else if (days === 1) {
    return "Yesterday"
  } else if (days < 7) {
    return `${days}d ago`
  } else {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
}

export function AnalysisHistory({ analyses = [], maxItems = 4 }: AnalysisHistoryProps) {
  const [showAll, setShowAll] = useState(false)

  // Limit displayed items based on state
  const displayData = showAll ? analyses : analyses.slice(0, maxItems)
  const hasMore = analyses.length > maxItems

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card/50 dark:bg-card/30 overflow-hidden transition-all duration-500">
      <div className="p-3 border-b border-slate-200/50 dark:border-white/5 bg-gradient-to-r from-cyan-500/5 to-transparent flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <History className="h-3.5 w-3.5 text-cyan-500" />
            Registry
          </h3>
          <p className="text-[9px] text-muted-foreground">Recent scans</p>
        </div>
        <div className="h-7 w-7 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          <Activity className="h-3.5 w-3.5 text-cyan-500" />
        </div>
      </div>

      <div className={cn("p-2 space-y-1.5 overflow-y-auto transition-all duration-500", showAll ? "max-h-[600px]" : "max-h-[280px]")}>
        {displayData.map((item, i) => (
          <div
            key={item.id}
            className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-white/10 animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-slate-500 dark:text-muted-foreground uppercase">
                  {item.scanType?.toUpperCase()}
                </span>
                <Badge
                  className={cn(
                    "text-[8px] px-1.5 py-0 rounded-full border-none font-bold uppercase h-4",
                    item.severity?.toLowerCase() === "normal" && "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                    item.severity?.toLowerCase() === "low" && "bg-cyan-100 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
                    item.severity?.toLowerCase() === "medium" && "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400",
                    item.severity?.toLowerCase() === "high" && "bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400",
                    item.severity?.toLowerCase() === "critical" && "bg-rose-200 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400",
                  )}
                >
                  {item.severity}
                </Badge>
              </div>
              <p className="text-xs font-semibold truncate leading-none text-foreground">
                {item.diagnosis}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-muted-foreground truncate max-w-[80px]">{item.patientName || "Anonymous"}</span>
                <span className="h-0.5 w-0.5 rounded-full bg-slate-300 dark:bg-border" />
                <span className="text-[9px] text-muted-foreground/70">{formatDate(item.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}

        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors bg-violet-50 dark:bg-violet-500/10 rounded-xl mt-2"
          >
            <span>{showAll ? "Show Less" : `View all ${analyses.length} records`}</span>
            <ChevronRight className={cn("h-3 w-3 transition-transform duration-300", showAll && "rotate-90")} />
          </button>
        )}

        {analyses.length === 0 && (
          <div className="text-center py-8 flex flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-muted/50 flex items-center justify-center">
              <History className="h-5 w-5 text-slate-400 dark:text-muted-foreground/50" />
            </div>
            <p className="text-[10px] font-semibold text-muted-foreground">No scans yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

