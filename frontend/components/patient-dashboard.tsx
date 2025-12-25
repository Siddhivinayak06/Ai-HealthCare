"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ActivityIcon, FileTextIcon, HeartPulseIcon, AlertCircleIcon, CalendarIcon, BrainIcon, TrendingUpIcon, ShieldCheckIcon } from "@/components/icons"
import { getPatients, getPatientHealthRecords } from "@/app/actions/patients"
import { getPatientPredictions } from "@/app/actions/dashboard"
import { Button, buttonVariants } from "@/components/ui/button"
import { PlusIcon, ArrowRightIcon, RefreshCwIcon, ShieldIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { BentoCard } from "./bento-card"
import { StatCard } from "./stat-card"

// Types
import { HealthRecord, Patient, AIInsight, RiskLevel, getRiskLevel } from "@/lib/types/health"

interface PatientDashboardProps {
    user: any
    initialProfile: Patient | null
    initialRecords: HealthRecord[]
    initialPredictions: AIInsight[]
}

export function PatientDashboard({
    user,
    initialProfile,
    initialRecords,
    initialPredictions
}: PatientDashboardProps) {
    const [patientProfile] = useState<Patient | null>(initialProfile)
    const [healthRecords] = useState<HealthRecord[]>(initialRecords)
    const [aiInsights] = useState<AIInsight[]>(initialPredictions)

    const hour = new Date().getHours()
    const greeting =
        hour < 12 ? "Good Morning" :
            hour < 18 ? "Good Afternoon" :
                "Good Evening"


    if (!patientProfile) {
        return (
            <div className="p-12 text-center space-y-6 relative max-w-2xl mx-auto">
                <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20 mb-4">
                    <ShieldIcon className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Welcome to MedAI, {user.name}</h2>
                <p className="text-lg text-muted-foreground">Your intelligent health journey starts here. Let's set up your profile to start receiving AI-powered insights.</p>
                <Link href="/patients/new" className={cn(buttonVariants({ size: "lg" }), "btn-gradient h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 group")}>
                    Create My Health Profile
                    <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        )
    }

    const latestRecord = healthRecords[0]

    return (
        <div className="relative space-y-10">
            {/* Header Section with Glassmorphism */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-4 border-b border-border/50">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-[0.2em]">Clinical Monitoring Active</span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-gradient-primary">
                        {greeting}, {patientProfile.firstName}
                    </h1>
                    <p className="text-muted-foreground text-sm max-w-xl">
                        AI-powered health overview. Your records are processed via
                        <span className="text-foreground font-medium mx-1">Privacy-Preserving ML</span>
                        and are HIPAA-compliant.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link href="/analysis">
                        <Button className="btn-gradient gap-2 h-12 px-6 rounded-xl shadow-lg shadow-primary/20 group">
                            <PlusIcon className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                            New AI Analysis
                        </Button>
                    </Link>
                    <Link href={`/patients/${patientProfile.id}`}>
                        <Button variant="outline" className="h-12 px-6 rounded-xl border-border/50 bg-card/50 backdrop-blur-sm hover:bg-primary/5 transition-all text-sm font-semibold">
                            Patient Record
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Main Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 pb-12">

                {/* Vitals Bento Area (Top Row) */}
                <div className="md:col-span-3 lg:col-span-4 h-full">
                    <div className="health-card metric-card-heart p-6 h-full group">
                        <div className="flex items-start justify-between mb-8">
                            <div className="icon-container icon-container-heart h-14 w-14 group-hover:scale-110 transition-all duration-500 rounded-2xl shadow-inner shadow-rose-500/10">
                                <ActivityIcon className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-rose-500/80 uppercase tracking-widest mb-1">Status</div>
                                <span className="status-dot status-dot-active" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Resting Heart Rate</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-5xl font-black tracking-tighter">{latestRecord?.heartRate || "--"}</p>
                                <span className="text-xl font-bold text-muted-foreground/50">bpm</span>
                            </div>
                            <div className="flex items-center gap-2 pt-2 text-xs font-medium text-emerald-500">
                                <TrendingUpIcon className="h-3 w-3 rotate-180" />
                                <span>Within normal range</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-3 lg:col-span-4 h-full">
                    <div className="health-card metric-card-pulse p-6 h-full group">
                        <div className="flex items-start justify-between mb-8">
                            <div className="icon-container icon-container-pulse h-14 w-14 group-hover:scale-110 transition-all duration-500 rounded-2xl shadow-inner shadow-violet-500/10">
                                <HeartPulseIcon className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-violet-500/80 uppercase tracking-widest mb-1">Confidence</div>
                                <div className="text-sm font-black text-violet-500">98%</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Blood Pressure</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-5xl font-black tracking-tighter">
                                    {latestRecord ? `${latestRecord.bloodPressureSystolic}/${latestRecord.bloodPressureDiastolic}` : "--/--"}
                                </p>
                                <span className="text-xl font-bold text-muted-foreground/50">mmHg</span>
                            </div>
                            <p className="text-xs text-muted-foreground/70 font-medium">Last recorded via clinical intake</p>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-6 lg:col-span-4 h-full">
                    <div className="health-card metric-card-calendar p-5 h-full group bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/10">
                        <div className="flex items-start justify-between mb-6">
                            <div className="icon-container icon-container-warning h-12 w-12 group-hover:scale-110 transition-all duration-500 rounded-xl shadow-inner shadow-amber-500/10">
                                <CalendarIcon className="h-5 w-5" />
                            </div>
                            <div className="h-8 w-8 rounded-full bg-amber-500/5 flex items-center justify-center text-amber-600">
                                <RefreshCwIcon className="h-3.5 w-3.5 animate-spin-slow" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Follow-up Window</p>
                            <p className="text-2xl font-bold tracking-tight">Active Plan</p>
                            <p className="text-[10px] text-amber-600/80 font-bold flex items-center gap-1 mt-1">
                                <AlertCircleIcon className="h-3 w-3" /> System suggests 30-day review
                            </p>
                        </div>
                    </div>
                </div>

                {/* AI Insights & Predictions (Core Feature) */}
                <div className="md:col-span-6 lg:col-span-8">
                    <BentoCard variant="feature" className="p-0 border-primary/20 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-8 pt-10 opacity-5 group-hover:opacity-10 transition-opacity">
                            <BrainIcon className="h-32 w-32 text-primary" />
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-glow-sm">
                                    <BrainIcon className="h-6 w-6" />
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="text-xl font-black tracking-tight tracking-tight">AI Health Insights</h3>
                                    <p className="text-sm text-muted-foreground font-medium">Predictive risk analysis based on your history</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {aiInsights.length > 0 ? (
                                    aiInsights.map((insight) => {
                                        const riskLevel = getRiskLevel(insight.riskScore)
                                        return (
                                            <div key={insight.id} className="glass-panel p-4 rounded-xl border-white/5 bg-white/5 space-y-2 hover:bg-white/10 transition-colors">
                                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-primary/80">
                                                    <span>{insight.condition}</span>
                                                    <span className={cn(
                                                        "px-1.5 py-0.5 rounded font-black",
                                                        riskLevel === RiskLevel.HIGH && "bg-rose-500/10 text-rose-500",
                                                        riskLevel === RiskLevel.MODERATE && "bg-amber-500/10 text-amber-500",
                                                        riskLevel === RiskLevel.LOW && "bg-emerald-500/10 text-emerald-500"
                                                    )}>
                                                        {riskLevel} Risk
                                                    </span>
                                                </div>
                                                <div className="flex items-end justify-between">
                                                    <div>
                                                        <div className="text-xl font-bold">{insight.riskScore}%</div>
                                                        <div className="text-[9px] text-muted-foreground font-bold tracking-tighter uppercase">Confidence Index</div>
                                                    </div>
                                                    <div className="h-8 w-20 bg-primary/5 rounded-lg flex items-center justify-center border border-primary/10">
                                                        <div className="h-1 w-14 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className={cn("h-full rounded-full", insight.riskScore > 70 ? "bg-rose-500" : "bg-emerald-500")}
                                                                style={{ width: `${insight.riskScore}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                {insight.explanation && (
                                                    <p className="text-[9px] text-muted-foreground leading-tight mt-1 border-t border-white/5 pt-1.5 italic">
                                                        {insight.explanation}
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="col-span-2 py-10 text-center border-2 border-dashed border-border/50 rounded-2xl">
                                        <BrainIcon className="h-12 w-12 mx-auto mb-3 opacity-20 text-primary" />
                                        <p className="text-muted-foreground font-medium">Analyzing diagnostic data for new insights...</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2">
                                <Link href="/analysis" className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline group/link">
                                    Run comprehensive AI screen
                                    <ArrowRightIcon className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </BentoCard>
                </div>

                {/* Patient Overview Card */}
                <div className="md:col-span-6 lg:col-span-4">
                    <div className="health-card p-0 flex flex-col h-full overflow-hidden border-none shadow-2xl">
                        <div className="bg-gradient-to-br from-primary/20 via-primary/5 to-transparent p-6 pb-20 relative">
                            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-primary text-2xl font-black">
                                    {patientProfile.firstName[0]}{patientProfile.lastName[0]}
                                </div>
                                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest">Verified Patient</div>
                            </div>
                        </div>
                        <div className="bg-card flex-1 p-6 -mt-16 rounded-t-[2.5rem] relative z-20 space-y-6">
                            <div className="space-y-1">
                                <h4 className="text-2xl font-black tracking-tight">{patientProfile.firstName} {patientProfile.lastName}</h4>
                                <div className="flex gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    <span>Age: {patientProfile.age || "N/A"}</span>
                                    <span>Blood: {patientProfile.bloodType || "N/A"}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/50 border border-border/50">
                                    <div className="flex items-center gap-3">
                                        <ShieldCheckIcon className="h-5 w-5 text-emerald-500" />
                                        <span className="text-sm font-bold tracking-tight">Data Integrity</span>
                                    </div>
                                    <span className="text-xs font-black text-emerald-500">SECURE</span>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/50 border border-border/50">
                                    <div className="flex items-center gap-3">
                                        <BrainIcon className="h-5 w-5 text-primary" />
                                        <span className="text-sm font-bold tracking-tight">ML Personalized</span>
                                    </div>
                                    <span className="text-xs font-black text-primary">ENABLED</span>
                                </div>
                            </div>

                            <Button variant="outline" className="w-full h-12 rounded-xl border-border/50 font-bold hover:bg-primary/5 transition-all" asChild>
                                <Link href="/profile">Update Profile Settings</Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Table Space */}
                <div className="md:col-span-12">
                    <Card className="health-card border-none shadow-xl bg-card/40 backdrop-blur-md overflow-hidden">
                        <CardHeader className="p-6 pb-2">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2.5">
                                        <FileTextIcon className="h-5 w-5 text-primary" />
                                        Clinical History
                                    </CardTitle>
                                    <CardDescription className="text-xs font-medium">Chronicle of your clinical records and AI diagnostics.</CardDescription>
                                </div>
                                <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 rounded-lg h-8">
                                    Export PDF
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 px-6 pb-6">
                            {healthRecords.length > 0 ? (
                                <div className="rounded-xl border border-white/5 overflow-hidden">
                                    <div className="grid grid-cols-12 gap-0">
                                        {healthRecords.slice(0, 4).map((record, idx) => (
                                            <div key={record.id} className={cn(
                                                "col-span-12 flex items-center justify-between p-4 transition-all hover:bg-white/5 group/row",
                                                idx !== healthRecords.slice(0, 4).length - 1 && "border-b border-border/20"
                                            )}>
                                                <div className="flex items-center gap-5">
                                                    <div className="h-11 w-11 rounded-xl bg-secondary flex flex-col items-center justify-center border border-border/40 group-hover/row:scale-105 transition-transform">
                                                        <span className="text-[9px] font-bold opacity-40 leading-none">JAN</span>
                                                        <span className="text-base font-bold leading-none">{new Date(record.recordDate || "").getDate()}</span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-bold tracking-tight group-hover/row:text-primary transition-colors">Clinical Intake Session</p>
                                                            <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold uppercase">Record</span>
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-3 mt-0.5">
                                                            <span className="flex items-center gap-1"><HeartPulseIcon className="h-2.5 w-2.5" /> {record.bloodPressureSystolic}/{record.bloodPressureDiastolic}</span>
                                                            <span className="flex items-center gap-1"><ActivityIcon className="h-2.5 w-2.5" /> {record.heartRate} bpm</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary opacity-0 group-hover/row:opacity-100 transition-all" asChild>
                                                    <Link href={`/patients/${patientProfile.id}`}>
                                                        <ArrowRightIcon className="h-4.5 w-4.5" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-16 text-center space-y-3">
                                    <div className="h-16 w-16 bg-secondary/30 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-border/40 text-muted-foreground/30">
                                        <ActivityIcon className="h-8 w-8" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-base font-bold tracking-tight">Syncing History</p>
                                        <p className="text-xs text-muted-foreground">Initializing secure data pipeline...</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-12 py-6 border-t border-border/50">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <ShieldIcon className="h-3 w-3" />
                            <span>HIPAA Protected Environment</span>
                        </div>
                        <p className="max-w-md text-center md:text-right leading-relaxed opacity-60">
                            Disclaimer: AI health insights are advisory and do not constitute a professional medical diagnosis or treatment plan.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
