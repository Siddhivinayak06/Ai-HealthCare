import { Navbar } from "@/components/navbar"

export function AppShell({
  user,
  children,
}: {
  user: any
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar user={user} />
      <main className="relative z-10 flex-1 overflow-auto bg-gradient-to-br from-background via-background to-primary/[0.02] pt-24 lg:pt-28 pb-12">
        {children}
      </main>
    </div>
  )
}
