import { DashboardHeader } from "@/components/dashboard-header"
import { ActivityList } from "@/components/activity-list"
import { getAllActivity } from "@/app/actions/activity"
import { Activity, Clock, CheckCircle, AlertCircle } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function ActivityPage() {
  const activities = await getAllActivity()

  // Calculate stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayActivities = activities.filter(a => new Date(a.created_at) >= today)
  const successActivities = activities.filter(a => a.action_type === 'success' || !a.action_type?.includes('error'))

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="absolute top-20 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/3 w-96 h-96 bg-success/10 rounded-full blur-3xl" />

      <div className="relative p-4 lg:p-8 pt-16 lg:pt-8 space-y-8">
        {/* Enhanced Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                <Activity className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">Activity Log</h1>
                <p className="text-muted-foreground">Track all system activities and user actions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bento-card p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activities.length}</p>
              <p className="text-sm text-muted-foreground">Total Activities</p>
            </div>
          </div>
          <div className="bento-card p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayActivities.length}</p>
              <p className="text-sm text-muted-foreground">Today</p>
            </div>
          </div>
          <div className="bento-card p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{successActivities.length}</p>
              <p className="text-sm text-muted-foreground">Successful</p>
            </div>
          </div>
          <div className="bento-card p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activities.length - successActivities.length}</p>
              <p className="text-sm text-muted-foreground">Errors</p>
            </div>
          </div>
        </div>

        {/* Activity List */}
        <div className="bento-card p-6">
          <ActivityList initialActivities={activities} />
        </div>
      </div>
    </div>
  )
}
