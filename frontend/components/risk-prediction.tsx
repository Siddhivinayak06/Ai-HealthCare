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
    <div className="space-y-4">
      {predictions.map((prediction, idx) => (
        <Card
          key={idx}
          className={cn(
            "bg-card border-border overflow-hidden",
            prediction.severity === "critical" && "border-destructive/50",
            prediction.severity === "high" && "border-warning/50",
          )}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    prediction.severity === "low" && "bg-success/10",
                    prediction.severity === "moderate" && "bg-primary/10",
                    prediction.severity === "high" && "bg-warning/10",
                    prediction.severity === "critical" && "bg-destructive/10",
                  )}
                >
                  <prediction.icon
                    className={cn(
                      "h-5 w-5",
                      prediction.severity === "low" && "text-success",
                      prediction.severity === "moderate" && "text-primary",
                      prediction.severity === "high" && "text-warning",
                      prediction.severity === "critical" && "text-destructive",
                    )}
                  />
                </div>
                <div>
                  <CardTitle className="text-lg text-card-foreground">{prediction.condition}</CardTitle>
                  <p className="text-sm text-muted-foreground">Risk Assessment</p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  prediction.severity === "low" && "bg-success/10 text-success",
                  prediction.severity === "moderate" && "bg-primary/10 text-primary",
                  prediction.severity === "high" && "bg-warning/10 text-warning",
                  prediction.severity === "critical" && "bg-destructive/10 text-destructive",
                )}
              >
                {prediction.severity} risk
              </Badge>
              {prediction.confidence_metrics && (
                <ConfidenceBadge
                  confidence={prediction.confidence_metrics.confidence}
                  uncertainty={prediction.confidence_metrics.uncertainty_level}
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Risk Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-card-foreground">Risk Score</span>
                <span
                  className={cn(
                    "text-lg font-bold",
                    prediction.risk <= 25 && "text-success",
                    prediction.risk > 25 && prediction.risk <= 50 && "text-primary",
                    prediction.risk > 50 && prediction.risk <= 75 && "text-warning",
                    prediction.risk > 75 && "text-destructive",
                  )}
                >
                  {prediction.risk}%
                </span>
              </div>
              <Progress
                value={prediction.risk}
                className={cn(
                  "h-3",
                  prediction.risk <= 25 && "[&>div]:bg-success",
                  prediction.risk > 25 && prediction.risk <= 50 && "[&>div]:bg-primary",
                  prediction.risk > 50 && prediction.risk <= 75 && "[&>div]:bg-warning",
                  prediction.risk > 75 && "[&>div]:bg-destructive",
                )}
              />
            </div>

            {/* Contributing Factors */}
            <div>
              <h5 className="text-sm font-medium text-card-foreground mb-2 flex items-center gap-2">
                <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />
                Contributing Factors
              </h5>
              <div className="flex flex-wrap gap-2">
                {prediction.factors.map((factor, factorIdx) => (
                  <Badge key={factorIdx} variant="outline" className="bg-secondary/50">
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h5 className="text-sm font-medium text-card-foreground mb-2 flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 text-success" />
                Recommendations
              </h5>
              <ul className="space-y-1">
                {prediction.recommendations.map((rec, recIdx) => (
                  <li key={recIdx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    {rec}
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
          </CardContent>
        </Card>
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
