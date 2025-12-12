import type React from "react"
import { getSession } from "@/lib/auth"
import { Sidebar } from "@/components/sidebar"

export async function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = await getSession()

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
