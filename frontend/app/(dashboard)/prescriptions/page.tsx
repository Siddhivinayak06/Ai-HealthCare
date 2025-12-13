"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getPatientPrescriptions } from "@/app/actions/prescriptions"
import { PillIcon, CalendarIcon, CheckCircleIcon, ClockIcon, Pill, AlertCircle } from "lucide-react"

export default function PrescriptionsPage() {
    const [prescriptions, setPrescriptions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchRx() {
            try {
                const { getPatients } = await import("@/app/actions/patients")
                const patients = await getPatients()

                if (patients && patients.length > 0) {
                    const rx = await getPatientPrescriptions(patients[0].id)
                    setPrescriptions(rx)
                }
            } catch (error) {
                console.error("Failed to load prescriptions", error)
            } finally {
                setLoading(false)
            }
        }
        fetchRx()
    }, [])

    const activePrescriptions = prescriptions.filter(p => p.status === 'Active')
    const inactivePrescriptions = prescriptions.filter(p => p.status !== 'Active')

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground">Loading prescriptions...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-20" />
            <div className="absolute top-20 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-success/10 rounded-full blur-3xl" />

            <div className="relative p-4 lg:p-8 pt-16 lg:pt-8 space-y-8">
                {/* Enhanced Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                                <Pill className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">My Prescriptions</h1>
                                <p className="text-muted-foreground">Manage your medications and dosage schedules</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bento-card p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <PillIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{prescriptions.length}</p>
                            <p className="text-sm text-muted-foreground">Total Prescriptions</p>
                        </div>
                    </div>
                    <div className="bento-card p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                            <CheckCircleIcon className="h-6 w-6 text-success" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{activePrescriptions.length}</p>
                            <p className="text-sm text-muted-foreground">Active</p>
                        </div>
                    </div>
                    <div className="bento-card p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                            <AlertCircle className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{inactivePrescriptions.length}</p>
                            <p className="text-sm text-muted-foreground">Completed/Inactive</p>
                        </div>
                    </div>
                </div>

                {/* Prescription Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {prescriptions.map((px) => (
                        <div key={px.id} className="bento-card p-0 overflow-hidden group">
                            <div className={`h-1.5 ${px.status === 'Active' ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-gray-400 to-gray-300'}`} />
                            <div className="p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${px.status === 'Active' ? 'bg-success/10' : 'bg-muted'}`}>
                                            <PillIcon className={`h-5 w-5 ${px.status === 'Active' ? 'text-success' : 'text-muted-foreground'}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground">{px.medication_name}</h3>
                                            <p className="text-sm text-muted-foreground">{px.dosage}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${px.status === 'Active'
                                            ? 'bg-success/10 text-success border border-success/20'
                                            : 'bg-muted text-muted-foreground border border-border'
                                        }`}>
                                        {px.status}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <ClockIcon className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Frequency:</span>
                                        <span className="font-medium">{px.frequency}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Duration:</span>
                                        <span className="font-medium">{px.duration}</span>
                                    </div>
                                </div>

                                {px.notes && (
                                    <div className="bg-secondary/50 p-3 rounded-xl text-sm text-muted-foreground italic border border-border/50">
                                        "{px.notes}"
                                    </div>
                                )}

                                <div className="pt-3 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <CheckCircleIcon className="h-3.5 w-3.5" />
                                        Dr. {px.doctor_name || 'N/A'}
                                    </span>
                                    <span>{new Date(px.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {prescriptions.length === 0 && (
                    <div className="bento-card p-12 text-center">
                        <PillIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                        <h3 className="text-xl font-semibold mb-2">No Prescriptions Found</h3>
                        <p className="text-muted-foreground">You don't have any prescriptions at the moment.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
