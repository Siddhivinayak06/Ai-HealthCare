"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CheckCircleIcon, AlertCircleIcon, ClockIcon } from "@/components/icons"

interface TimelineEvent {
  id: string
  date: string
  type: "analysis" | "prediction" | "followup"
  title: string
  description: string
  status: "completed" | "pending" | "scheduled"
  risk?: "low" | "moderate" | "high"
}

const timelineEvents: TimelineEvent[] = [
  {
    id: "1",
    date: "Today",
    type: "analysis",
    title: "Chest X-Ray Analysis",
    description: "AI detected minor opacity in lower right lung",
    status: "completed",
    risk: "low",
  },
  {
    id: "2",
    date: "Today",
    type: "prediction",
    title: "Cardiovascular Risk Assessment",
    description: "32% risk score based on current health metrics",
    status: "completed",
    risk: "moderate",
  },
  {
    id: "3",
    date: "Tomorrow",
    type: "followup",
    title: "Scheduled CT Scan",
    description: "Follow-up imaging for lung opacity monitoring",
    status: "scheduled",
  },
  {
    id: "4",
    date: "Dec 15",
    type: "prediction",
    title: "Diabetes Risk Review",
    description: "Quarterly assessment based on updated lab results",
    status: "pending",
  },
  {
    id: "5",
    date: "Dec 20",
    type: "analysis",
    title: "Blood Panel Analysis",
    description: "Comprehensive metabolic panel review",
    status: "pending",
  },
]

export function PredictionTimeline() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
          {timelineEvents.map((event) => (
            <div key={event.id} className="relative flex gap-4 pl-10">
              {/* Timeline dot */}
              <div
                className={cn(
                  "absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full",
                  event.status === "completed" && "bg-success/10",
                  event.status === "scheduled" && "bg-primary/10",
                  event.status === "pending" && "bg-muted",
                )}
              >
                {event.status === "completed" && <CheckCircleIcon className="h-4 w-4 text-success" />}
                {event.status === "scheduled" && <ClockIcon className="h-4 w-4 text-primary" />}
                {event.status === "pending" && <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-card-foreground">{event.title}</p>
                  {event.risk && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        event.risk === "low" && "bg-success/10 text-success",
                        event.risk === "moderate" && "bg-warning/10 text-warning",
                        event.risk === "high" && "bg-destructive/10 text-destructive",
                      )}
                    >
                      {event.risk} risk
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{event.description}</p>
                <p className="text-xs text-muted-foreground">{event.date}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
