import { Suspense } from "react"
import { getUserProfile } from "@/app/actions/profile"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileForm } from "@/components/profile/profile-form"
import { SecuritySettings } from "@/components/profile/security-settings"

export default async function ProfilePage() {
    const user = await getUserProfile()

    if (!user) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Failed to load profile. Please try refreshing.
            </div>
        )
    }

    return (
        <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
            <ProfileHeader user={user} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProfileForm user={user} />
                <SecuritySettings />
            </div>
        </div>
    )
}
