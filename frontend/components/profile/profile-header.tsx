"use client"

import { BentoCard } from "@/components/bento-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface ProfileHeaderProps {
    user: {
        name: string | null
        email: string
        role: string
        created_at?: string
    }
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
    const initials = user.name
        ? user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : user.email[0].toUpperCase()

    return (
        <BentoCard className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />

            <div className="relative flex flex-col md:flex-row items-center md:items-end gap-6 pt-12 pb-2">
                <Avatar className="h-24 w-24 ring-4 ring-card shadow-xl">
                    <AvatarImage src="" /> {/* Add image upload later */}
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-3xl font-bold text-primary-foreground">
                        {initials}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center md:text-left space-y-2 mb-2">
                    <div>
                        <h1 className="text-2xl font-bold text-card-foreground">{user.name || "User"}</h1>
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 capitialize">
                            {user.role}
                        </Badge>
                        {user.created_at && (
                            <Badge variant="outline" className="text-muted-foreground border-border/50">
                                Member since {new Date(user.created_at).getFullYear()}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
        </BentoCard>
    )
}
