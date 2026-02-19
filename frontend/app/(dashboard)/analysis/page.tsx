import { getSession } from "@/lib/auth"
import { AnalysisClient } from "@/components/analysis-client"
import { getRecentAnalyses, getAnalysisStats } from "@/app/actions/analyses"
import { Scan, Brain, Sparkles, Activity, ShieldCheck, TrendingUp, Zap, Cpu, Server, Gauge, Target } from "lucide-react"

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
            {/* Enhanced Background effects - Theme Aware - with Noise Texture */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.04] pointer-events-none" />

            {/* Noise Texture for Matte Finish */}
            <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

            <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-cyan-500/10 dark:from-cyan-500/15 via-violet-600/5 dark:via-violet-600/10 to-transparent rounded-full blur-[120px] pointer-events-none animate-float" />
            <div className="absolute bottom-0 right-1/4 w-[800px] h-[800px] bg-gradient-to-tr from-violet-600/10 dark:from-violet-600/15 via-fuchsia-600/5 dark:via-fuchsia-600/10 to-transparent rounded-full blur-[120px] pointer-events-none animate-float" style={{ animationDelay: '3s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/[0.03] dark:bg-primary/[0.05] rounded-full blur-[150px] pointer-events-none" />

            <div className="relative p-4 lg:px-6 pt-16 lg:pt-6 space-y-6 w-full">
                {/* Header Section - Open & Technical */}
                <div className="relative z-10 space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-1000">
                    <div className="flex flex-col lg:flex-row justify-between items-end gap-6 pb-6 border-b border-slate-200/50 dark:border-white/10">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                    <Brain className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black tracking-tight text-foreground">
                                        AI Diagnostic Hub
                                    </h1>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-xs font-mono text-muted-foreground uppercase opacity-80">
                                            Neural Imaging Analysis System <span className="text-slate-300 dark:text-slate-700">|</span> v3.0.1
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="px-4 py-1.5 rounded-full bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-2 backdrop-blur-md">
                                <Activity className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-xs font-semibold text-foreground">DenseNet-121</span>
                            </div>
                            <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">HIPAA Secured</span>
                            </div>
                        </div>
                    </div>

                    {/* Compact Stats Row - Technical Precision */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 1. Total Analyses */}
                        <div className="glass-card-premium group p-5 flex flex-col justify-between h-32 hover:border-cyan-500/30">
                            {/* Technical Corners */}
                            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-cyan-500/20 rounded-tr-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-cyan-500/20 rounded-bl-2xl opacity-50 group-hover:opacity-100 transition-opacity" />

                            <div className="flex justify-between items-start z-10">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20 text-white group-hover:scale-110 transition-transform duration-300">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                                    +12%
                                </div>
                            </div>

                            <div className="z-10 mt-2">
                                <p className="text-3xl font-mono font-bold tracking-tight text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors duration-300">{totalScans}</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mt-1">Total Scans</p>
                            </div>

                            {/* Progress Line */}
                            <div className="absolute bottom-0 inset-x-0 h-1 bg-slate-100 dark:bg-white/5">
                                <div className="h-full w-[45%] bg-cyan-500/50" />
                            </div>
                        </div>

                        {/* 2. Critical Cases */}
                        <div className="glass-card-premium group p-5 flex flex-col justify-between h-32 hover:border-rose-500/30">
                            {/* Technical Corners */}
                            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-rose-500/20 rounded-tr-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-rose-500/20 rounded-bl-2xl opacity-50 group-hover:opacity-100 transition-opacity" />

                            {/* Pulse for critical */}
                            {criticalCases > 0 && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-rose-500 animate-ping" />}

                            <div className="flex justify-between items-start z-10">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-rose-400 to-pink-600 shadow-lg shadow-rose-500/20 text-white group-hover:scale-110 transition-transform duration-300">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                                    Action Req.
                                </div>
                            </div>

                            <div className="z-10 mt-2">
                                <p className="text-3xl font-mono font-bold tracking-tight text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors duration-300">{criticalCases}</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mt-1">Critical Cases</p>
                            </div>

                            {/* Progress Line */}
                            <div className="absolute bottom-0 inset-x-0 h-1 bg-slate-100 dark:bg-white/5">
                                <div className="h-full w-[80%] bg-rose-500/50" />
                            </div>
                        </div>

                        {/* 3. Normal Results */}
                        <div className="glass-card-premium group p-5 flex flex-col justify-between h-32 hover:border-emerald-500/30">
                            {/* Technical Corners */}
                            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-emerald-500/20 rounded-tr-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-emerald-500/20 rounded-bl-2xl opacity-50 group-hover:opacity-100 transition-opacity" />

                            <div className="flex justify-between items-start z-10">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/20 text-white group-hover:scale-110 transition-transform duration-300">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    Healthy
                                </div>
                            </div>

                            <div className="z-10 mt-2">
                                <p className="text-3xl font-mono font-bold tracking-tight text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">{normalCases}</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mt-1">Normal Results</p>
                            </div>

                            {/* Progress Line */}
                            <div className="absolute bottom-0 inset-x-0 h-1 bg-slate-100 dark:bg-white/5">
                                <div className="h-full w-[25%] bg-emerald-500/50" />
                            </div>
                        </div>

                        {/* 4. Model Accuracy */}
                        <div className="glass-card-premium group p-5 flex flex-col justify-between h-32 hover:border-violet-500/30">
                            {/* Technical Corners */}
                            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-violet-500/20 rounded-tr-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-violet-500/20 rounded-bl-2xl opacity-50 group-hover:opacity-100 transition-opacity" />

                            <div className="flex justify-between items-start z-10">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-600 shadow-lg shadow-violet-500/20 text-white group-hover:scale-110 transition-transform duration-300">
                                    <Gauge className="w-5 h-5" />
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                                    v2.4.0
                                </div>
                            </div>

                            <div className="z-10 mt-2">
                                <div className="flex items-baseline gap-1">
                                    <p className="text-3xl font-mono font-bold tracking-tight text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-300">94.8</p>
                                    <span className="text-sm font-bold text-muted-foreground">%</span>
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mt-1">Accuracy</p>
                            </div>

                            {/* Progress Line */}
                            <div className="absolute bottom-0 inset-x-0 h-1 bg-slate-100 dark:bg-white/5">
                                <div className="h-full w-[94%] bg-violet-500/50" />
                            </div>
                        </div>
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
        </div>
    )
}
