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
        <div className="min-h-screen relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-success/5 via-success/2 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative p-4 lg:p-8 max-w-5xl mx-auto space-y-8">
                <ProfileHeader user={user} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7">
                        <ProfileForm user={user} />
                    </div>
                    <div className="lg:col-span-5">
                        <SecuritySettings />
                    </div>
                </div>
            </div>
        </div>
    )
}
