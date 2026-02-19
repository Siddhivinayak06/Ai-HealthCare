"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface DiagnosisVerdictProps {
    result: any
    isCritical: boolean
    feedbackSent: boolean
    possibleLabels: string[]
    onFeedback: (label: string) => void
}

export function DiagnosisVerdict({ result, isCritical, feedbackSent, possibleLabels, onFeedback }: DiagnosisVerdictProps) {
    return (
        <div className={cn(
            "relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-700 transition-all group",
            isCritical
                ? "shadow-[0_0_50px_-12px_rgba(225,29,72,0.15)] border-rose-500/20"
                : "shadow-[0_0_50px_-12px_rgba(16,185,129,0.15)] border-emerald-500/20"
        )}>
            {/* Ambient Background Blob */}
            <div className={cn(
                "absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[100px] opacity-10 pointer-events-none transition-all duration-1000 group-hover:opacity-20",
                isCritical ? "bg-rose-500" : "bg-emerald-500"
            )} />

            {/* Accent Line */}
            <div className={cn(
                "absolute top-0 left-0 w-1 h-full transition-all duration-1000",
                isCritical ? 'bg-gradient-to-b from-rose-500 via-rose-400 to-transparent' : 'bg-gradient-to-b from-emerald-500 via-emerald-400 to-transparent'
            )} />

            <div className="p-6 sm:p-8 pl-8 sm:pl-10 relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
                    <div className="flex-1">
                        <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.25em] mb-4 flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-700 delay-100">
                            <Brain className="h-3.5 w-3.5" />
                            Primary Diagnosis
                        </h5>

                        <div className="relative inline-block mb-3">
                            <h2 className={cn(
                                "text-4xl sm:text-5xl font-black tracking-tight animate-in fade-in zoom-in-95 duration-700 delay-200 text-transparent bg-clip-text bg-gradient-to-r",
                                isCritical
                                    ? "from-rose-500 via-rose-400 to-red-500 drop-shadow-sm"
                                    : "from-emerald-500 via-emerald-400 to-teal-500 drop-shadow-sm"
                            )}>
                                {result.prediction}
                            </h2>
                            {/* Underline decoration */}
                            <div className={cn(
                                "h-1.5 w-1/3 rounded-full mt-1 opacity-50",
                                isCritical ? "bg-rose-500/30" : "bg-emerald-500/30"
                            )} />
                        </div>

                        <p className="text-sm text-muted-foreground font-medium max-w-lg leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
                            The analysis indicates <span className="text-foreground font-bold">{result.prediction}</span> with
                            a confidence interval of <span className="text-foreground font-bold font-mono">{(result.confidence * 100).toFixed(1)}%</span>.
                            {isCritical ? " This requires immediate clinical review." : " No acute abnormalities detected."}
                        </p>
                    </div>

                    {/* Stats Glass Columns */}
                    <div className="flex flex-row sm:flex-col gap-3 min-w-0 sm:min-w-[160px] animate-in fade-in slide-in-from-right-4 duration-700 delay-500">
                        <div className="p-4 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md text-center relative overflow-hidden group/stat">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                            <p className="text-[9px] uppercase text-muted-foreground font-bold tracking-widest mb-1">Confidence</p>
                            <p className="text-3xl font-black font-mono text-foreground tracking-tight">{(result.confidence * 100).toFixed(0)}<span className="text-lg align-top opacity-60">%</span></p>
                        </div>

                        <div className={cn(
                            "p-4 rounded-2xl border backdrop-blur-md text-center relative overflow-hidden group/stat",
                            isCritical ? "border-rose-500/20 bg-rose-500/5" : "border-emerald-500/20 bg-emerald-500/5"
                        )}>
                            <p className="text-[9px] uppercase text-muted-foreground font-bold tracking-widest mb-1">Severity</p>
                            <p className={cn("text-lg font-black uppercase tracking-wide", isCritical ? "text-rose-500" : "text-emerald-500")}>
                                {result.prediction?.toLowerCase().includes("normal") ? "LOW" : result.severity || "MEDIUM"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-border/40 to-transparent my-8" />

                {/* HUMAN VALIDATION */}
                {!feedbackSent && (
                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-700">
                        <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Physician Verification Required
                        </h5>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                size="lg"
                                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform font-semibold tracking-wide"
                                onClick={() => onFeedback(result.prediction)}
                            >
                                <CheckCircle2 className="mr-2 h-5 w-5" />
                                Confirm Diagnosis
                            </Button>

                            {possibleLabels.filter(l => l !== result.prediction).map(l => (
                                <Button
                                    key={l}
                                    variant="outline"
                                    size="lg"
                                    className="border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-muted-foreground hover:text-foreground rounded-xl transition-all"
                                    onClick={() => onFeedback(l)}
                                >
                                    Mark as {l}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
