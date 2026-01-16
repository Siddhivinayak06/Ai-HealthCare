import { getSession } from "@/lib/auth"
import { AnalysisClient } from "@/components/analysis-client"
import { getRecentAnalyses, getAnalysisStats } from "@/app/actions/analyses"
import { Scan, Brain, Sparkles, Activity, ShieldCheck, TrendingUp, Zap, Cpu, Server, Gauge } from "lucide-react"

import { cn } from "@/lib/utils"

export default async function AnalysisPage() {
    const { user } = await getSession()
    const recentAnalyses = await getRecentAnalyses(50)
    const stats = await getAnalysisStats()

    // Use specific stats or fallback to calculated if 0 (though 0 is valid)
    // Actually, just use the stats directly.
    const totalScans = stats.total
    const criticalCases = stats.critical
    const normalCases = stats.normal

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Enhanced Background effects - Theme Aware */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.03] pointer-events-none" />
            <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-gradient-to-br from-cyan-500/5 dark:from-cyan-500/10 via-violet-600/4 dark:via-violet-600/8 to-transparent rounded-full blur-[150px] pointer-events-none animate-float" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-violet-600/5 dark:from-violet-600/10 via-fuchsia-600/3 dark:via-fuchsia-600/5 to-transparent rounded-full blur-[150px] pointer-events-none animate-float" style={{ animationDelay: '3s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/[0.02] dark:bg-primary/[0.03] rounded-full blur-[200px] pointer-events-none" />

            <div className="relative p-4 lg:px-6 pt-16 lg:pt-6 space-y-6 w-full">
                {/* Premium Header Section */}
                <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border border-white/20 shadow-2xl bg-white/40 dark:bg-black/20 backdrop-blur-xl transition-all hover:border-white/30">
                    {/* Glass/Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent dark:from-white/5 dark:via-white/2 dark:to-transparent pointer-events-none" />

                    <div className="relative flex items-center gap-5">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-violet-600 to-fuchsia-600 p-[1px] shadow-[0_0_20px_rgba(139,92,246,0.3)] group">
                            <div className="h-full w-full rounded-2xl bg-white dark:bg-black/90 backdrop-blur-md flex items-center justify-center relative overflow-hidden">
                                <Scan className="h-8 w-8 text-transparent bg-clip-text bg-gradient-to-br from-cyan-500 via-violet-600 to-fuchsia-600 group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-fuchsia-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-violet-700 to-slate-900 dark:from-white dark:via-violet-300 dark:to-white drop-shadow-sm">
                                AI Diagnostic Hub
                            </h1>
                            <p className="text-[10px] uppercase tracking-[0.3em] font-mono font-bold text-muted-foreground flex items-center gap-2.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-medical-ripple absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                                </span>
                                Neural Imaging Analysis System
                            </p>
                        </div>
                    </div>

                    {/* Status Badges - Premium Glass Pills */}
                    <div className="relative flex flex-wrap gap-3">
                        <div className="px-4 py-2 rounded-xl flex items-center gap-2.5 bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-md shadow-sm hover:bg-cyan-500/10 transition-colors">
                            <Brain className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                            <span className="text-xs font-bold tracking-wide text-cyan-700 dark:text-cyan-300">DenseNet-121</span>
                        </div>
                        <div className="px-4 py-2 rounded-xl flex items-center gap-2.5 bg-emerald-500/5 border border-emerald-500/20 backdrop-blur-md shadow-sm hover:bg-emerald-500/10 transition-colors">
                            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs font-bold tracking-wide text-emerald-700 dark:text-emerald-300">HIPAA Compliant</span>
                        </div>
                    </div>
                </div>

                {/* Compact Stats Row - Premium Glass Design */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            label: "Total Analyses",
                            value: totalScans,
                            icon: Activity,
                            color: "text-cyan-600 dark:text-cyan-400",
                            bgGradient: "bg-gradient-to-br from-cyan-500/5 to-transparent dark:from-cyan-500/10",
                            hover: "hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:border-cyan-500/30",
                            border: "border-cyan-200/50 dark:border-cyan-500/20",
                            iconBg: "bg-cyan-100 dark:bg-cyan-500/20"
                        },
                        {
                            label: "Critical Cases",
                            value: criticalCases,
                            icon: ShieldCheck,
                            color: "text-rose-600 dark:text-rose-400",
                            bgGradient: "bg-gradient-to-br from-rose-500/5 to-transparent dark:from-rose-500/10",
                            hover: "hover:shadow-[0_0_20px_rgba(225,29,72,0.15)] hover:border-rose-500/30",
                            border: "border-rose-200/50 dark:border-rose-500/20",
                            iconBg: "bg-rose-100 dark:bg-rose-500/20"
                        },
                        {
                            label: "Normal Results",
                            value: normalCases,
                            icon: Sparkles,
                            color: "text-emerald-600 dark:text-emerald-400",
                            bgGradient: "bg-gradient-to-br from-emerald-500/5 to-transparent dark:from-emerald-500/10",
                            hover: "hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:border-emerald-500/30",
                            border: "border-emerald-200/50 dark:border-emerald-500/20",
                            iconBg: "bg-emerald-100 dark:bg-emerald-500/20"
                        },
                        {
                            label: "Model Accuracy",
                            value: "94.8%",
                            icon: TrendingUp,
                            color: "text-violet-600 dark:text-violet-400",
                            bgGradient: "bg-gradient-to-br from-violet-500/5 to-transparent dark:from-violet-500/10",
                            hover: "hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:border-violet-500/30",
                            border: "border-violet-200/50 dark:border-violet-500/20",
                            iconBg: "bg-violet-100 dark:bg-violet-500/20"
                        },
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className={cn(
                                "group relative overflow-hidden p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 border backdrop-blur-sm",
                                stat.bgGradient,
                                stat.border,
                                stat.hover
                            )}
                        >
                            <div className={cn("p-3 rounded-xl transition-transform duration-300 group-hover:scale-110", stat.iconBg, stat.color)}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold opacity-80">{stat.label}</p>
                                <p className="text-2xl font-black tracking-tight">{stat.value}</p>
                            </div>
                            {/* Decorative shiny corner */}
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/10 to-transparent -translate-y-8 translate-x-8 rounded-full blur-xl group-hover:bg-white/20 transition-all" />
                        </div>
                    ))}
                </div>

                {/* Main Content Area - Full Width */}
                <div className="space-y-8">
                    {/* Primary Analysis - Centered/Full */}
                    <AnalysisClient
                        userRole={user?.role || "patient"}
                        recentAnalyses={recentAnalyses}
                    />
                </div>
            </div>
        </div>
    )
}
