"use client"

import React from 'react'
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface ConfidenceBadgeProps {
    confidence: number
    uncertainty: 'LOW' | 'MEDIUM' | 'HIGH'
    reviewRequired?: boolean
}

export function ConfidenceBadge({ confidence, uncertainty, reviewRequired }: ConfidenceBadgeProps) {
    const getColors = () => {
        if (uncertainty === 'LOW' && confidence > 0.8) return 'bg-green-500/10 text-green-500 border-green-500/20'
        if (uncertainty === 'MEDIUM' || confidence > 0.6) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
        return 'bg-destructive/10 text-destructive border-destructive/20'
    }

    const getIcon = () => {
        if (uncertainty === 'LOW') return <ShieldCheck className="w-3.5 h-3.5" />
        if (uncertainty === 'MEDIUM') return <AlertTriangle className="w-3.5 h-3.5" />
        return <AlertCircle className="w-3.5 h-3.5" />
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 cursor-help">
                        <Badge variant="outline" className={`${getColors()} flex items-center gap-1.5 px-2 py-0.5 font-bold transition-all hover:scale-105`}>
                            {getIcon()}
                            {(confidence * 100).toFixed(0)}% Certainty
                        </Badge>
                        {reviewRequired && (
                            <Badge variant="destructive" className="animate-pulse text-[10px] uppercase tracking-tighter h-5">
                                Human Review Recommended
                            </Badge>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-3 space-y-1">
                    <p className="font-bold">AI Uncertainty Estimation</p>
                    <p className="text-xs text-muted-foreground">
                        The model calculates {uncertainty.toLowerCase()} uncertainty based on Monte Carlo Dropout sampling.
                        {reviewRequired ? " This case falls outside high-confidence clusters and requires physician validation." : " This prediction aligns strongly with historical high-accuracy patterns."}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
