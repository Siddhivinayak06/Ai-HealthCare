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
            "relative overflow-hidden rounded-3xl border bg-white dark:bg-slate-950 shadow-sm transition-all group",
            isCritical
                ? "border-rose-100 dark:border-rose-900/40"
                : "border-slate-100 dark:border-slate-800"
        )}>
            {/* Ambient subtle glow */}
            <div className={cn(
                "absolute -top-32 -left-32 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none transition-all duration-1000",
                isCritical ? "bg-rose-400" : "bg-emerald-400"
            )} />

            {/* Left Accent Bar */}
            <div className={cn(
                "absolute top-0 left-0 w-1.5 h-[60%] mt-8 rounded-r-md transition-all duration-1000",
                isCritical ? 'bg-rose-500' : 'bg-emerald-500'
            )} />

            <div className="p-8 sm:p-10 pl-10 sm:pl-12 relative z-10 flex flex-col md:flex-row justify-between items-start gap-12">
                <div className="flex-1 max-w-2xl">
                    <h5 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        Primary Diagnosis
                    </h5>

                    <h2 className={cn(
                        "text-5xl sm:text-6xl font-black tracking-tight mb-4",
                        isCritical
                            ? "text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-red-500"
                            : "text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500"
                    )}>
                        {result.prediction}
                    </h2>

                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                        The analysis indicates <span className="text-slate-900 dark:text-white font-bold">{result.prediction}</span> with
                        a confidence interval of <span className="text-slate-900 dark:text-white font-bold font-mono">{(result.confidence * 100).toFixed(1)}%</span>.
                        {isCritical ? " This requires immediate clinical review." : " No acute abnormalities detected."}
                    </p>
                </div>

                {/* Right Side Stats */}
                <div className="flex flex-col gap-6 w-full md:w-auto mt-4 md:mt-0 items-end md:items-center">
                    <div className="text-center md:text-right w-full">
                        <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold tracking-widest mb-1">Confidence</p>
                        <p className="text-4xl font-black font-mono text-slate-900 dark:text-white tracking-tight">{(result.confidence * 100).toFixed(0)}<span className="text-xl align-top opacity-60">%</span></p>
                    </div>

                    <div className={cn(
                        "px-8 py-3 rounded-xl border text-center relative overflow-hidden flex flex-col items-center justify-center min-w-[140px]",
                        isCritical ? "border-rose-100 bg-rose-50/50 dark:border-rose-900/30 dark:bg-rose-900/10" : "border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-900/10"
                    )}>
                        <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold tracking-widest mb-1 z-10">Severity</p>
                        <p className={cn("text-lg font-black uppercase tracking-wide z-10", isCritical ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>
                            {result.prediction?.toLowerCase().includes("normal") ? "LOW" : result.severity || "MEDIUM"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-700">
                <div className="flex flex-wrap gap-3">
                    <Button
                        size="lg"
                        className="bg-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold tracking-wide border-0 shadow-none border-t border-b border-l border-r border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        onClick={() => onFeedback(result.prediction)}
                    >
                        <CheckCircle2 className="mr-2 h-5 w-5 text-emerald-500" />
                        Confirm Diagnosis
                    </Button>

                    {possibleLabels.filter(l => l !== result.prediction).map(l => (
                        <Button
                            key={l}
                            variant="outline"
                            size="lg"
                            className="bg-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold tracking-wide border-0 shadow-none border-t border-b border-l border-r border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                            onClick={() => onFeedback(l)}
                        >
                            Mark as {l}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    )
}
