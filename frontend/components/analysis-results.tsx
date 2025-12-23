"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircleIcon, AlertCircleIcon, DownloadIcon, ZoomInIcon, ThumbsUp, ThumbsDown, MessageSquare, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { submitFeedback } from "@/app/actions/analyses"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"

export interface AnalysisResult {
  id: string
  imageUrl: string
  heatmapUrl?: string
  autoCorrected?: boolean
  scanType: string
  diagnosis: string
  confidence: number
  severity: "normal" | "low" | "moderate" | "high"
  findings: Finding[]
  recommendations: string[]
  processingTime: number
  modelVersion: string
  patientName?: string
  createdAt?: Date | string
}

interface Finding {
  region: string
  description: string
  probability: number
}

interface AnalysisResultsProps {
  results: AnalysisResult[]
  onViewDetails: (result: AnalysisResult) => void
}

export function AnalysisResults({ results, onViewDetails }: AnalysisResultsProps) {
  const [showHeatmap, setShowHeatmap] = useState<Record<string, boolean>>({})
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({})

  if (results.length === 0) {
    return null
  }

  const toggleHeatmap = (id: string) => {
    setShowHeatmap(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleFeedback = async (id: string, action: "APPROVE" | "OVERRIDE") => {
    setIsSubmitting(prev => ({ ...prev, [id]: true }))
    try {
      const res = await submitFeedback({
        entityId: id,
        entityType: "IMAGE_ANALYSIS",
        action: action,
        feedback: feedback[id],
        overrideReason: action === "OVERRIDE" ? feedback[id] : undefined
      })

      if (res.success) {
        toast.success(`Result ${action.toLowerCase()}d successfully`)
      } else {
        toast.error("Failed to submit feedback")
      }
    } catch (error) {
      toast.error("Feedback submission error")
    } finally {
      setIsSubmitting(prev => ({ ...prev, [id]: false }))
    }
  }

  return (
    <div className="space-y-6">
      {results.map((result) => (
        <Card key={result.id} className="bg-slate-900/50 backdrop-blur-md border-white/10 overflow-hidden shadow-xl ring-1 ring-white/5">
          <CardHeader className="border-b border-white/10 bg-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-white text-lg">{result.scanType} Analysis</CardTitle>
                <Badge
                  variant="outline"
                  className={cn(
                    "font-bold uppercase tracking-wider px-3",
                    result.severity === "normal" && "border-emerald-500/50 bg-emerald-500/10 text-emerald-400", // 🟢
                    result.severity === "low" && "border-blue-500/50 bg-blue-500/10 text-blue-400",
                    result.severity === "moderate" && "border-orange-500/50 bg-orange-500/10 text-orange-400", // 🟠
                    result.severity === "high" && "border-rose-500/50 bg-rose-500/10 text-rose-400", // 🔴
                  )}
                >
                  {result.severity === "high" ? "🔴 Critical" : result.severity === "moderate" ? "🟠 Moderate" : "🟢 Stable"}
                </Badge>
                {result.autoCorrected && (
                  <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-500 gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Modality Correction
                  </Badge>
                )}
              </div>
              <span className="text-sm text-slate-400">Time: {result.processingTime.toFixed(1)}s</span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image & Heatmap */}
              <div className="space-y-4">
                <div className="relative aspect-square bg-slate-950 rounded-2xl overflow-hidden group ring-1 ring-white/10 shadow-2xl">
                  <img
                    src={result.imageUrl}
                    alt="Medical Scan"
                    className={cn("w-full h-full object-cover transition-opacity", showHeatmap[result.id] && result.heatmapUrl ? "opacity-40" : "opacity-100")}
                  />
                  {result.heatmapUrl && (
                    <img
                      src={result.heatmapUrl}
                      alt="Heatmap"
                      className={cn("absolute inset-0 w-full h-full object-cover transition-opacity duration-500", showHeatmap[result.id] ? "opacity-100" : "opacity-0")}
                    />
                  )}

                  <div className="absolute top-4 right-4 flex gap-2">
                    {result.heatmapUrl && (
                      <Button size="sm" variant="secondary" className="backdrop-blur-md bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => toggleHeatmap(result.id)}>
                        {showHeatmap[result.id] ? "Show Original" : "Show Heatmap"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Explainability Insight */}
                {result.heatmapUrl && (
                  <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <p className="text-xs text-blue-400 flex items-center gap-2">
                      <Layers className="h-3 w-3" />
                      XAI: Higher intensity areas indicate features prioritized by AI decision logic.
                    </p>
                  </div>
                )}
              </div>

              {/* Analysis Details */}
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-start gap-4">
                    {result.severity === "normal" ? (
                      <CheckCircleIcon className="h-7 w-7 text-emerald-500 mt-1" />
                    ) : (
                      <AlertCircleIcon className="h-7 w-7 text-rose-500 mt-1" />
                    )}
                    <div>
                      <p className="text-xl font-bold text-white tracking-tight">{result.diagnosis}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-sm text-slate-400">AI Confidence</p>
                        <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30">{result.confidence}%</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Findings & Risk */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-widest mb-4">Diagnostic Findings</h4>
                  <div className="space-y-4">
                    {result.findings.map((finding, idx) => (
                      <div key={idx} className="space-y-2 p-3 rounded-xl bg-slate-900/50 border border-white/5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-300">{finding.description}</span>
                          <span className="text-xs text-blue-400">{finding.probability}%</span>
                        </div>
                        <Progress value={finding.probability} className="h-1 bg-white/5" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Human-in-the-loop Feedback */}
                <div className="pt-4 border-t border-white/10">
                  <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-cyan-400" />
                    Clinician Review
                  </h4>
                  <Textarea
                    placeholder="Add notes or override reasoning..."
                    className="bg-slate-950/50 border-white/10 text-white text-sm mb-3 focus:ring-cyan-500/50"
                    value={feedback[result.id] || ""}
                    onChange={(e) => setFeedback(prev => ({ ...prev, [result.id]: e.target.value }))}
                  />
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 gap-2"
                      disabled={isSubmitting[result.id]}
                      onClick={() => handleFeedback(result.id, "APPROVE")}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 gap-2"
                      disabled={isSubmitting[result.id]}
                      onClick={() => handleFeedback(result.id, "OVERRIDE")}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Override
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Adding missing Lucide icons for compatibility
import { Layers } from "lucide-react"

