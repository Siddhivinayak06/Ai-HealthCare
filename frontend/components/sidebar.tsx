"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

import {
  HeartPulseIcon,
  ScanIcon,
  ActivityIcon,
  UsersIcon,
  FileTextIcon,
  ChartIcon,
  SettingsIcon,
  BrainIcon,
  MenuIcon,
  XIcon,
  CalendarIcon,
} from "@/components/icons"

import { PillIcon, ShieldIcon } from "lucide-react"
import { UserMenu } from "@/components/user-menu"
import { ThemeToggle } from "@/components/theme-toggle"

const navigation = [
  { name: "Dashboard", href: "/", icon: ChartIcon },
  { name: "Image Analysis", href: "/analysis", icon: ScanIcon },
  { name: "Patient Data", href: "/patients", icon: UsersIcon },
  { name: "Risk Prediction", href: "/risk", icon: BrainIcon },
  { name: "Reports", href: "/reports", icon: FileTextIcon },
  { name: "Prescriptions", href: "/prescriptions", icon: PillIcon },
  { name: "Appointments", href: "/appointments", icon: CalendarIcon },
  { name: "AI Governance", href: "/model-monitoring", icon: ShieldIcon },
  { name: "Activity", href: "/activity", icon: ActivityIcon },
]

type SidebarProps = {
  user?: {
    id: string
    email: string
    name: string | null
    role: string
  } | null
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const SidebarContent = () => (
    <div className="flex h-full flex-col sidebar-gradient border-r border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 shadow-lg shadow-primary/30">
            <HeartPulseIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">MedAI</h1>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
              Diagnostics Platform
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          if (user?.role === "patient" && item.name === "Patient Data") {
            return null
          }

          const active = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "nav-item-active"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
              )}
            >
              <div className={cn(
                "icon-container h-8 w-8 transition-all duration-200",
                active
                  ? "bg-primary/15 text-primary"
                  : "bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              )}>
                <item.icon className="h-4 w-4" />
              </div>
              <span className={cn(
                "transition-colors",
                active && "text-primary font-semibold"
              )}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/50 px-3 py-4 space-y-2">
        <Link
          href="/settings"
          className={cn(
            "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
            pathname === "/settings"
              ? "nav-item-active"
              : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
          )}
        >
          <div className={cn(
            "icon-container h-8 w-8",
            pathname === "/settings"
              ? "bg-primary/15 text-primary"
              : "bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          )}>
            <SettingsIcon className="h-4 w-4" />
          </div>
          <span className={pathname === "/settings" ? "text-primary font-semibold" : ""}>Settings</span>
        </Link>
        {user && <UserMenu user={user} />}
      </div>
    </div>
  )

  return (
    <>
      {/* 🔹 DESKTOP SIDEBAR (STATIC – NEVER BLOCKS CLICKS) */}
      <aside className="hidden lg:block w-72 h-screen shrink-0">
        <SidebarContent />
      </aside>

      {/* 🔹 MOBILE MENU BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      {/* 🔹 MOBILE OVERLAY */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4"
            >
              <XIcon className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  )
}
