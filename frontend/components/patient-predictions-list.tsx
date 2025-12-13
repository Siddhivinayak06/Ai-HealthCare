"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface PatientPrediction {
  id: string
  patientName: string
  patientId: string
  condition: string
  riskScore: number
  lastUpdated: string
  trend: "improving" | "stable" | "worsening"
}

interface PatientPredictionsListProps {
  data?: PatientPrediction[]
}

export function PatientPredictionsList({ data = [] }: PatientPredictionsListProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-card-foreground">Patient Risk Predictions</CardTitle>
        <Button variant="outline" size="sm" className="bg-transparent">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No patient predictions yet.</p>
            <p className="text-sm mt-2">Run risk assessments to see predictions here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((prediction) => (
              <div
                key={prediction.id}
                className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-card-foreground">{prediction.patientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {prediction.patientId} • {prediction.condition}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      prediction.trend === "improving" && "bg-success/10 text-success",
                      prediction.trend === "stable" && "bg-primary/10 text-primary",
                      prediction.trend === "worsening" && "bg-destructive/10 text-destructive",
                    )}
                  >
                    {prediction.trend}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Risk Score</span>
                    <span
                      className={cn(
                        "font-semibold",
                        prediction.riskScore <= 30 && "text-success",
                        prediction.riskScore > 30 && prediction.riskScore <= 60 && "text-warning",
                        prediction.riskScore > 60 && "text-destructive",
                      )}
                    >
                      {prediction.riskScore}%
                    </span>
                  </div>
                  <Progress
                    value={prediction.riskScore}
                    className={cn(
                      "h-2",
                      prediction.riskScore <= 30 && "[&>div]:bg-success",
                      prediction.riskScore > 30 && prediction.riskScore <= 60 && "[&>div]:bg-warning",
                      prediction.riskScore > 60 && "[&>div]:bg-destructive",
                    )}
                  />
                  <p className="text-xs text-muted-foreground">Updated {prediction.lastUpdated}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

