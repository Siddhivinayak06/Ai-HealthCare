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
        <div className="min-h-screen relative overflow-hidden bg-slate-950/20">
            {/* Background effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-violet-600/10 via-fuchsia-600/5 to-transparent rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-600/10 via-blue-600/5 to-transparent rounded-full blur-[120px]" />

            <div className="relative p-4 lg:p-8 pt-16 lg:pt-8 space-y-8 max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-700 flex items-center justify-center shadow-xl shadow-violet-500/20">
                                <Scan className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                                    AI Diagnostic Hub
                                </h1>
                                <p className="text-muted-foreground text-lg">
                                    Neural analysis & multimodal clinical diagnostics
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2 border border-violet-500/20">
                            <Brain className="h-4 w-4 text-violet-500" />
                            <span className="text-sm font-semibold">DenseNet-121</span>
                        </div>
                        <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2 border border-cyan-500/20">
                            <ShieldCheck className="h-4 w-4 text-cyan-500" />
                            <span className="text-sm font-semibold">HIPAA Secured</span>
                        </div>
                    </div>
                </div>

                {/* Performance Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total Analyses", value: totalScans, icon: Activity, color: "text-blue-500" },
                        { label: "Critical Findings", value: criticalCases, icon: ShieldCheck, color: "text-rose-500" },
                        { label: "Normal Results", value: normalCases, icon: Sparkles, color: "text-emerald-500" },
                        { label: "Model Reliability", value: "94.8%", icon: TrendingUp, color: "text-violet-500" },
                    ].map((stat, i) => (
                        <Card key={i} className="bento-card border-white/5 bg-white/[0.02] backdrop-blur-xl">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className={cn("p-2 rounded-lg bg-white/5", stat.color)}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{stat.label}</p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                </div>
                            </CardContent>
                        </Card>
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
                            <Card className="bento-card bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 border-violet-500/10">
                                <CardContent className="p-6">
                                    <h4 className="text-sm font-bold flex items-center gap-2 mb-4">
                                        <Zap className="h-4 w-4 text-amber-500" />
                                        Compute Status
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span className="text-muted-foreground">Neural Engine</span>
                                            <span className="text-emerald-500 flex items-center gap-1">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Operational
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs font-medium">
                                            <span className="text-muted-foreground">Latecy (Avg)</span>
                                            <span className="text-foreground">0.8s</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

import { cn } from "@/lib/utils"
import { Zap } from "lucide-react"
