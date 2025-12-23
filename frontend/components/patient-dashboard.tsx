"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ActivityIcon, FileTextIcon, HeartPulseIcon, AlertCircleIcon, CalendarIcon } from "@/components/icons"
import { getPatientHealthRecords } from "@/app/actions/patients"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Types
import { HealthRecord, Patient } from "@/lib/db"

// ... imports
import { getAppointments } from "@/app/actions/appointments"
import { getPatientPrescriptions } from "@/app/actions/prescriptions"
import { PillIcon, PlusIcon } from "lucide-react"

export function PatientDashboard({ user }: { user: any }) {
    const [loading, setLoading] = useState(true)
    const [patientProfile, setPatientProfile] = useState<Patient | null>(null)
    const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])
    const [appointments, setAppointments] = useState<any[]>([])
    const [prescriptions, setPrescriptions] = useState<any[]>([])

    useEffect(() => {
        async function fetchData() {
            try {
                const { getPatients } = await import("@/app/actions/patients")
                const patients = await getPatients()

                if (patients && patients.length > 0) {
                    console.log("Dashboard received patients:", patients)
                    console.log("First patient ID:", patients[0].id)
                    setPatientProfile(patients[0])

                    // Fetch all data in parallel
                    const [records, apts, rx] = await Promise.all([
                        getPatientHealthRecords(patients[0].id),
                        getAppointments(),
                        getPatientPrescriptions(patients[0].id)
                    ])

                    setHealthRecords(records)
                    setAppointments(apts)
                    setPrescriptions(rx)
                }
            } catch (error) {
                console.error("Error fetching patient data", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            Loading your health profile...
        </div>
    }

    if (!patientProfile) {
        return (
            <div className="p-8 text-center space-y-4">
                <h2 className="text-2xl font-bold">Welcome, {user.name}</h2>
                <p className="text-muted-foreground">You haven't set up your patient profile yet.</p>
                <Link href="/patients/new">
                    <Button>Create My Health Profile</Button>
                </Link>
            </div>
        )
    }

    const latestRecord = healthRecords[0]
    // Get next upcoming appointment, or if none, get the most recent past one
    const upcomingAppointments = appointments
        .filter(a => new Date(a.start_time) > new Date())
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

    const pastAppointments = appointments
        .filter(a => new Date(a.start_time) <= new Date())
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())

    const displayedAppointment = upcomingAppointments.length > 0 ? upcomingAppointments[0] : (pastAppointments.length > 0 ? pastAppointments[0] : null)
    const isUpcoming = upcomingAppointments.length > 0

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Health Dashboard</h1>
                    <p className="text-muted-foreground">Overview of your latest vitals and reports</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/appointments">
                        <Button className="gap-2">
                            <PlusIcon className="h-4 w-4" /> Book Appointment
                        </Button>
                    </Link>
                    <Link href={`/patients/${patientProfile.id}`}>
                        <Button variant="outline">View Full Profile</Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
                        <ActivityIcon className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(latestRecord as any)?.heartRate || (latestRecord as any)?.heart_rate || "--"} <span className="text-sm font-normal text-muted-foreground">bpm</span></div>
                        <p className="text-xs text-muted-foreground">Latest measurement</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Blood Pressure</CardTitle>
                        <HeartPulseIcon className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {latestRecord ? `${(latestRecord as any).bloodPressureSystolic || (latestRecord as any).blood_pressure_systolic}/${(latestRecord as any).bloodPressureDiastolic || (latestRecord as any).blood_pressure_diastolic}` : "--/--"}
                        </div>
                        <p className="text-xs text-muted-foreground">mmHg</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
                        <PillIcon className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{prescriptions.filter(p => p.status === 'Active').length}</div>
                        <p className="text-xs text-muted-foreground">Current medications</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Last Visit</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{latestRecord ? new Date((latestRecord as any).recordDate || (latestRecord as any).record_date).toLocaleDateString() : "N/A"}</div>
                        <p className="text-xs text-muted-foreground">Check-up date</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Recent Prescriptions</CardTitle>
                        <CardDescription>Your current medication schedule</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {prescriptions.length > 0 ? (
                            <ul className="space-y-4">
                                {prescriptions.slice(0, 3).map((rx: any) => (
                                    <li key={rx.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-secondary/50">
                                        <div>
                                            <p className="font-medium">{rx.medicationName || rx.medication_name}</p>
                                            <p className="text-xs text-muted-foreground">{rx.dosage} - {rx.frequency}</p>
                                        </div>
                                        <span className={`text-[10px] px-2 py-1 rounded-full ${rx.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                            {rx.status}
                                        </span>
                                    </li>
                                ))}
                                {prescriptions.length > 3 && (
                                    <Link href="/prescriptions" className="block text-center text-sm text-primary hover:underline pt-2">
                                        View all
                                    </Link>
                                )}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                <PillIcon className="h-8 w-8 mb-2 opacity-50" />
                                <p>No active prescriptions</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>{isUpcoming ? "Upcoming Appointment" : "Latest Appointment"}</CardTitle>
                        <CardDescription>{isUpcoming ? "Next scheduled check-up" : "Most recent appointment details"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {displayedAppointment ? (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
                                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                        {new Date(displayedAppointment.start_time).getDate()}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{displayedAppointment.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(displayedAppointment.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {!isUpcoming && <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded text-muted-foreground">(Past)</span>}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href="/appointments">Manage Appointments</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground bg-secondary/20 rounded-xl border border-dashed border-border/50">
                                <CalendarIcon className="h-8 w-8 mb-2 opacity-50" />
                                <p>No scheduled appointments</p>
                                <Button variant="link" className="text-primary h-auto p-0 mt-1" asChild>
                                    <Link href="/appointments">Schedule Now</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
