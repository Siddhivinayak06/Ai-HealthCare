import { ReportsList } from "@/components/reports-list"
import { getReports } from "@/app/actions/reports"
import { getSession } from "@/lib/auth"
import { getRecentAnalyses } from "@/app/actions/analyses"
import { FileText, Activity, CheckCircle, Clock, History, Scan } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'

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

export default async function ReportsPage() {
  const reports = await getReports()
  const { user } = await getSession()
  const recentAnalyses = await getRecentAnalyses()

  const completedReports = reports.filter(r => r.status === 'completed').length
  const pendingReports = reports.filter(r => r.status === 'pending').length

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects - Theme aware */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.03] pointer-events-none" />
      {/* Ambient Background Drift */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-[0.03] animate-drift-slow bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500" />

      <div className="relative p-4 lg:px-6 pt-16 lg:pt-6 space-y-6 w-full">
        {/* Compact Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg">
              <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                Reports & Registry
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Documents and scan history
              </p>
            </div>
          </div>
        </div>

        {/* Compact Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: reports.length, icon: FileText, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-500/15", border: "border-violet-200/50 dark:border-violet-500/20" },
            { label: "Ready", value: completedReports, icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/15", border: "border-emerald-200/50 dark:border-emerald-500/20" },
            { label: "Pending", value: pendingReports, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/15", border: "border-amber-200/50 dark:border-amber-500/20" },
          ].map((stat, i) => (
            <div
              key={i}
              className={cn(
                "bento-cell flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700",
                "bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/5 rounded-2xl p-4 shadow-sm"
              )}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={cn("p-2.5 rounded-xl shadow-inner", stat.bg, stat.color)}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold leading-tight">{stat.label}</p>
                <p className="text-xl font-bold leading-none mt-1">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Reports List - Main Column */}
          <div className="xl:col-span-8 space-y-4">
            <div className="hospital-card p-0 shadow-sm border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-card/40">
              <ReportsList initialReports={reports} userRole={user?.role || "patient"} />
            </div>
          </div>

          {/* Full Registry - Sidebar */}
          <div className="xl:col-span-4 space-y-4">
            <div className="hospital-card p-0 shadow-sm border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-card/40">
              <div className="p-4 border-b border-border/10 bg-white/50 dark:bg-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-muted-foreground">
                    <History className="h-3.5 w-3.5 text-cyan-500" />
                    Full Scan Registry
                  </h3>
                </div>
                <div className="h-7 w-7 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Scan className="h-3.5 w-3.5 text-cyan-500" />
                </div>
              </div>

              <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
                {recentAnalyses.length > 0 ? (
                  recentAnalyses.map((item: any, i: number) => (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between p-3 rounded-2xl bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-white/10 hover:shadow-sm animate-in fade-in slide-in-from-right-4 fill-mode-backwards"
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
                          <span className="text-[9px] text-muted-foreground truncate max-w-[100px]">{item.patientName || "Anonymous"}</span>
                          <span className="h-0.5 w-0.5 rounded-full bg-slate-300 dark:bg-border" />
                          <span className="text-[9px] text-muted-foreground/70">{formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 flex flex-col items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-muted/50 flex items-center justify-center">
                      <History className="h-5 w-5 text-slate-400 dark:text-muted-foreground/50" />
                    </div>
                    <p className="text-[10px] font-semibold text-muted-foreground">No scans in registry</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

