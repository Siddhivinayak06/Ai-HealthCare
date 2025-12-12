"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Metric {
  label: string
  value: number
  unit: string
  status: "normal" | "warning" | "danger"
  range: string
}

interface HealthMetricsProps {
  metrics: Metric[]
}

export function HealthMetrics({ metrics }: HealthMetricsProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Health Metrics Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {metrics.map((metric, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-secondary/50 space-y-2">
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <div className="flex items-baseline gap-1">
                <span
                  className={cn(
                    "text-2xl font-bold",
                    metric.status === "normal" && "text-success",
                    metric.status === "warning" && "text-warning",
                    metric.status === "danger" && "text-destructive",
                  )}
                >
                  {metric.value}
                </span>
                <span className="text-sm text-muted-foreground">{metric.unit}</span>
              </div>
              <p className="text-xs text-muted-foreground">Normal: {metric.range}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function generateMetrics(data: {
  bloodPressureSystolic: number
  bloodPressureDiastolic: number
  heartRate: number
  bloodSugar: number
  cholesterolTotal: number
  cholesterolHDL: number
  cholesterolLDL: number
  weight: number
  height: number
}): Metric[] {
  const bmi = data.weight / Math.pow(data.height / 100, 2)

  return [
    {
      label: "Blood Pressure",
      value: data.bloodPressureSystolic,
      unit: `/${data.bloodPressureDiastolic} mmHg`,
      status: data.bloodPressureSystolic > 140 ? "danger" : data.bloodPressureSystolic > 130 ? "warning" : "normal",
      range: "< 120/80",
    },
    {
      label: "Heart Rate",
      value: data.heartRate,
      unit: "bpm",
      status: data.heartRate > 100 || data.heartRate < 60 ? "warning" : "normal",
      range: "60-100",
    },
    {
      label: "Blood Sugar",
      value: data.bloodSugar,
      unit: "mg/dL",
      status: data.bloodSugar > 125 ? "danger" : data.bloodSugar > 100 ? "warning" : "normal",
      range: "70-100",
    },
    {
      label: "Total Cholesterol",
      value: data.cholesterolTotal,
      unit: "mg/dL",
      status: data.cholesterolTotal > 240 ? "danger" : data.cholesterolTotal > 200 ? "warning" : "normal",
      range: "< 200",
    },
    {
      label: "HDL Cholesterol",
      value: data.cholesterolHDL,
      unit: "mg/dL",
      status: data.cholesterolHDL < 40 ? "danger" : data.cholesterolHDL < 60 ? "warning" : "normal",
      range: "> 60",
    },
    {
      label: "BMI",
      value: Math.round(bmi * 10) / 10,
      unit: "kg/m²",
      status: bmi > 30 ? "danger" : bmi > 25 ? "warning" : "normal",
      range: "18.5-24.9",
    },
  ]
}
