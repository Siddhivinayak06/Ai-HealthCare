"use client"

import Link from "next/link"
import { BentoCard } from "./bento-card"
import { ScanIcon, UsersIcon, FileTextIcon, ActivityIcon } from "./icons"

const actions = [
  {
    name: "New Scan",
    description: "Upload medical images",
    icon: ScanIcon,
    href: "/imaging",
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
    <BentoCard>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">Quick Actions</h3>
        <p className="text-sm text-muted-foreground mt-1">Navigate to key features</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.name}
            href={action.href}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-200 ${action.color}`}
          >
            <action.icon className="h-6 w-6" />
            <div className="text-center">
              <p className="text-sm font-medium">{action.name}</p>
              <p className="text-xs opacity-70 hidden sm:block">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </BentoCard>
  )
}
