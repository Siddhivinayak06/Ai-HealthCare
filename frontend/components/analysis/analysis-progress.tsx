"use client"

import { Brain, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AnalysisStep {
    id: string
    label: string
    duration: number
}

interface AnalysisProgressProps {
    analysisStep: number
    estimatedTime: number
    analysisSteps: AnalysisStep[]
}

export function AnalysisProgress({ analysisStep, estimatedTime, analysisSteps }: AnalysisProgressProps) {
    return (
        <div className="hospital-card p-6 sm:p-10 border border-white/20 bg-white/10 backdrop-blur-xl rounded-3xl animate-in fade-in zoom-in-95 duration-500">
            <div className="max-w-lg mx-auto space-y-10">
                {/* Header */}
                <div className="text-center space-y-3 relative">
                    <div className="absolute inset-0 bg-violet-500/20 blur-[60px] rounded-full pointer-events-none" />
                    <div className="h-20 w-20 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 rounded-3xl flex items-center justify-center mx-auto mb-6 relative overflow-hidden shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]">
                        <Brain className="h-10 w-10 animate-brain-pulse relative z-10" />
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-violet-500 animate-scan-line shadow-[0_0_10px_var(--primary)]" />
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-30" />
                    </div>
                    <h3 className="text-xl font-black tracking-tight text-foreground">Processing Neural Analysis</h3>
                    <p className="text-sm text-muted-foreground font-medium flex items-center justify-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                        </span>
                        Estimated completion: <span className="font-mono font-bold text-foreground">~{estimatedTime}s</span>
                    </p>
                </div>

                {/* Steps Timeline */}
                <div className="space-y-0 relative pl-8 border-l-2 border-dashed border-slate-200 dark:border-white/10 ml-4 py-2">
                    {/* Active Line Progress (Optional visual) */}
                    <div
                        className="absolute left-[-2px] top-0 w-0.5 bg-gradient-to-b from-emerald-500 via-violet-500 to-transparent transition-all duration-1000 ease-linear"
                        style={{ height: `${(analysisStep / (analysisSteps.length - 1)) * 100}%` }}
                    />

                    {analysisSteps.map((step, index) => (
                        <div
                            key={step.id}
                            style={{
                                animationDelay: `${index * 150}ms`,
                            }}
                            className={cn(
                                "flex items-center gap-5 p-4 rounded-xl transition-all duration-500 relative mb-4 last:mb-0",
                                index === analysisStep
                                    ? "bg-white/10 dark:bg-white/5 border border-violet-500/30 shadow-lg shadow-violet-500/5 translate-x-2"
                                    : index < analysisStep
                                        ? "opacity-50 grayscale-[0.5]"
                                        : "opacity-30 blur-[0.5px]"
                            )}
                        >
                            {/* Node Dot */}
                            <div className={cn(
                                "absolute -left-[41px] h-5 w-5 rounded-full border-[3px] transition-all duration-500 flex items-center justify-center bg-background z-10",
                                index < analysisStep ? "border-emerald-500 scale-90" :
                                    index === analysisStep ? "border-violet-500 scale-110 shadow-[0_0_15px_rgba(139,92,246,0.5)]" : "border-slate-300 dark:border-slate-700"
                            )}>
                                {index < analysisStep && <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />}
                                {index === analysisStep && <div className="h-1.5 w-1.5 bg-violet-500 rounded-full animate-pulse" />}
                            </div>

                            <div className="flex-1">
                                <p className={cn(
                                    "text-xs font-bold tracking-widest uppercase mb-0.5",
                                    index === analysisStep ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground"
                                )}>
                                    Phase 0{index + 1}
                                </p>
                                <p className={cn(
                                    "text-sm font-semibold text-foreground",
                                    index === analysisStep && "text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400"
                                )}>
                                    {step.label}
                                </p>
                            </div>

                            {index === analysisStep && (
                                <div className="h-4 w-4 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
                            )}
                            {index < analysisStep && (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
