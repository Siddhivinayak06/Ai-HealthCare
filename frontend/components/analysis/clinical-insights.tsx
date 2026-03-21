"use client"

import { Sparkles, Activity, Stethoscope, FileText } from "lucide-react"

interface ClinicalInsightsProps {
    result: any
}

export function ClinicalInsights({ result }: ClinicalInsightsProps) {
    const generateReport = () => {
        const isNormal = result.prediction?.toLowerCase().includes("normal");
        const confPercent = (result.confidence * 100).toFixed(1);
        const scanTypeStr = result.scan_type || "imaging";

        let report = `The AI Diagnostic Engine has completed a comprehensive analysis of the provided ${scanTypeStr} scan. `;

        if (isNormal) {
            report += `The primary assessment indicates normal anatomical structures with a high confidence level of ${confPercent}%. `;
            report += `No significant markers of disease or acute abnormalities were identified within the analyzed radiomic features. `;
        } else {
            report += `The primary assessment has identified patterns consistent with ${result.prediction}, calculated at a confidence level of ${confPercent}%. `;
            report += `This finding represents a deviation from standard baselines and indicates a ${result.severity?.toLowerCase() || 'notable'} severity level. `;
        }

        if (result.findings && result.findings.length > 0) {
            const significantFindings = result.findings.filter((f: string) => !f.toLowerCase().includes("confidence") && !f.toLowerCase().includes("entropy"));
            if (significantFindings.length > 0) {
                report += `Key observations driving this conclusion include: ${significantFindings.join('; ').toLowerCase()}. `;
            }
        }

        report += `Please correlate these AI-generated insights with clinical presentation and patient history.`;
        return report;
    };

    return (
        <div className="space-y-4 mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
            <div className="flex items-center gap-2 px-1 mb-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Clinical Insights</h4>
            </div>

            {/* Detailed Analysis Report (Full Width) */}
            <div className="bg-white/50 dark:bg-slate-900/50 rounded-3xl p-6 sm:p-8 flex flex-col gap-4 border border-slate-100 dark:border-slate-800 backdrop-blur-sm mb-6">
                <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <FileText className="h-3 w-3" />
                    Detailed Analysis Report
                </h4>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[15px]">
                        {generateReport()}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Observations Container */}
                <div className="bg-white/50 dark:bg-slate-900/50 rounded-3xl p-6 sm:p-8 flex flex-col gap-4 border border-slate-100 dark:border-slate-800 backdrop-blur-sm">
                    <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="h-3 w-3" />
                        Observations
                    </h4>

                    <div className="flex flex-col gap-3">
                        {result.findings?.map((f: string, i: number) => (
                            <div key={i} className="px-6 py-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm font-medium flex items-center gap-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-colors">
                                <span className="h-2 w-2 rounded-full bg-violet-500 shrink-0" />
                                <span className="leading-snug text-slate-700 dark:text-slate-200">{f}</span>
                            </div>
                        ))}
                        {(!result.findings || result.findings.length === 0) && (
                            <div className="px-6 py-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                                <p className="text-sm text-slate-500 dark:text-slate-400 italic">No specific anomaly markers identified.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* New: Clinical Recommendations */}
                {result.recommendations && result.recommendations.length > 0 && (
                    <div className="bg-white/50 dark:bg-slate-900/50 rounded-3xl p-6 sm:p-8 flex flex-col gap-4 border border-slate-100 dark:border-slate-800 backdrop-blur-sm">
                        <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Stethoscope className="h-3.5 w-3.5" />
                            Clinical Recommendations
                        </h4>
                        <div className="flex flex-col gap-3 mt-1">
                            {result.recommendations.map((rec: string, i: number) => (
                                <div key={i} className="px-6 py-4 bg-[#f0fdf4] dark:bg-[#f0fdf4]/5 rounded-2xl border border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-[13px] font-bold flex items-center gap-4 transition-colors">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="leading-snug">{rec}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
