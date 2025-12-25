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
  const displayData =
    analyses.length > 0
      ? analyses
      : [
        {
          id: "1",
          scanType: "Chest X-Ray",
          diagnosis: "No abnormalities detected",
          severity: "Normal",
          confidence: 94,
          patientName: "John Doe",
          createdAt: new Date(),
        },
        {
          id: "2",
          scanType: "Brain MRI",
          diagnosis: "Minor calcification noted",
          severity: "Low",
          confidence: 89,
          patientName: "Sarah Miller",
          createdAt: new Date(Date.now() - 86400000),
        },
      ]

  return (
    <div className="glass-panel rounded-3xl overflow-hidden border-white/5 bg-white/[0.02]">
      <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <History className="h-4 w-4 text-violet-400" />
            Registry
          </h3>
          <p className="text-[10px] text-slate-500 font-medium">Historical clinical logs</p>
        </div>
        <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
          <Activity className="h-4 w-4 text-slate-500" />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {displayData.map((item) => (
          <div
            key={item.id}
            className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all duration-300 cursor-pointer border border-white/5 hover:border-violet-500/30"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                  {item.scanType?.toUpperCase()}
                </span>
                <Badge
                  className={cn(
                    "text-[8px] px-1.5 py-0 rounded-full border-none font-bold uppercase tracking-widest",
                    item.severity?.toLowerCase() === "normal" && "bg-emerald-500/20 text-emerald-400",
                    item.severity?.toLowerCase() === "low" && "bg-cyan-500/20 text-cyan-400",
                    item.severity?.toLowerCase() === "medium" && "bg-amber-500/20 text-amber-400",
                    item.severity?.toLowerCase() === "high" && "bg-rose-500/20 text-rose-400",
                    item.severity?.toLowerCase() === "critical" && "bg-rose-600 text-white",
                  )}
                >
                  {item.severity}
                </Badge>
              </div>
              <p className="text-xs font-bold text-white truncate leading-none">
                {item.diagnosis}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-medium">{item.patientName || "Anonymous"}</span>
                <span className="h-1 w-1 rounded-full bg-slate-700" />
                <span className="text-[10px] text-slate-600 font-medium">{formatDate(item.createdAt)}</span>
              </div>
            </div>
            <div className="ml-4 translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
              <ChevronRight className="h-4 w-4 text-violet-400" />
            </div>
          </div>
        ))}

        {analyses.length === 0 && displayData.length === 0 && (
          <div className="text-center py-10 opacity-20 flex flex-col items-center gap-3">
            <History className="h-10 w-10 text-slate-400" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Logs Found</p>
          </div>
        )}
      </div>
    </div>
  )
}
