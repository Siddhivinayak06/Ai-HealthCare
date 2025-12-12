import { DashboardHeader } from "@/components/dashboard-header"
import { ActivityList } from "@/components/activity-list"
import { getAllActivity } from "@/app/actions/activity"

export default async function ActivityPage() {
  const activities = await getAllActivity()

  return (
    <div className="p-4 lg:p-8 pt-16 lg:pt-8">
      <DashboardHeader
        title="Activity Log"
        description="Track all system activities and user actions"
        showActions={false}
      />

      <div className="mt-8">
        <ActivityList initialActivities={activities} />
      </div>
    </div>
  )
}
