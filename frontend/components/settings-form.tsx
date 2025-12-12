"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserIcon, ShieldIcon, SettingsIcon, LoaderIcon, CheckCircleIcon } from "@/components/icons"
import { updateProfile, updateUserSettings, changePassword } from "@/app/actions/settings"
import type { User, UserSettings } from "@/lib/db"

interface SettingsFormProps {
  user: Omit<User, "password_hash"> | null
  settings: UserSettings | null
}

export function SettingsForm({ user, settings }: SettingsFormProps) {
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [settingsSuccess, setSettingsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [preferencesData, setPreferencesData] = useState({
    notificationsEnabled: settings?.notifications_enabled ?? true,
    emailAlerts: settings?.email_alerts ?? true,
    darkMode: settings?.dark_mode ?? true,
    language: settings?.language || "en",
    timezone: settings?.timezone || "UTC",
    defaultScanType: settings?.default_scan_type || "none", // Updated default value to "none"
  })

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true)
    setError(null)
    setProfileSuccess(false)

    const result = await updateProfile(profileData)

    setIsUpdatingProfile(false)
    if (result.success) {
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } else {
      setError(result.error || "Failed to update profile")
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match")
      return
    }

    if (passwordData.newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsUpdatingPassword(true)
    setError(null)
    setPasswordSuccess(false)

    const result = await changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    })

    setIsUpdatingPassword(false)
    if (result.success) {
      setPasswordSuccess(true)
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setTimeout(() => setPasswordSuccess(false), 3000)
    } else {
      setError(result.error || "Failed to change password")
    }
  }

  const handleUpdateSettings = async () => {
    setIsUpdatingSettings(true)
    setError(null)
    setSettingsSuccess(false)

    const result = await updateUserSettings(preferencesData)

    setIsUpdatingSettings(false)
    if (result.success) {
      setSettingsSuccess(true)
      setTimeout(() => setSettingsSuccess(false), 3000)
    } else {
      setError(result.error || "Failed to update settings")
    }
  }

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList className="bg-muted/50">
        <TabsTrigger value="profile" className="gap-2">
          <UserIcon className="h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="security" className="gap-2">
          <ShieldIcon className="h-4 w-4" />
          Security
        </TabsTrigger>
        <TabsTrigger value="preferences" className="gap-2">
          <SettingsIcon className="h-4 w-4" />
          Preferences
        </TabsTrigger>
      </TabsList>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <TabsContent value="profile">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your account profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
                {profileData.name ? profileData.name[0].toUpperCase() : profileData.email[0].toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-card-foreground">{profileData.name || "No name set"}</p>
                <p className="text-sm text-muted-foreground">{profileData.email}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">Role: {user?.role || "user"}</p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Enter your full name"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Enter your email"
                  className="bg-background/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleUpdateProfile} disabled={isUpdatingProfile}>
                {isUpdatingProfile ? (
                  <>
                    <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              {profileSuccess && (
                <span className="text-success text-sm flex items-center gap-1">
                  <CheckCircleIcon className="h-4 w-4" />
                  Profile updated
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                  className="bg-background/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleChangePassword}
                disabled={isUpdatingPassword || !passwordData.currentPassword || !passwordData.newPassword}
              >
                {isUpdatingPassword ? (
                  <>
                    <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
              {passwordSuccess && (
                <span className="text-success text-sm flex items-center gap-1">
                  <CheckCircleIcon className="h-4 w-4" />
                  Password changed
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="preferences">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your application experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications about analysis results</p>
                </div>
                <Switch
                  id="notifications"
                  checked={preferencesData.notificationsEnabled}
                  onCheckedChange={(checked) => setPreferencesData((p) => ({ ...p, notificationsEnabled: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailAlerts">Email Alerts</Label>
                  <p className="text-sm text-muted-foreground">Receive email alerts for high-risk predictions</p>
                </div>
                <Switch
                  id="emailAlerts"
                  checked={preferencesData.emailAlerts}
                  onCheckedChange={(checked) => setPreferencesData((p) => ({ ...p, emailAlerts: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="darkMode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Use dark theme for the interface</p>
                </div>
                <Switch
                  id="darkMode"
                  checked={preferencesData.darkMode}
                  onCheckedChange={(checked) => setPreferencesData((p) => ({ ...p, darkMode: checked }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={preferencesData.language}
                  onValueChange={(v) => setPreferencesData((p) => ({ ...p, language: v }))}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select
                  value={preferencesData.timezone}
                  onValueChange={(v) => setPreferencesData((p) => ({ ...p, timezone: v }))}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Default Scan Type</Label>
              <Select
                value={preferencesData.defaultScanType}
                onValueChange={(v) => setPreferencesData((p) => ({ ...p, defaultScanType: v }))}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select default scan type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No default</SelectItem> {/* Updated value to "none" */}
                  <SelectItem value="chest-xray">Chest X-Ray</SelectItem>
                  <SelectItem value="brain-mri">Brain MRI</SelectItem>
                  <SelectItem value="ct-scan">CT Scan</SelectItem>
                  <SelectItem value="mammogram">Mammogram</SelectItem>
                  <SelectItem value="spine-xray">Spine X-Ray</SelectItem>
                  <SelectItem value="bone-scan">Bone Scan</SelectItem>
                  <SelectItem value="ultrasound">Ultrasound</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleUpdateSettings} disabled={isUpdatingSettings}>
                {isUpdatingSettings ? (
                  <>
                    <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Preferences"
                )}
              </Button>
              {settingsSuccess && (
                <span className="text-success text-sm flex items-center gap-1">
                  <CheckCircleIcon className="h-4 w-4" />
                  Settings saved
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
