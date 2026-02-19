"use client"

import { Clock, TrendingUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { PatientTrendChart } from "@/components/patient-trend-chart"
import { AnalysisHistory } from "@/components/analysis-history"

interface PatientRegistryProps {
    historyData: any[]
    registryOpen: boolean
    onToggleRegistry: () => void
    recentAnalyses: any[]
}

export function PatientRegistry({ historyData, registryOpen, onToggleRegistry, recentAnalyses }: PatientRegistryProps) {
    return (
        <div className="space-y-6 pt-4">
            {/* Trending Chart - Reduced Height */}
            {historyData.length > 0 && (
                <div className="hospital-card p-6 bg-white dark:bg-card/50">
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-cyan-500" />
                        Health Progression
                    </h4>
                    <div className="h-[180px] w-full">
                        <PatientTrendChart data={historyData} />
                    </div>
                </div>
            )}

            {/* Collapsible Registry */}
            <div className="rounded-3xl border border-border/40 bg-white/50 dark:bg-card/50 overflow-hidden backdrop-blur-sm">
                <button
                    onClick={onToggleRegistry}
                    className="w-full flex items-center justify-between p-4 bg-slate-50/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Registry & Recent Scans
                    </h3>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", registryOpen && "rotate-180")} />
                </button>

                <div className={cn(
                    "grid transition-all duration-300 ease-in-out",
                    registryOpen ? "grid-rows-[1fr] opacity-100 p-4 pt-0" : "grid-rows-[0fr] opacity-0"
                )}>
                    <div className="overflow-hidden">
                        <AnalysisHistory analyses={recentAnalyses as any} />
                    </div>
                </div>
            </div>
        </div>
    )
}
