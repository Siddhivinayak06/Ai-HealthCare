import { DashboardHeader } from "@/components/dashboard-header"
import { SettingsForm } from "@/components/settings-form"
import { getSession } from "@/lib/auth"
import { getUserSettings } from "@/app/actions/settings"

export default async function SettingsPage() {
  const { user } = await getSession()
  const settings = await getUserSettings()

  return (
    <div className="p-4 lg:p-8 pt-16 lg:pt-8">
      <DashboardHeader
        title="Settings"
        description="Manage your account settings and preferences"
        showActions={false}
      />

      <div className="mt-8">
        <SettingsForm user={user} settings={settings} />
      </div>
    </div>
  )
}
