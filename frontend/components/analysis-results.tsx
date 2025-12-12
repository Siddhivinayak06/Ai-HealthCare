"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircleIcon, AlertCircleIcon, DownloadIcon, ZoomInIcon } from "@/components/icons"
import { cn } from "@/lib/utils"

export interface AnalysisResult {
  id: string
  imageUrl: string
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
  if (results.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {results.map((result) => (
        <Card key={result.id} className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-card-foreground">{result.scanType} Analysis</CardTitle>
                <Badge
                  variant="secondary"
                  className={cn(
                    "font-medium",
                    result.severity === "normal" && "bg-success/10 text-success border-success/20",
                    result.severity === "low" && "bg-primary/10 text-primary border-primary/20",
                    result.severity === "moderate" && "bg-warning/10 text-warning border-warning/20",
                    result.severity === "high" && "bg-destructive/10 text-destructive border-destructive/20",
                  )}
                >
                  {result.severity === "normal" ? "Normal" : `${result.severity} risk`}
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground">Processed in {result.processingTime.toFixed(1)}s</span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Image with annotations */}
              <div className="relative aspect-square bg-secondary/50 rounded-xl overflow-hidden group ring-1 ring-border/50">
                <img
                  src={result.imageUrl || "/placeholder.svg"}
                  alt="Analyzed medical scan"
                  className="w-full h-full object-cover"
                />
                {/* Simulated annotation overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {result.findings.slice(0, 2).map((finding, idx) => (
                    <div
                      key={idx}
                      className="absolute border-2 border-primary/70 rounded-lg"
                      style={{
                        top: `${20 + idx * 30}%`,
                        left: `${25 + idx * 15}%`,
                        width: "100px",
                        height: "70px",
                      }}
                    >
                      <div className="absolute -top-7 left-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md whitespace-nowrap shadow-lg">
                        {finding.region}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="secondary" className="gap-1 shadow-lg">
                    <ZoomInIcon className="h-4 w-4" />
                    Zoom
                  </Button>
                </div>
              </div>

              {/* Analysis Details */}
              <div className="space-y-6">
                {/* Primary Diagnosis */}
                <div className="p-4 rounded-xl bg-muted/50 ring-1 ring-border/30">
                  <div className="flex items-start gap-3">
                    {result.severity === "normal" ? (
                      <CheckCircleIcon className="h-6 w-6 text-success mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircleIcon className="h-6 w-6 text-warning mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-card-foreground">{result.diagnosis}</p>
                      <p className="text-sm text-muted-foreground mt-1">AI Confidence: {result.confidence}%</p>
                    </div>
                  </div>
                </div>

                {/* Findings */}
                <div>
                  <h4 className="font-medium text-card-foreground mb-3">Key Findings</h4>
                  <div className="space-y-3">
                    {result.findings.map((finding, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-card-foreground">{finding.region}</span>
                          <span className="text-sm text-muted-foreground">{finding.probability}%</span>
                        </div>
                        <Progress value={finding.probability} className="h-2" />
                        <p className="text-sm text-muted-foreground">{finding.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="font-medium text-card-foreground mb-3">Recommendations</h4>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 bg-background/50"
                    onClick={() => onViewDetails(result)}
                  >
                    View Full Report
                  </Button>
                  <Button variant="outline" className="gap-2 bg-background/50">
                    <DownloadIcon className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
