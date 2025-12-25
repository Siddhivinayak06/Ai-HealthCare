"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Clock, History, Activity, ChevronRight } from "lucide-react"

interface AnalysisHistoryProps {
  analyses?: any[]
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
    return `${days} days ago`
  } else {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
}

export function AnalysisHistory({ analyses = [] }: AnalysisHistoryProps) {
  const displayData = analyses;

  return (
    <div className="health-card overflow-hidden">
      <div className="p-5 border-b border-border/30 bg-gradient-to-r from-cyan-500/5 to-transparent flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <History className="h-4 w-4 text-cyan-400" />
            Registry
          </h3>
          <p className="text-[10px] text-muted-foreground font-medium">Historical clinical logs</p>
        </div>
        <div className="h-9 w-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
          <Activity className="h-4 w-4 text-cyan-400" />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {displayData.map((item) => (
          <div
            key={item.id}
            className="group flex items-center justify-between p-4 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-all duration-300 cursor-pointer border border-border/20 hover:border-primary/30"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {item.scanType?.toUpperCase()}
                </span>
                <Badge
                  className={cn(
                    "text-[9px] px-2 py-0.5 rounded-full border-none font-bold uppercase tracking-wide",
                    item.severity?.toLowerCase() === "normal" && "bg-emerald-500/15 text-emerald-400",
                    item.severity?.toLowerCase() === "low" && "bg-cyan-500/15 text-cyan-400",
                    item.severity?.toLowerCase() === "medium" && "bg-amber-500/15 text-amber-400",
                    item.severity?.toLowerCase() === "high" && "bg-rose-500/15 text-rose-400",
                    item.severity?.toLowerCase() === "critical" && "bg-rose-500/20 text-rose-400",
                  )}
                >
                  {item.severity}
                </Badge>
              </div>
              <p className="text-sm font-semibold truncate leading-none group-hover:text-primary transition-colors">
                {item.diagnosis}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-medium">{item.patientName || "Anonymous"}</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className="text-[10px] text-muted-foreground/70 font-medium">{formatDate(item.createdAt)}</span>
              </div>
            </div>
            <div className="ml-4 translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
              <ChevronRight className="h-4 w-4 text-primary" />
            </div>
          </div>
        ))}

        {analyses.length === 0 && displayData.length === 0 && (
          <div className="text-center py-12 flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center">
              <History className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No Logs Found</p>
          </div>
        )}
      </div>
    </div>
  )
}
