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
  { name: "Activity", href: "/activity", icon: ActivityIcon },
]
import { PillIcon } from "lucide-react"

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
  const [mobileOpen, setMobileOpen] = useState(false)

  const isSettingsActive = pathname === "/settings"

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-card/90 backdrop-blur-sm border border-border/50 shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <XIcon className="h-5 w-5 text-foreground" /> : <MenuIcon className="h-5 w-5 text-foreground" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - updated with Bento styling */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 ease-out",
          "bg-sidebar/80 backdrop-blur-xl border-r border-sidebar-border/30",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo - enhanced with glow effect */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-sidebar-border/30">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30">
                <HeartPulseIcon className="h-5 w-5 text-primary-foreground" />
                <div className="absolute inset-0 rounded-xl bg-primary/20 blur-xl" />
              </div>
              <div>
                <h1 className="font-bold text-sidebar-foreground text-lg tracking-tight">MedAI</h1>
                <p className="text-xs text-muted-foreground font-medium">Diagnostics Platform</p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          {/* Navigation - enhanced with better hover states */}
          <nav className="flex-1 px-4 py-6 space-y-1.5">
            <p className="px-3 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Main Menu</p>
            {navigation.map((item) => {
              // RBAC Logic
              if (user?.role === "patient") {
                if (["Patient Data", "Reports"].includes(item.name)) {
                  // Keep these but maybe rename "Patient Data" to "My Profile"?
                  // Or just hide "Patient Data" list view since they have the dashboard?
                  // Actually, let's HIDE "Patient Data" list view for patients, as they can access it from Dashboard.
                  // HIDE "Risk Prediction" unless they want to self-assess? Let's keep it.
                  if (item.name === "Patient Data") return null;
                }
              }

              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "bg-sidebar-accent/50 text-muted-foreground group-hover:bg-sidebar-accent group-hover:text-sidebar-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </div>
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Bottom section */}
          <div className="px-4 py-4 border-t border-sidebar-border/30 space-y-1.5">
            <Link
              href="/settings"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isSettingsActive
                  ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                  isSettingsActive
                    ? "bg-primary/15 text-primary"
                    : "bg-sidebar-accent/50 text-muted-foreground group-hover:bg-sidebar-accent group-hover:text-sidebar-foreground",
                )}
              >
                <SettingsIcon className="h-4 w-4" />
              </div>
              Settings
            </Link>
            {user && <UserMenu user={user} />}
          </div>
        </div>
      </aside>
    </>
  )
}
