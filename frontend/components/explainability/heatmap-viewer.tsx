"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info, Maximize2, Zap } from 'lucide-react'
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface HeatmapViewerProps {
    originalImage: string
    heatmapUrl: string
    summary?: string
}

export function HeatmapViewer({ originalImage, heatmapUrl, summary }: HeatmapViewerProps) {
    const [opacity, setOpacity] = React.useState([0.5])
    const [isFullscreen, setIsFullscreen] = React.useState(false)

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
                        className="absolute inset-0 w-full h-full object-cover grayscale transition-opacity"
                        style={{ opacity: 1 - opacity[0] * 0.5 }}
                    />
                    <img
                        src={heatmapUrl}
                        alt="AI Heatmap"
                        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay transition-transform duration-500 group-hover:scale-105"
                        style={{ opacity: opacity[0] }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-bottom p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs mt-auto">Regions in red indicate highest AI attention</span>
                    </div>
                </div>

                <div className="space-y-3 p-4 bg-secondary/20 rounded-xl border border-border/50">
                    <div className="flex justify-between items-center mb-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Zap className="w-3 h-3 text-amber-500" />
                            Heatmap Intensity
                        </Label>
                        <span className="text-xs font-mono bg-background px-2 py-0.5 rounded border border-border">
                            {(opacity[0] * 100).toFixed(0)}%
                        </span>
                    </div>
                    <Slider
                        value={opacity}
                        onValueChange={setOpacity}
                        max={1}
                        step={0.01}
                        className="py-2"
                    />
                    <p className="text-[10px] text-muted-foreground leading-tight">
                        Slide to adjust the overlay intensity. Higher intensity highlights the neural network's primary focus areas.
                    </p>
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
