import { SettingsForm } from "@/components/settings-form"
import { getSession } from "@/lib/auth"
import { getUserSettings } from "@/app/actions/settings"
import { Settings, User, Bell, Shield } from "lucide-react"

export default async function SettingsPage() {
  const { user } = await getSession()
  const settings = await getUserSettings()

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-success/10 rounded-full blur-3xl" />

      <div className="relative p-4 lg:p-8 pt-16 lg:pt-8 space-y-8">
        {/* Enhanced Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                <Settings className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bento-card p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold truncate">{user?.name || 'User'}</p>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <div className="bento-card p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Bell className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="font-semibold">Notifications</p>
              <p className="text-sm text-muted-foreground">{settings?.notifications_enabled ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
          <div className="bento-card p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold">Role</p>
              <p className="text-sm text-muted-foreground capitalize">{user?.role || 'Patient'}</p>
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <div className="bento-card p-6">
          <SettingsForm user={user} settings={settings} />
        </div>
      </div>
    </div>
  )
}
