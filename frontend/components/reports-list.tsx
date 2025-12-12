"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileTextIcon, DownloadIcon, LoaderIcon, RefreshIcon } from "@/components/icons"
import { createReport, getReports, deleteReport } from "@/app/actions/reports"
import type { Report } from "@/lib/db"

interface ReportsListProps {
  initialReports: Report[]
  userRole: string
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function ReportsList({ initialReports, userRole }: ReportsListProps) {
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newReport, setNewReport] = useState({
    title: "",
    reportType: "",
  })

  const refreshReports = async () => {
    const data = await getReports()
    setReports(data)
  }

  const handleCreateReport = async () => {
    if (!newReport.title || !newReport.reportType) return

    setIsCreating(true)
    const result = await createReport({
      title: newReport.title,
      reportType: newReport.reportType,
      content: {
        generatedAt: new Date().toISOString(),
        type: newReport.reportType,
        summary: "AI-generated diagnostic summary report",
      },
    })
    setIsCreating(false)

    if (result.success) {
      setIsDialogOpen(false)
      setNewReport({ title: "", reportType: "" })
      refreshReports()
    }
  }

  const handleDeleteReport = async (id: string) => {
    if (confirm("Are you sure you want to delete this report?")) {
      await deleteReport(id)
      refreshReports()
    }
  }

  // Sample reports if no real data exists
  const displayReports =
    reports.length > 0
      ? reports
      : [
        {
          id: "sample-1",
          title: "Monthly Diagnostic Summary - December 2025",
          report_type: "Summary Report",
          created_at: new Date(),
          status: "ready",
          file_size: "2.4 MB",
        },
        {
          id: "sample-2",
          title: "Patient Risk Assessment Report - Q4",
          report_type: "Risk Analysis",
          created_at: new Date(Date.now() - 86400000),
          status: "ready",
          file_size: "1.8 MB",
        },
      ]

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-card-foreground">Generated Reports</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshReports} className="gap-2 bg-background/50">
              <RefreshIcon className="h-4 w-4" />
              Refresh
            </Button>
            {userRole === "doctor" && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <FileTextIcon className="h-4 w-4" />
                    Generate Report
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate New Report</DialogTitle>
                    <DialogDescription>Create a new diagnostic or summary report.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Report Title</Label>
                      <Input
                        id="title"
                        value={newReport.title}
                        onChange={(e) => setNewReport((r) => ({ ...r, title: e.target.value }))}
                        placeholder="Monthly Diagnostic Summary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Report Type</Label>
                      <Select
                        value={newReport.reportType}
                        onValueChange={(v) => setNewReport((r) => ({ ...r, reportType: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Summary Report">Summary Report</SelectItem>
                          <SelectItem value="Risk Analysis">Risk Analysis</SelectItem>
                          <SelectItem value="Performance Report">Performance Report</SelectItem>
                          <SelectItem value="Weekly Report">Weekly Report</SelectItem>
                          <SelectItem value="Research Report">Research Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateReport} disabled={isCreating}>
                      {isCreating ? (
                        <>
                          <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
                          Generating...
                        </>
                      ) : (
                        "Generate"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {displayReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
              <FileTextIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No reports generated yet</p>
            {userRole === "doctor" && (
              <p className="text-sm text-muted-foreground mt-1">Click "Generate Report" to create your first report</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 rounded-xl bg-background/50 hover:bg-muted/50 transition-colors ring-1 ring-border/30"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <FileTextIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-card-foreground">{report.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">{report.report_type}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{formatDate(report.created_at)}</span>
                      {report.file_size && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{report.file_size}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className={report.status === "ready" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}
                  >
                    {report.status === "ready" ? "Ready" : "Generating..."}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-background/50"
                    disabled={report.status !== "ready"}
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Download
                  </Button>
                  {!report.id.startsWith("sample") && userRole === "doctor" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteReport(report.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
