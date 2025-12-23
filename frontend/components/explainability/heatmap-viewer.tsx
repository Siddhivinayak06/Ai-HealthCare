"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info } from 'lucide-react'

interface HeatmapViewerProps {
    originalImage: string
    heatmapUrl: string
    summary?: string
}

export function HeatmapViewer({ originalImage, heatmapUrl, summary }: HeatmapViewerProps) {
    return (
        <Card className="overflow-hidden border-2 border-primary/10 shadow-lg bg-gradient-to-br from-background to-accent/5">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    AI Focus Areas (Grad-CAM)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                    <img
                        src={originalImage}
                        alt="Original Scan"
                        className="absolute inset-0 w-full h-full object-cover grayscale opacity-50 transition-opacity group-hover:opacity-40"
                    />
                    <img
                        src={heatmapUrl}
                        alt="AI Heatmap"
                        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-bottom p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs mt-auto">Regions in red indicate highest AI attention</span>
                    </div>
                </div>
                {summary && (
                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                        "{summary}"
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
