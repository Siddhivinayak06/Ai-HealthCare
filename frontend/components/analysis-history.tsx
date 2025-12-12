"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { BentoCard } from "./bento-card"
import type { AnalysisResult } from "./analysis-results"
import { ClockIcon } from "./icons"

interface AnalysisHistoryProps {
  analyses?: AnalysisResult[]
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
            severity: "normal" as const,
            confidence: 94,
            patientName: "John D.",
            createdAt: new Date(),
          },
          {
            id: "2",
            scanType: "Brain MRI",
            diagnosis: "Minor calcification noted",
            severity: "low" as const,
            confidence: 89,
            patientName: "Sarah M.",
            createdAt: new Date(Date.now() - 86400000),
          },
          {
            id: "3",
            scanType: "CT Scan",
            diagnosis: "Normal findings",
            severity: "normal" as const,
            confidence: 92,
            patientName: "Mike R.",
            createdAt: new Date(Date.now() - 172800000),
          },
        ]

  return (
    <BentoCard className="h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">Analysis History</h3>
          <p className="text-sm text-muted-foreground mt-1">Recent diagnostic results</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/50">
          <ClockIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-3">
        {displayData.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all duration-200 cursor-pointer border border-transparent hover:border-border/50"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-card-foreground">{item.scanType}</p>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs font-medium",
                    item.severity === "normal" && "bg-success/10 text-success border-success/20",
                    item.severity === "low" && "bg-primary/10 text-primary border-primary/20",
                    item.severity === "moderate" && "bg-warning/10 text-warning border-warning/20",
                    item.severity === "high" && "bg-destructive/10 text-destructive border-destructive/20",
                  )}
                >
                  {item.severity}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">{item.diagnosis}</p>
            </div>
            <div className="text-right ml-3">
              {item.patientName && <p className="text-xs font-medium text-card-foreground">{item.patientName}</p>}
              <p className="text-xs text-muted-foreground">{item.createdAt ? formatDate(item.createdAt) : "Recent"}</p>
            </div>
          </div>
        ))}

        {analyses.length === 0 && displayData.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No analyses yet</p>
            <p className="text-xs text-muted-foreground mt-1">Upload an image to get started</p>
          </div>
        )}
      </div>
    </BentoCard>
  )
}
