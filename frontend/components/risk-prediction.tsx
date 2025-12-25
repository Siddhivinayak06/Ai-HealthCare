"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { AlertCircleIcon, CheckCircleIcon, HeartPulseIcon, BrainIcon, ActivityIcon } from "@/components/icons"
import { ShapChart } from "@/components/explainability/shap-chart"
import { ConfidenceBadge } from "@/components/explainability/confidence-badge"

export interface RiskPrediction {
  condition: string
  risk: number
  severity: "low" | "moderate" | "high" | "critical"
  factors: string[]
  recommendations: string[]
  icon: React.ComponentType<{ className?: string }>
  confidence_metrics?: {
    confidence: number
    uncertainty_level: 'LOW' | 'MEDIUM' | 'HIGH'
  }
  shap_explanation?: {
    top_factors: Array<{ feature: string, impact: 'High' | 'Moderate' | 'Low', direction: 'increases' | 'decreases' }>
    summary: string
  }
}

interface RiskPredictionProps {
  predictions: RiskPrediction[]
}

export function RiskPredictionCard({ predictions }: RiskPredictionProps) {
  if (predictions.length === 0) {
    return null
  }

  return (
    <div className="space-y-5">
      {predictions.map((prediction, idx) => (
        <div
          key={idx}
          className={cn(
            "health-card overflow-hidden transition-all duration-300 hover:shadow-lg",
            prediction.severity === "critical" && "border-rose-500/30 hover:shadow-rose-500/10",
            prediction.severity === "high" && "border-amber-500/30 hover:shadow-amber-500/10",
            prediction.severity === "moderate" && "border-primary/30 hover:shadow-primary/10",
            prediction.severity === "low" && "border-emerald-500/30 hover:shadow-emerald-500/10",
          )}
        >
          {/* Header */}
          <div className="p-5 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl transition-transform hover:scale-105",
                    prediction.severity === "low" && "bg-emerald-500/15 text-emerald-500",
                    prediction.severity === "moderate" && "bg-primary/15 text-primary",
                    prediction.severity === "high" && "bg-amber-500/15 text-amber-500",
                    prediction.severity === "critical" && "bg-rose-500/15 text-rose-500",
                  )}
                >
                  <prediction.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{prediction.condition}</h3>
                  <p className="text-sm text-muted-foreground">Risk Assessment</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide border-none",
                    prediction.severity === "low" && "bg-emerald-500/15 text-emerald-500",
                    prediction.severity === "moderate" && "bg-primary/15 text-primary",
                    prediction.severity === "high" && "bg-amber-500/15 text-amber-500",
                    prediction.severity === "critical" && "bg-rose-500/15 text-rose-500",
                  )}
                >
                  <span className={cn(
                    "inline-block h-1.5 w-1.5 rounded-full mr-2",
                    prediction.severity === "low" && "bg-emerald-500",
                    prediction.severity === "moderate" && "bg-primary",
                    prediction.severity === "high" && "bg-amber-500 animate-pulse",
                    prediction.severity === "critical" && "bg-rose-500 animate-pulse",
                  )} />
                  {prediction.severity} risk
                </Badge>
                {prediction.confidence_metrics && (
                  <ConfidenceBadge
                    confidence={prediction.confidence_metrics.confidence}
                    uncertainty={prediction.confidence_metrics.uncertainty_level}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="p-5 space-y-5">
            {/* Risk Score */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Risk Score</span>
                <span
                  className={cn(
                    "text-2xl font-bold",
                    prediction.risk <= 25 && "text-emerald-500",
                    prediction.risk > 25 && prediction.risk <= 50 && "text-primary",
                    prediction.risk > 50 && prediction.risk <= 75 && "text-amber-500",
                    prediction.risk > 75 && "text-rose-500",
                  )}
                >
                  {prediction.risk}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    prediction.risk <= 25 && "bg-gradient-to-r from-emerald-500 to-emerald-400",
                    prediction.risk > 25 && prediction.risk <= 50 && "bg-gradient-to-r from-primary to-violet-500",
                    prediction.risk > 50 && prediction.risk <= 75 && "bg-gradient-to-r from-amber-500 to-orange-400",
                    prediction.risk > 75 && "bg-gradient-to-r from-rose-500 to-red-400",
                  )}
                  style={{ width: `${prediction.risk}%` }}
                />
              </div>
            </div>

            {/* Contributing Factors */}
            <div className="space-y-3">
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <AlertCircleIcon className="h-3.5 w-3.5" />
                Contributing Factors
              </h5>
              <div className="flex flex-wrap gap-2">
                {prediction.factors.map((factor, factorIdx) => (
                  <Badge key={factorIdx} variant="outline" className="bg-secondary/30 border-border/50 hover:border-primary/50 transition-colors">
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" />
                Recommendations
              </h5>
              <ul className="space-y-2">
                {prediction.recommendations.map((rec, recIdx) => (
                  <li key={recIdx} className="flex items-start gap-3 text-sm text-muted-foreground group">
                    <span className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                      {recIdx + 1}
                    </span>
                    <span className="group-hover:text-foreground transition-colors">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* SHAP Explanation */}
            {prediction.shap_explanation && (
              <ShapChart
                factors={prediction.shap_explanation.top_factors}
                note={prediction.shap_explanation.summary}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Helper to generate predictions based on patient data
export function generatePredictions(data: {
  age: number
  bloodPressureSystolic: number
  cholesterolTotal: number
  smokingStatus: string
  exerciseFrequency: string
  familyHistory: string[]
  bloodSugar: number
}): RiskPrediction[] {
  const predictions: RiskPrediction[] = []

  // Cardiovascular Risk
  let cvRisk = 10
  if (data.age > 50) cvRisk += 15
  if (data.bloodPressureSystolic > 140) cvRisk += 20
  if (data.cholesterolTotal > 240) cvRisk += 15
  if (data.smokingStatus === "current") cvRisk += 25
  if (data.exerciseFrequency === "sedentary") cvRisk += 10
  if (data.familyHistory.includes("Heart Disease")) cvRisk += 15
  cvRisk = Math.min(cvRisk, 95)

  predictions.push({
    condition: "Cardiovascular Disease",
    risk: cvRisk,
    severity: cvRisk <= 25 ? "low" : cvRisk <= 50 ? "moderate" : cvRisk <= 75 ? "high" : "critical",
    factors: [
      data.age > 50 ? "Age over 50" : null,
      data.bloodPressureSystolic > 140 ? "High blood pressure" : null,
      data.cholesterolTotal > 240 ? "High cholesterol" : null,
      data.smokingStatus === "current" ? "Active smoking" : null,
      data.exerciseFrequency === "sedentary" ? "Sedentary lifestyle" : null,
    ].filter(Boolean) as string[],
    recommendations: [
      cvRisk > 25 ? "Consider regular cardiovascular screening" : "Maintain healthy lifestyle",
      data.bloodPressureSystolic > 140 ? "Monitor blood pressure regularly" : null,
      data.smokingStatus === "current" ? "Smoking cessation program recommended" : null,
      "Regular aerobic exercise 30 mins daily",
    ].filter(Boolean) as string[],
    icon: HeartPulseIcon,
  })

  // Diabetes Risk
  let diabetesRisk = 8
  if (data.age > 45) diabetesRisk += 10
  if (data.bloodSugar > 100) diabetesRisk += 25
  if (data.exerciseFrequency === "sedentary") diabetesRisk += 15
  if (data.familyHistory.includes("Diabetes")) diabetesRisk += 20
  diabetesRisk = Math.min(diabetesRisk, 95)

  predictions.push({
    condition: "Type 2 Diabetes",
    risk: diabetesRisk,
    severity: diabetesRisk <= 25 ? "low" : diabetesRisk <= 50 ? "moderate" : diabetesRisk <= 75 ? "high" : "critical",
    factors: [
      data.bloodSugar > 100 ? "Elevated blood sugar" : null,
      data.familyHistory.includes("Diabetes") ? "Family history" : null,
      data.exerciseFrequency === "sedentary" ? "Low physical activity" : null,
      data.age > 45 ? "Age over 45" : null,
    ].filter(Boolean) as string[],
    recommendations: [
      diabetesRisk > 25 ? "Regular HbA1c testing recommended" : "Annual glucose screening",
      "Maintain healthy weight",
      "Limit refined carbohydrates",
      "Regular physical activity",
    ],
    icon: ActivityIcon,
  })

  // Stroke Risk
  let strokeRisk = 5
  if (data.age > 55) strokeRisk += 12
  if (data.bloodPressureSystolic > 140) strokeRisk += 25
  if (data.smokingStatus === "current") strokeRisk += 20
  if (data.familyHistory.includes("Stroke")) strokeRisk += 18
  strokeRisk = Math.min(strokeRisk, 95)

  predictions.push({
    condition: "Stroke",
    risk: strokeRisk,
    severity: strokeRisk <= 25 ? "low" : strokeRisk <= 50 ? "moderate" : strokeRisk <= 75 ? "high" : "critical",
    factors: [
      data.bloodPressureSystolic > 140 ? "Hypertension" : null,
      data.smokingStatus === "current" ? "Smoking" : null,
      data.familyHistory.includes("Stroke") ? "Family history" : null,
      data.age > 55 ? "Age factor" : null,
    ].filter(Boolean) as string[],
    recommendations: [
      "Blood pressure management",
      strokeRisk > 25 ? "Consider carotid ultrasound screening" : null,
      "Maintain healthy diet low in sodium",
      "Regular neurological checkups",
    ].filter(Boolean) as string[],
    icon: BrainIcon,
  })

  return predictions
}
