"use client"

import { Sidebar } from "@/components/sidebar"

export function AppShell({
  user,
  children,
}: {
  user: any
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={user} />
      <main className="relative z-10 flex-1 overflow-auto min-w-0 bg-gradient-to-br from-background via-background to-primary/[0.02]">
        {children}
      </main>
    </div>
  )
}
