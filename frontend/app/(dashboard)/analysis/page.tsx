import { getSession } from "@/lib/auth"
import { AnalysisClient } from "@/components/analysis-client"
import { getRecentAnalyses } from "@/app/actions/analyses"
import { Scan, Brain, Sparkles, Activity, Clock, ShieldCheck, TrendingUp } from "lucide-react"
import { AnalysisHistory } from "@/components/analysis-history"
import { Card, CardContent } from "@/components/ui/card"

export default async function AnalysisPage() {
    const { user } = await getSession()
    const recentAnalyses = await getRecentAnalyses(10)

    // Calculate quick stats
    const totalScans = recentAnalyses.length
    const criticalCases = recentAnalyses.filter(a => a.severity?.toLowerCase() === 'critical' || a.severity?.toLowerCase() === 'high').length
    const normalCases = recentAnalyses.filter(a => a.severity?.toLowerCase() === 'normal' || a.severity?.toLowerCase() === 'low').length

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Enhanced Background effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
            <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-gradient-to-br from-cyan-500/10 via-violet-600/8 to-transparent rounded-full blur-[150px] pointer-events-none animate-float" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-violet-600/10 via-fuchsia-600/5 to-transparent rounded-full blur-[150px] pointer-events-none animate-float" style={{ animationDelay: '3s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/[0.03] rounded-full blur-[200px] pointer-events-none" />

            <div className="relative p-4 lg:p-8 pt-16 lg:pt-8 space-y-8 max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-violet-600 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-violet-500/30 group hover:shadow-violet-500/50 transition-shadow duration-500">
                                <Scan className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-primary">
                                    AI Diagnostic Hub
                                </h1>
                                <p className="text-muted-foreground text-lg">
                                    Neural analysis & multimodal clinical diagnostics
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="health-card px-4 py-2.5 rounded-xl flex items-center gap-2.5 border-cyan-500/20 bg-cyan-500/5">
                            <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                            <Brain className="h-4 w-4 text-cyan-400" />
                            <span className="text-sm font-semibold">DenseNet-121</span>
                        </div>
                        <div className="health-card px-4 py-2.5 rounded-xl flex items-center gap-2.5 border-emerald-500/20 bg-emerald-500/5">
                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm font-semibold">HIPAA Secured</span>
                        </div>
                    </div>
                </div>

                {/* Performance Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total Analyses", value: totalScans, icon: Activity, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
                        { label: "Critical Findings", value: criticalCases, icon: ShieldCheck, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
                        { label: "Normal Results", value: normalCases, icon: Sparkles, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                        { label: "Model Reliability", value: "94.8%", icon: TrendingUp, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
                    ].map((stat, i) => (
                        <div key={i} className={cn("health-card p-5 flex items-center gap-4 hover:shadow-lg transition-all duration-500 group", stat.border)}>
                            <div className={cn("p-3.5 rounded-xl transition-all duration-500 group-hover:scale-110", stat.bg, stat.color)}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{stat.label}</p>
                                <p className="text-2xl font-black tracking-tight">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Primary Analysis Column */}
                    <div className="lg:col-span-8 space-y-8">
                        <AnalysisClient userRole={user?.role || "patient"} />
                    </div>

                    {/* Side Intelligence Column */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="sticky top-8 space-y-6">
                            <AnalysisHistory analyses={recentAnalyses as any} />

                            {/* System Status Card */}
                            <div className="health-card overflow-hidden border-violet-500/20">
                                <div className="p-5 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-transparent">
                                    <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-4 text-muted-foreground">
                                        <Zap className="h-4 w-4 text-amber-400" />
                                        Compute Status
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Neural Engine</span>
                                            <span className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                </span>
                                                Operational
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Avg Latency</span>
                                            <span className="text-sm font-semibold">0.8s</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">GPU Utilization</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                                                    <div className="h-full w-[72%] bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full" />
                                                </div>
                                                <span className="text-sm font-semibold">72%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

import { cn } from "@/lib/utils"
import { Zap } from "lucide-react"
