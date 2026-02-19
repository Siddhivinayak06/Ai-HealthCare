"use client"

import { Sparkles, Activity } from "lucide-react"

interface ClinicalInsightsProps {
    result: any
}

export function ClinicalInsights({ result }: ClinicalInsightsProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
            <div className="flex items-center gap-2 px-1">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Clinical Insights</h4>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Findings Grid */}
                <div className="bento-cell h-full border-l-4 border-l-violet-500/20 bg-gradient-to-br from-white/50 to-white/10 dark:from-white/5 dark:to-transparent">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity className="h-3 w-3" />
                        Observations
                    </h4>
                    <div className="space-y-2.5">
                        {result.findings?.map((f: string, i: number) => (
                            <div key={i} className="p-3 bg-white/60 dark:bg-white/5 rounded-xl border border-white/20 text-sm font-medium flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-left-2 duration-500 hover:bg-white/80 dark:hover:bg-white/10 transition-colors" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="mt-1 h-4 w-4 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-500/20">
                                    <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                                </div>
                                <span className="leading-snug text-slate-700 dark:text-slate-200 text-xs tracking-wide">{f}</span>
                            </div>
                        ))}
                        {(!result.findings || result.findings.length === 0) && (
                            <div className="p-4 border border-dashed border-border/50 rounded-xl text-center">
                                <p className="text-xs text-muted-foreground italic">No specific anomaly markers identified.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Technical Metrics */}
                <div className="bento-cell h-full bg-gradient-to-br from-white/50 to-white/10 dark:from-white/5 dark:to-transparent">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Technical Metrics</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white/40 dark:bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Model Arch</p>
                            <p className="text-xs font-bold font-mono truncate text-violet-600 dark:text-violet-300">{result?.model_info?.architecture || "DenseNet-121"}</p>
                        </div>
                        <div className="p-3 bg-white/40 dark:bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Input Res</p>
                            <p className="text-xs font-bold font-mono">224px <span className="text-muted-foreground font-normal">rgb</span></p>
                        </div>

                        {/* Entropy Gauge */}
                        <div className="p-4 bg-white/40 dark:bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm col-span-2 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent pointer-events-none" />
                            <div className="flex justify-between items-center mb-2 relative z-10">
                                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Uncertainty (Entropy)</p>
                                <p className="text-xs font-bold text-violet-500 flex items-center gap-1 font-mono">
                                    {(Number(result.confidence_metrics?.uncertainty_level) || 0.12).toFixed(3)}
                                </p>
                            </div>
                            <div className="h-2 bg-slate-200 dark:bg-black/40 rounded-full overflow-hidden relative z-10">
                                <div
                                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-1000 ease-out relative"
                                    style={{ width: `${(Number(result.confidence_metrics?.uncertainty_level) || 0.12) * 100 * 3}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/30 animate-shimmer" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
