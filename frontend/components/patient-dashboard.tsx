"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ActivityIcon, FileTextIcon, HeartPulseIcon, AlertCircleIcon, CalendarIcon } from "@/components/icons"
import { getPatients, getPatientHealthRecords } from "@/app/actions/patients"
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"

// Types
import { HealthRecord, Patient } from "@/lib/db"

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
                const patients = await getPatients()

                if (patients && patients.length > 0) {
                    const profile = patients[0]
                    setPatientProfile(profile)

                    // Fetch all data in parallel
                    const [records, apts, rx] = await Promise.all([
                        getPatientHealthRecords(profile.id),
                        getAppointments(),
                        getPatientPrescriptions(profile.id)
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
            <div className="p-8 text-center space-y-4 relative z-50">
                <h2 className="text-2xl font-bold">Welcome, {user.name}</h2>
                <p className="text-muted-foreground">You haven't set up your patient profile yet.</p>
                <Link href="/patients/new" className={buttonVariants({ variant: "default" })}>
                    Create My Health Profile
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
        <div className="relative space-y-8 p-6 lg:p-8">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
            <div className="absolute top-10 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none animate-float" />
            <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none animate-float" style={{ animationDelay: '3s' }} />

            {/* Header Section */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight text-primary">My Health Dashboard</h1>
                    <p className="text-muted-foreground text-lg">Welcome back! Here's your latest health overview.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/appointments">
                        <Button className="btn-gradient gap-2 h-11 px-6 rounded-xl shadow-lg shadow-primary/20">
                            <PlusIcon className="h-4 w-4" /> Book Appointment
                        </Button>
                    </Link>
                    <Link href={`/patients/${patientProfile.id}`}>
                        <Button variant="outline" className="h-11 px-6 rounded-xl border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all">
                            View Full Profile
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Vital Stats Grid */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="health-card metric-card-heart p-5 group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="icon-container icon-container-heart h-12 w-12 group-hover:scale-110 transition-transform">
                            <ActivityIcon className="h-5 w-5" />
                        </div>
                        <span className="status-dot status-dot-active" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Heart Rate</p>
                        <p className="text-3xl font-bold tracking-tight">{latestRecord?.heartRate || "--"} <span className="text-lg font-normal text-muted-foreground">bpm</span></p>
                        <p className="text-xs text-muted-foreground/70">Latest measurement</p>
                    </div>
                </div>

                <div className="health-card metric-card-pulse p-5 group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="icon-container icon-container-pulse h-12 w-12 group-hover:scale-110 transition-transform">
                            <HeartPulseIcon className="h-5 w-5" />
                        </div>
                        {latestRecord?.bloodPressureSystolic && latestRecord.bloodPressureSystolic > 140 ? (
                            <span className="status-dot status-dot-warning" />
                        ) : (
                            <span className="status-dot status-dot-active" />
                        )}
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Blood Pressure</p>
                        <p className="text-3xl font-bold tracking-tight">
                            {latestRecord ? `${latestRecord.bloodPressureSystolic}/${latestRecord.bloodPressureDiastolic}` : "--/--"}
                        </p>
                        <p className="text-xs text-muted-foreground/70">mmHg</p>
                    </div>
                </div>

                <div className="health-card metric-card-vitals p-5 group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="icon-container icon-container-vitals h-12 w-12 group-hover:scale-110 transition-transform">
                            <PillIcon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                            Active
                        </span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Prescriptions</p>
                        <p className="text-3xl font-bold tracking-tight">{prescriptions.filter(p => p.status === 'Active').length}</p>
                        <p className="text-xs text-muted-foreground/70">Current medications</p>
                    </div>
                </div>

                <div className="health-card metric-card-calendar p-5 group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="icon-container icon-container-warning h-12 w-12 group-hover:scale-110 transition-transform">
                            <CalendarIcon className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Last Visit</p>
                        <p className="text-3xl font-bold tracking-tight">{latestRecord?.recordDate ? new Date(latestRecord.recordDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "N/A"}</p>
                        <p className="text-xs text-muted-foreground/70">Check-up date</p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Prescriptions Card */}
                <div className="health-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="icon-container icon-container-vitals h-10 w-10">
                                <PillIcon className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Recent Prescriptions</h3>
                                <p className="text-sm text-muted-foreground">Your current medication schedule</p>
                            </div>
                        </div>
                        {prescriptions.length > 0 && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                                {prescriptions.filter(p => p.status === 'Active').length} active
                            </span>
                        )}
                    </div>

                    {prescriptions.length > 0 ? (
                        <div className="space-y-3">
                            {prescriptions.slice(0, 3).map((rx: any) => (
                                <div key={rx.id} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-secondary/30 border border-border/30 hover:border-primary/30 hover:bg-secondary/50 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center text-lg">
                                            💊
                                        </div>
                                        <div>
                                            <p className="font-medium group-hover:text-primary transition-colors">{rx.medicationName || rx.medication_name}</p>
                                            <p className="text-xs text-muted-foreground">{rx.dosage} • {rx.frequency}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide ${rx.status === 'Active' ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20' : 'bg-muted text-muted-foreground'}`}>
                                        {rx.status}
                                    </span>
                                </div>
                            ))}
                            {prescriptions.length > 3 && (
                                <Link href="/prescriptions" className="flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium text-primary hover:bg-primary/5 transition-colors">
                                    View all prescriptions →
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                                <PillIcon className="h-8 w-8 opacity-40" />
                            </div>
                            <p className="font-medium">No active prescriptions</p>
                            <p className="text-sm text-muted-foreground/70">Your medications will appear here</p>
                        </div>
                    )}
                </div>

                {/* Appointments Card */}
                <div className="health-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="icon-container icon-container-warning h-10 w-10">
                                <CalendarIcon className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{isUpcoming ? "Upcoming Appointment" : "Latest Appointment"}</h3>
                                <p className="text-sm text-muted-foreground">{isUpcoming ? "Next scheduled check-up" : "Most recent visit"}</p>
                            </div>
                        </div>
                    </div>

                    {displayedAppointment ? (
                        <div className="space-y-4">
                            <div className="relative p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-violet-500/5 to-transparent border border-primary/20 overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-primary/15 transition-colors" />
                                <div className="relative flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex flex-col items-center justify-center text-white shadow-lg shadow-primary/30">
                                        <span className="text-2xl font-bold leading-none">{new Date(displayedAppointment.start_time).getDate()}</span>
                                        <span className="text-[10px] font-medium uppercase opacity-80">{new Date(displayedAppointment.start_time).toLocaleDateString('en-US', { month: 'short' })}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-lg">{displayedAppointment.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-sm text-muted-foreground">
                                                {new Date(displayedAppointment.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {!isUpcoming && (
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                                                    Completed
                                                </span>
                                            )}
                                            {isUpcoming && (
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                                                    Scheduled
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full h-11 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all" asChild>
                                <Link href="/appointments">Manage Appointments</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed border-border/50 rounded-2xl">
                            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                                <CalendarIcon className="h-8 w-8 opacity-40" />
                            </div>
                            <p className="font-medium">No scheduled appointments</p>
                            <p className="text-sm text-muted-foreground/70 mb-4">Book your next check-up</p>
                            <Button className="btn-gradient rounded-xl" asChild>
                                <Link href="/appointments">Schedule Now</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
