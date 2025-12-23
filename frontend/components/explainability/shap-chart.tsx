"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown } from 'lucide-react'

interface ShapFactor {
    feature: string
    impact: 'High' | 'Moderate' | 'Low'
    direction: 'increases' | 'decreases'
}

interface ShapChartProps {
    factors: ShapFactor[]
    note?: string
}

export function ShapChart({ factors, note }: ShapChartProps) {
    return (
        <Card className="border-2 border-primary/10 shadow-lg">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Risk Factors Analysis (SHAP)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {factors.map((factor, idx) => (
                    <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold">{factor.feature}</span>
                            <span className={`flex items-center gap-1 ${factor.direction === 'increases' ? 'text-destructive' : 'text-green-500'}`}>
                                {factor.direction === 'increases' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {factor.impact} Impact
                            </span>
                        </div>
                        <Progress
                            value={factor.impact === 'High' ? 85 : factor.impact === 'Moderate' ? 50 : 25}
                            className={`h-1.5 ${factor.direction === 'increases' ? '[&>div]:bg-destructive' : '[&>div]:bg-green-500'}`}
                        />
                    </div>
                ))}
                {note && (
                    <div className="mt-4 p-3 rounded-md bg-accent/50 border border-border/50">
                        <p className="text-xs text-muted-foreground">
                            <span className="font-bold text-primary">Doctor's AI Insight:</span> {note}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
