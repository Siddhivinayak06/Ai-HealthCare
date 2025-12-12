"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

const modelData = [
  { model: "Chest X-Ray", accuracy: 94, color: "var(--primary)" },
  { model: "Brain MRI", accuracy: 91, color: "var(--success)" },
  { model: "CT Scan", accuracy: 89, color: "var(--chart-3)" },
  { model: "Mammogram", accuracy: 93, color: "var(--chart-4)" },
  { model: "Cardiac Risk", accuracy: 87, color: "var(--chart-5)" },
  { model: "Diabetes Risk", accuracy: 85, color: "var(--muted-foreground)" },
]

export function ModelAccuracy() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Model Accuracy by Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={modelData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis type="category" dataKey="model" stroke="var(--muted-foreground)" fontSize={12} width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--card-foreground)",
                }}
                formatter={(value: number) => [`${value}%`, "Accuracy"]}
              />
              <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
                {modelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
