import { getAppointments } from "@/app/actions/appointments"
import { getSession } from "@/lib/auth"
import { AppointmentsClient } from "@/components/appointments/appointments-client"

export default async function AppointmentsPage() {
    const { user } = await getSession()
    const appointments = await getAppointments()

    return (
        <AppointmentsClient appointments={appointments} user={user} />
    )
}
