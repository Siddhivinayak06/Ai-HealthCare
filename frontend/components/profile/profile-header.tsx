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
        <div className="health-card relative overflow-hidden border-none shadow-2xl shadow-primary/5">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-violet-600/20 via-primary/10 to-cyan-500/20 animate-pulse" />
            <div className="absolute top-32 left-0 w-full h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

            <div className="relative flex flex-col md:flex-row items-center md:items-end gap-8 px-8 pt-16 pb-8">
                <div className="relative group">
                    <Avatar className="h-32 w-32 ring-4 ring-background shadow-2xl transition-transform duration-500 group-hover:scale-105">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-br from-primary via-violet-500 to-primary text-4xl font-black text-white shadow-inner">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute -inset-2 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                </div>

                <div className="flex-1 text-center md:text-left space-y-4">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">{user.name || "User"}</h1>
                        <p className="text-lg text-muted-foreground font-medium mt-1">{user.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <Badge className="bg-primary/10 text-primary border-primary/20 capitalize px-3 py-1 text-xs font-bold ring-1 ring-primary/20">
                            {user.role}
                        </Badge>
                        {user.created_at && (
                            <Badge variant="outline" className="text-muted-foreground border-border/50 px-3 py-1 text-xs font-medium bg-muted/30">
                                Member since {new Date(user.created_at).getFullYear()}
                            </Badge>
                        )}
                        <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 px-3 py-1 text-xs font-medium bg-emerald-500/5">
                            Active Account
                        </Badge>
                    </div>
                </div>
            </div>
        </div>
    )
}
