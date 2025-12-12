"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ActivityIcon, FileTextIcon, HeartPulseIcon, AlertCircleIcon, CalendarIcon } from "@/components/icons"
import { getPatientHealthRecords } from "@/app/actions/patients"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Types
import { HealthRecord, Patient } from "@/lib/db"

export function PatientDashboard({ user }: { user: any }) {
    const [loading, setLoading] = useState(true)
    const [patientProfile, setPatientProfile] = useState<Patient | null>(null)
    const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])

    useEffect(() => {
        async function fetchData() {
            // For a patient role, getPatients returns their own list (which should contain 1 item)
            // Or we can try to fetch their specific patient record if we knew the ID. 
            // But acts of creating a patient profile logic for new users:
            // If they don't have a profile, we should probably prompt them to create one.

            try {
                // We use the same 'getPatients' action which now returns the user's own profile(s)
                const { getPatients } = await import("@/app/actions/patients")
                const patients = await getPatients()

                if (patients && patients.length > 0) {
                    setPatientProfile(patients[0])
                    const records = await getPatientHealthRecords(patients[0].id)
                    setHealthRecords(records)
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
        return <div className="p-8 text-center text-muted-foreground">Loading your health profile...</div>
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Health Dashboard</h1>
                    <p className="text-muted-foreground">Overview of your latest vitals and reports</p>
                </div>
                <Link href={`/patients/${patientProfile.id}`}>
                    <Button variant="outline">View Full Profile</Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
                        <ActivityIcon className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{latestRecord?.heart_rate || "--"} <span className="text-sm font-normal text-muted-foreground">bpm</span></div>
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
                            {latestRecord ? `${latestRecord.blood_pressure_systolic}/${latestRecord.blood_pressure_diastolic}` : "--/--"}
                        </div>
                        <p className="text-xs text-muted-foreground">mmHg</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Risk Status</CardTitle>
                        <AlertCircleIcon className="h-4 w-4 text-warning" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Low Risk</div>
                        <p className="text-xs text-muted-foreground">Based on recent analysis</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Last Visit</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{latestRecord ? new Date(latestRecord.record_date).toLocaleDateString() : "N/A"}</div>
                        <p className="text-xs text-muted-foreground">Check-up date</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Recent Recommendations</CardTitle>
                        <CardDescription>AI-generated health insights</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                                <span className="text-primary mt-1">•</span>
                                <span>Maintain current exercise routine (3x/week) to keep heart health optimal.</span>
                            </li>
                            <li className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                                <span className="text-primary mt-1">•</span>
                                <span>Monitor cholesterol levels given the family history markers.</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Upcoming Appointments</CardTitle>
                        <CardDescription>Scheduled check-ups and tests</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground bg-secondary/20 rounded-xl border border-dashed border-border/50">
                            <CalendarIcon className="h-8 w-8 mb-2 opacity-50" />
                            <p>No upcoming appointments</p>
                            <Button variant="link" className="text-primary h-auto p-0 mt-1">Schedule Now</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
