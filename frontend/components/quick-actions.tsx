"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { ScanIcon, UsersIcon, FileTextIcon, ActivityIcon } from "./icons"

const actions = [
  {
    name: "New Scan",
    description: "Upload medical images",
    icon: ScanIcon,
    href: "/analysis",
    color: "bg-primary/10 text-primary hover:bg-primary/20",
  },
  {
    name: "Patients",
    description: "Manage patient records",
    icon: UsersIcon,
    href: "/patients",
    color: "bg-success/10 text-success hover:bg-success/20",
  },
  {
    name: "Reports",
    description: "View diagnostics",
    icon: FileTextIcon,
    href: "/reports",
    color: "bg-warning/10 text-warning hover:bg-warning/20",
  },
  {
    name: "Activity",
    description: "Recent activity log",
    icon: ActivityIcon,
    href: "/activity",
    color: "bg-chart-5/10 text-chart-5 hover:bg-chart-5/20",
  },
]

export function QuickActions() {
  return (
    <div className="health-card p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground">Quick Actions</h3>
        <p className="text-sm text-muted-foreground mt-1 font-medium">Streamlined access to key clinical tools</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <Link
            key={action.name}
            href={action.href}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all duration-500 overflow-hidden",
              "border border-border/40 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
              "bg-secondary/30 backdrop-blur-sm"
            )}
          >
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-500 group-hover:scale-110",
              action.color
            )}>
              <action.icon className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{action.name}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                Launch
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Link>
        ))}
      </div>
    </div>
  )
}
