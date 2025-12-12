"use client"

import { useTransition } from "react"
import { signOut } from "@/app/actions/auth"
import { LogOutIcon, UserIcon, SettingsIcon, ChevronDownIcon } from "@/components/icons"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"

type UserMenuProps = {
  user: {
    id: string
    email: string
    name: string | null
    role: string
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const [isPending, startTransition] = useTransition()

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase()

  function handleSignOut() {
    startTransition(() => {
      signOut()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium bg-secondary/30 hover:bg-secondary/50 transition-all duration-200 outline-none ring-1 ring-border/30">
        <Avatar className="h-9 w-9 ring-2 ring-primary/20">
          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 text-left min-w-0">
          <p className="truncate font-semibold text-sidebar-foreground">{user.name || "User"}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 shadow-xl bg-popover/95 backdrop-blur-xl border-border/50">
        <DropdownMenuLabel className="font-semibold">My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2 cursor-pointer font-medium">
            <UserIcon className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2 cursor-pointer font-medium">
            <SettingsIcon className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isPending}
          className="text-destructive focus:text-destructive cursor-pointer font-medium"
        >
          <LogOutIcon className="h-4 w-4 mr-2" />
          {isPending ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
