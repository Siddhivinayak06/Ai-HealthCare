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
import { getDashboardStats, getAnalyticsByMonth, getConditionBreakdown } from "@/app/actions/dashboard"

import { PatientDashboard } from "@/components/patient-dashboard"

export default async function DashboardPage() {
    const { user } = await getSession()

    if (user?.role === "patient" || user?.role === "user") {
        return (
            <div className="min-h-screen relative overflow-hidden">
                {/* Background effects */}
                <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
                <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-success/10 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none" />

                <div className="relative p-4 lg:p-8 space-y-8">
                    <PatientDashboard user={user} />
                    <AIAssistant />
                </div>
            </div>
        )
    }

    // Fetch all dashboard data in parallel
    const [stats, analyticsData, conditionData] = await Promise.all([
        getDashboardStats(),
        getAnalyticsByMonth(),
        getConditionBreakdown()
    ])

    return (
        <div className="min-h-screen relative overflow-hidden bg-background/50">
            {/* Background effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
            <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-gradient-to-bl from-primary/20 via-primary/5 to-transparent rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-emerald-500/10 via-emerald-500/5 to-transparent rounded-full blur-[100px] pointer-events-none animate-pulse delay-700" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,rgba(var(--background),0.8)_100%)] pointer-events-none" />

            <div className="relative p-6 lg:p-10 space-y-10 max-w-[1600px] mx-auto">
                <DashboardHeader
                    title={`Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
                    subtitle="Your intelligent command center for advanced medical diagnostics and AI-powered health insights."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    <div className="lg:col-span-8">
                        <DiagnosticsChart data={analyticsData} />
                    </div>
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <AIStatus />
                        <ConditionBreakdown data={conditionData} totalAnalyses={stats.totalAnalyses} />
                    </div>
                </div>

                {/* Recent Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-9">
                        <RecentAnalyses />
                    </div>
                    <div className="lg:col-span-3">
                        <QuickActions />
                    </div>
                </div>

                <AIAssistant />
            </div>
        </div>
    )
}
