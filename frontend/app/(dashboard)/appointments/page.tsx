import { getAppointments } from "@/app/actions/appointments"
import { CalendarView } from "@/components/appointments/calendar-view"
import { getSession } from "@/lib/auth"

export default async function AppointmentsPage() {
    const session = await getSession()
    const appointments = await getAppointments()

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-30" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-success/10 rounded-full blur-3xl animate-pulse delay-1000" />

            <div className="relative h-[calc(100vh-theme(spacing.24))] p-4 lg:p-8 flex flex-col">
                <CalendarView appointments={appointments} user={session?.user} />
            </div>
        </div>
    )
}
