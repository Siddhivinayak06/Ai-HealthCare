"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Sparkles, AlertCircle } from 'lucide-react'

interface ReportSummaryProps {
    summary: string
    clinicalFindings?: {
        conditions_detected: string[]
        medications_noted: string[]
        lab_tests_mentioned: string[]
    }
}

export function ReportSummary({ summary, clinicalFindings }: ReportSummaryProps) {
    return (
        <Card className="border-2 border-primary/10 shadow-lg overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-primary to-blue-500" />
            <CardHeader className="bg-accent/30 py-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    Patient-Friendly Summary
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <p className="text-sm leading-relaxed font-serif text-slate-800 dark:text-slate-200">
                    {summary}
                </p>

                {clinicalFindings && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                        {clinicalFindings.conditions_detected.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 text-destructive" /> Possible Conditions
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {clinicalFindings.conditions_detected.map((c, i) => (
                                        <span key={i} className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 capitalize">
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {clinicalFindings.medications_noted.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                    <FileText className="w-3 h-3 text-blue-500" /> Medications Noted
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {clinicalFindings.medications_noted.map((m, i) => (
                                        <span key={i} className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 capitalize">
                                            {m}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
