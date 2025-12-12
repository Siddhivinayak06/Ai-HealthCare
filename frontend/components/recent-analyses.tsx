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
          patientName:
            (a as { first_name?: string; last_name?: string }).first_name &&
            (a as { first_name?: string; last_name?: string }).last_name
              ? `${(a as { first_name?: string }).first_name} ${(a as { last_name?: string }).last_name}`
              : "Unknown Patient",
          type: a.scan_type,
          status: (a.status as "completed" | "processing" | "pending") || "completed",
          confidence: a.confidence || 0,
          finding: a.diagnosis || "Analysis complete",
          timestamp: formatTime(a.created_at),
        }))
      : [
          {
            id: "1",
            patientName: "Sarah Johnson",
            type: "Chest X-Ray",
            status: "completed" as const,
            confidence: 94,
            finding: "No abnormalities detected",
            timestamp: "2m ago",
          },
          {
            id: "2",
            patientName: "Michael Chen",
            type: "Brain MRI",
            status: "completed" as const,
            confidence: 87,
            finding: "Minor calcification noted",
            timestamp: "15m ago",
          },
          {
            id: "3",
            patientName: "Emily Davis",
            type: "CT Scan",
            status: "processing" as const,
            confidence: 0,
            finding: "Processing...",
            timestamp: "23m ago",
          },
          {
            id: "4",
            patientName: "James Wilson",
            type: "X-Ray",
            status: "completed" as const,
            confidence: 91,
            finding: "No significant findings",
            timestamp: "1h ago",
          },
        ]

  return (
    <BentoCard size="lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">Recent Analyses</h3>
          <p className="text-sm text-muted-foreground mt-1">Latest diagnostic results</p>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
          {displayAnalyses.length} new
        </Badge>
      </div>

      <div className="space-y-3">
        {displayAnalyses.map((analysis, index) => (
          <div
            key={analysis.id}
            className={cn(
              "group flex items-center gap-4 p-4 rounded-xl transition-all duration-200 cursor-pointer",
              "bg-secondary/30 hover:bg-secondary/60 border border-transparent hover:border-border/50",
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                analysis.status === "completed" && "bg-success/10 text-success",
                analysis.status === "processing" && "bg-warning/10 text-warning",
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
                <p className="font-semibold text-card-foreground truncate">{analysis.patientName}</p>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{analysis.type}</span>
              </div>
              <p className="text-sm text-muted-foreground truncate mt-0.5">{analysis.finding}</p>
            </div>

            {/* Stats */}
            <div className="text-right shrink-0">
              {analysis.confidence > 0 && <p className="text-sm font-bold text-primary">{analysis.confidence}%</p>}
              <p className="text-xs text-muted-foreground">{analysis.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </BentoCard>
  )
}
