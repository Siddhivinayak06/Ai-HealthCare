import { DashboardHeader } from "@/components/dashboard-header"
import { ReportsList } from "@/components/reports-list"
import { getReports } from "@/app/actions/reports"
import { getSession } from "@/lib/auth"
import { FileText } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const reports = await getReports()
  const { user } = await getSession()

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-warning/10 rounded-full blur-3xl" />

      <div className="relative p-4 lg:p-8 pt-16 lg:pt-8 space-y-8">
        {/* Enhanced Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">Reports</h1>
                <p className="text-muted-foreground">View and download diagnostic reports and analysis summaries</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bento-card p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{reports.length}</p>
              <p className="text-sm text-muted-foreground">Total Reports</p>
            </div>
          </div>
          <div className="bento-card p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{reports.filter(r => r.status === 'completed').length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
          <div className="bento-card p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{reports.filter(r => r.status === 'pending').length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="bento-card p-6">
          <ReportsList initialReports={reports} userRole={user?.role || "patient"} />
        </div>
      </div>
    </div>
  )
}
