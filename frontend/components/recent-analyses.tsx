import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getRecentAnalyses } from "@/app/actions/analyses"
import { BentoCard } from "./bento-card"
import { ScanIcon, CheckCircleIcon, ClockIcon } from "./icons"

interface Analysis {
  id: string
  patientName: string
  type: string
  status: "completed" | "processing" | "pending"
  confidence: number
  severity: "normal" | "low" | "moderate" | "high" | "critical"
  finding: string
  timestamp: string
}

function formatTime(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export async function RecentAnalyses() {
  const analyses = await getRecentAnalyses(5)

  const displayAnalyses: Analysis[] =
    analyses.length > 0
      ? analyses.map((a) => ({
        id: a.id,
        patientName: a.patientName || "Unknown Patient",
        type: a.scanType || "Scan",
        status: (a.status as "completed" | "processing" | "pending") || "completed",
        confidence: a.confidence || 0,
        severity: (a.severity?.toLowerCase() as any) || "normal",
        finding: a.diagnosis || "Analysis complete",
        timestamp: formatTime(a.createdAt),
      }))
      : [
        {
          id: "1",
          patientName: "Sarah Johnson",
          type: "Chest X-Ray",
          status: "completed" as const,
          confidence: 94,
          severity: "normal" as const,
          finding: "No abnormalities detected",
          timestamp: "2m ago",
        },
        {
          id: "2",
          patientName: "Michael Chen",
          type: "Brain MRI",
          status: "completed" as const,
          confidence: 87,
          severity: "moderate" as const,
          finding: "Minor calcification noted",
          timestamp: "15m ago",
        },
        {
          id: "3",
          patientName: "Emily Davis",
          type: "CT Scan",
          status: "processing" as const,
          confidence: 0,
          severity: "low" as const,
          finding: "Processing...",
          timestamp: "23m ago",
        },
        {
          id: "4",
          patientName: "James Wilson",
          type: "X-Ray",
          status: "completed" as const,
          confidence: 91,
          severity: "high" as const,
          finding: "No significant findings",
          timestamp: "1h ago",
        },
      ]

  return (
    <div className="health-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="icon-container icon-container-success h-10 w-10">
            <ScanIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Recent Analyses</h3>
            <p className="text-sm text-muted-foreground">Latest diagnostic results</p>
          </div>
        </div>
        <Badge className="bg-gradient-to-r from-primary/20 to-violet-500/20 text-primary border-primary/30 font-semibold px-3 py-1">
          {displayAnalyses.length} new
        </Badge>
      </div>

      <div className="space-y-3">
        {displayAnalyses.map((analysis, index) => (
          <div
            key={analysis.id}
            className={cn(
              "group flex items-center gap-4 p-4 rounded-xl transition-all duration-300 cursor-pointer border-l-4",
              "bg-secondary/20 hover:bg-secondary/40 border border-border/30 hover:border-border/50",
              analysis.status === "completed" && (analysis.severity === "high" || analysis.severity === "critical")
                ? "border-l-rose-500"
                : analysis.status === "completed" && analysis.severity === "moderate"
                  ? "border-l-amber-500"
                  : analysis.status === "processing"
                    ? "border-l-violet-500"
                    : "border-l-emerald-500"
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all group-hover:scale-105",
                analysis.status === "completed" && "bg-emerald-500/10 text-emerald-500",
                analysis.status === "processing" && "bg-violet-500/10 text-violet-500",
                analysis.status === "pending" && "bg-muted text-muted-foreground",
              )}
            >
              {analysis.status === "completed" ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : analysis.status === "processing" ? (
                <ClockIcon className="h-5 w-5 animate-pulse" />
              ) : (
                <ScanIcon className="h-5 w-5" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-card-foreground truncate group-hover:text-primary transition-colors">{analysis.patientName}</p>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] h-5 px-2 font-bold border-none",
                    analysis.status === "processing" ? "bg-violet-500/10 text-violet-400" :
                      (analysis.severity === "high" || analysis.severity === "critical") ? "bg-rose-500/15 text-rose-500" :
                        (analysis.severity === "moderate") ? "bg-amber-500/15 text-amber-500" :
                          "bg-emerald-500/15 text-emerald-500"
                  )}
                >
                  {analysis.status === "processing" ? "⏳ Processing" :
                    (analysis.severity === "high" || analysis.severity === "critical") ? "🔴 Critical" :
                      (analysis.severity === "moderate") ? "🟠 Moderate" : "🟢 Normal"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground font-medium">{analysis.type}</span>
                <span className="text-xs text-muted-foreground/50">•</span>
                <p className="text-sm text-muted-foreground truncate">{analysis.finding}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="text-right shrink-0">
              {analysis.confidence > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all duration-500"
                      style={{ width: `${analysis.confidence}%` }}
                    />
                  </div>
                  <p className="text-sm font-bold text-primary">{analysis.confidence}%</p>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">{analysis.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
