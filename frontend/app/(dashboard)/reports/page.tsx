import { DashboardHeader } from "@/components/dashboard-header"
import { ReportsList } from "@/components/reports-list"
import { getReports } from "@/app/actions/reports"
import { getSession } from "@/lib/auth"

export default async function ReportsPage() {
  const reports = await getReports()
  const { user } = await getSession()

  return (
    <div className="p-4 lg:p-8 pt-16 lg:pt-8">
      <DashboardHeader
        title="Reports"
        description="View and download diagnostic reports and analysis summaries"
        showActions={false}
      />

      <div className="mt-8">
        <ReportsList initialReports={reports} userRole={user?.role || "patient"} />
      </div>
    </div>
  )
}
