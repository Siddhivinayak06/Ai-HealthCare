"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshIcon, ActivityIcon } from "@/components/icons"
import { cn } from "@/lib/utils"
import { getAllActivity } from "@/app/actions/activity"
import type { ActivityLog } from "@/lib/db"

interface ActivityListProps {
  initialActivities: ActivityLog[]
}

function formatTime(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function ActivityList({ initialActivities }: ActivityListProps) {
  const [activities, setActivities] = useState<ActivityLog[]>(initialActivities)

  const refreshActivities = async () => {
    const data = await getAllActivity()
    setActivities(data)
  }

  // Sample activities if no real data exists
  const displayActivities =
    activities.length > 0
      ? activities
      : [
          { id: "1", action: "Image Analysis Completed", action_type: "analysis", created_at: new Date() },
          {
            id: "2",
            action: "New Patient Data Submitted",
            action_type: "data",
            created_at: new Date(Date.now() - 8 * 60 * 1000),
          },
          {
            id: "3",
            action: "Risk Prediction Generated",
            action_type: "prediction",
            created_at: new Date(Date.now() - 15 * 60 * 1000),
          },
          {
            id: "4",
            action: "Report Downloaded",
            action_type: "report",
            created_at: new Date(Date.now() - 22 * 60 * 1000),
          },
          {
            id: "5",
            action: "CT Scan Uploaded",
            action_type: "upload",
            created_at: new Date(Date.now() - 35 * 60 * 1000),
          },
          {
            id: "6",
            action: "Model Accuracy Updated",
            action_type: "system",
            created_at: new Date(Date.now() - 60 * 60 * 1000),
          },
        ]

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-card-foreground">Recent Activity</CardTitle>
          <Button variant="outline" size="sm" onClick={refreshActivities} className="gap-2 bg-background/50">
            <RefreshIcon className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {displayActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
              <ActivityIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No activity recorded yet</p>
            <p className="text-sm text-muted-foreground mt-1">Activities will appear here as you use the platform</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 rounded-xl bg-background/50 ring-1 ring-border/30"
              >
                <div>
                  <p className="font-medium text-card-foreground">{activity.action}</p>
                  <p className="text-sm text-muted-foreground mt-1">{formatTime(activity.created_at)}</p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    activity.action_type === "analysis" && "bg-primary/10 text-primary",
                    activity.action_type === "prediction" && "bg-success/10 text-success",
                    activity.action_type === "data" && "bg-warning/10 text-warning",
                    activity.action_type === "report" && "bg-chart-5/10 text-chart-5",
                    activity.action_type === "upload" && "bg-accent text-accent-foreground",
                    activity.action_type === "system" && "bg-muted text-muted-foreground",
                  )}
                >
                  {activity.action_type}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
