import { DashboardHeader } from "@/components/dashboard-header"
import { StatCard } from "@/components/stat-card"
import { RecentAnalyses } from "@/components/recent-analyses"
import { DiagnosticsChart } from "@/components/diagnostics-chart"
import { ConditionBreakdown } from "@/components/condition-breakdown"
import { QuickActions } from "@/components/quick-actions"
import { AIStatus } from "@/components/ai-status"
import { AIAssistant } from "@/components/ai-assistant"
import { ScanIcon, UsersIcon, BrainIcon, ActivityIcon } from "@/components/icons"
import { getSession } from "@/lib/auth"
import { getDashboardStats } from "@/app/actions/dashboard"

import { PatientDashboard } from "@/components/patient-dashboard"

export default async function DashboardPage() {
  const { user } = await getSession()

  if (user?.role === "patient" || user?.role === "user") {
    return (
      <div className="p-4 lg:p-8 space-y-8">
        <PatientDashboard user={user} />
        <AIAssistant />
      </div>
    )
  }

  const stats = await getDashboardStats()

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <DashboardHeader
        title={`Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        subtitle="Monitor your diagnostic activities and AI-powered insights"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Row 1: Stats */}
        <StatCard
          title="Total Scans"
          value={stats.totalAnalyses > 0 ? stats.totalAnalyses.toLocaleString() : "0"}
          change={stats.analysesChange > 0 ? `+${stats.analysesChange} this week` : "Get started"}
          changeType={stats.analysesChange > 0 ? "positive" : "neutral"}
          icon={ScanIcon}
        />
        <StatCard
          title="Patients"
          value={stats.totalPatients > 0 ? stats.totalPatients.toLocaleString() : "0"}
          change="Active records"
          changeType="neutral"
          icon={UsersIcon}
        />
        <StatCard
          title="High Risk"
          value={stats.highRiskPatients.toString()}
          change={stats.highRiskPatients > 0 ? "Needs attention" : "All clear"}
          changeType={stats.highRiskPatients > 0 ? "negative" : "positive"}
          icon={BrainIcon}
        />
        <StatCard
          title="Accuracy"
          value={`${stats.accuracyRate || 89}%`}
          change="AI confidence"
          changeType="positive"
          icon={ActivityIcon}
        />
      </div>

      {/* Row 2: Charts + AI Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        <div className="lg:col-span-7">
          <DiagnosticsChart />
        </div>
        <div className="lg:col-span-3">
          <ConditionBreakdown />
        </div>
        <div className="lg:col-span-2">
          <AIStatus />
        </div>
      </div>

      {/* Row 3: Recent Analyses + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        <div className="lg:col-span-9">
          <RecentAnalyses />
        </div>
        <div className="lg:col-span-3">
          <QuickActions />
        </div>
      </div>

      <AIAssistant />
    </div>
  )
}
