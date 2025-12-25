import { getSession } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await getSession()

  return <AppShell user={user}>{children}</AppShell>
}
