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
    recentScans?: any[]
}

export function PatientDashboard({
    user,
    initialProfile,
    initialRecords,
    initialPredictions,
    recentScans = []
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

                <div className="md:col-span-3 lg:col-span-4 h-full">
                    <div className="hospital-card p-6 h-full group hover:border-rose-200/50 dark:hover:border-rose-500/20">
                        <div className="flex items-start justify-between mb-8">
                            <div className="h-14 w-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform duration-500">
                                <ActivityIcon className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-bold text-rose-500 uppercase tracking-[0.2em] mb-1">Status</div>
                                <span className="flex h-2.5 w-2.5 ml-auto rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Resting Heart Rate</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-5xl font-black tracking-tighter text-slate-800 dark:text-slate-100">{latestRecord?.heartRate || "--"}</p>
                                <span className="text-xl font-bold text-muted-foreground/50">bpm</span>
                            </div>
                            <div className="flex items-center gap-2 pt-2 text-xs font-bold text-emerald-500 uppercase tracking-wide">
                                <TrendingUpIcon className="h-3.5 w-3.5 rotate-180" />
                                <span>Within range</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-3 lg:col-span-4 h-full">
                    <div className="hospital-card p-6 h-full group hover:border-violet-200/50 dark:hover:border-violet-500/20">
                        <div className="flex items-start justify-between mb-8">
                            <div className="h-14 w-14 rounded-2xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform duration-500">
                                <HeartPulseIcon className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-bold text-violet-500 uppercase tracking-[0.2em] mb-1">Confidence</div>
                                <div className="text-sm font-black text-violet-600 dark:text-violet-400">98%</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Blood Pressure</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-5xl font-black tracking-tighter text-slate-800 dark:text-slate-100">
                                    {latestRecord ? `${latestRecord.bloodPressureSystolic}/${latestRecord.bloodPressureDiastolic}` : "--/--"}
                                </p>
                                <span className="text-xl font-bold text-muted-foreground/50">mmHg</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Last Sync: Clinical Intake</p>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-6 lg:col-span-4 h-full">
                    <div className="hospital-card p-6 h-full group bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/10 hover:border-amber-500/20">
                        <div className="flex items-start justify-between mb-8">
                            <div className="h-14 w-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-500 group-hover:scale-110 transition-transform duration-500">
                                <CalendarIcon className="h-6 w-6" />
                            </div>
                            <div className="h-8 w-8 rounded-full bg-amber-500/5 flex items-center justify-center text-amber-600">
                                <RefreshCwIcon className="h-4 w-4 animate-spin-slow" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Follow-up Window</p>
                            <p className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Active Plan</p>
                            <p className="text-[10px] text-amber-600/80 font-bold flex items-center gap-1.5 mt-2 uppercase tracking-wide">
                                <AlertCircleIcon className="h-3.5 w-3.5" /> 30-day review suggested
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
                                                        <div className="text-xl font-bold">{Math.round(insight.riskScore)}%</div>
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
                                        <p className="text-muted-foreground font-medium">No risk assessment available. Run a checkup now.</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2">
                                <Link href="/risk" className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline group/link">
                                    Run Clinical Risk Assessment
                                    <ArrowRightIcon className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </BentoCard>
                </div>

                {/* Patient Overview Card */}
                <div className="md:col-span-6 lg:col-span-4">
                    <div className="hospital-card p-0 flex flex-col h-full overflow-hidden shadow-lg border-slate-200/60 dark:border-white/10">
                        <div className="bg-gradient-to-br from-violet-600/5 via-fuchsia-600/5 to-transparent p-6 pb-20 relative">
                            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="h-16 w-16 rounded-2xl bg-white dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center text-violet-600 dark:text-white text-2xl font-black shadow-sm">
                                    {patientProfile.firstName[0]}{patientProfile.lastName[0]}
                                </div>
                                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em]">Verified</div>
                            </div>
                        </div>
                        <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl flex-1 p-6 -mt-16 rounded-t-[2.5rem] relative z-20 space-y-6 border-t border-white/50 dark:border-white/5">
                            <div className="space-y-1">
                                <h4 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{patientProfile.firstName} {patientProfile.lastName}</h4>
                                <div className="flex gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                                    <span>Age: {patientProfile.age || "N/A"}</span>
                                    <span>Blood: {patientProfile.bloodType || "N/A"}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-3">
                                        <ShieldCheckIcon className="h-4 w-4 text-emerald-500" />
                                        <span className="text-xs font-bold tracking-wide uppercase text-slate-600 dark:text-slate-300">Data Integrity</span>
                                    </div>
                                    <span className="text-[10px] font-black text-emerald-500 tracking-wider">SECURE</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-3">
                                        <BrainIcon className="h-4 w-4 text-violet-500" />
                                        <span className="text-xs font-bold tracking-wide uppercase text-slate-600 dark:text-slate-300">ML Personalized</span>
                                    </div>
                                    <span className="text-[10px] font-black text-violet-500 tracking-wider">ENABLED</span>
                                </div>
                            </div>

                            <Button variant="outline" className="w-full h-11 rounded-xl border-slate-200 dark:border-white/10 font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-all uppercase tracking-wider text-[10px]" asChild>
                                <Link href="/profile">Update Settings</Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Recent AI Scans Card */}
                <div className="md:col-span-12">
                    <Card className="hospital-card border-slate-200/60 dark:border-white/10 shadow-sm bg-white/60 dark:bg-card/40 overflow-hidden">
                        <CardHeader className="p-6 pb-4 border-b border-border/5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-muted-foreground">
                                        <BrainIcon className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                        Recent AI Scans
                                    </CardTitle>
                                    <CardDescription className="text-xs font-medium opacity-80">Latest imaging analysis results.</CardDescription>
                                </div>
                                <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-500/10 rounded-lg h-8" asChild>
                                    <Link href="/analysis">View All</Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recentScans && recentScans.length > 0 ? (
                                <div className="divide-y divide-border/5">
                                    {recentScans.slice(0, 4).map((scan: any) => (
                                        <div key={scan.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group cursor-pointer">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 flex flex-col items-center justify-center border border-cyan-100 dark:border-cyan-500/20 group-hover:scale-105 transition-transform duration-300 text-cyan-600 dark:text-cyan-400">
                                                    <BrainIcon className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors uppercase">{scan.scanType}</p>
                                                        <span className={cn(
                                                            "text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                                            scan.severity?.toLowerCase().includes("normal") || scan.severity?.toLowerCase().includes("low")
                                                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                                : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                        )}>
                                                            {scan.severity}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground font-bold flex items-center gap-3">
                                                        <span>{scan.diagnosis || "Analysis Pending"}</span>
                                                        <span className="opacity-50">•</span>
                                                        <span className="font-medium text-[10px]">{new Date(scan.createdAt).toLocaleDateString("en-US")}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-black text-slate-700 dark:text-slate-200">{scan.confidence}%</div>
                                                <div className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Confidence</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <p className="text-xs text-muted-foreground">No recent scans found.</p>
                                    <Button variant="link" className="text-cyan-500 text-xs" asChild>
                                        <Link href="/analysis">Upload a scan</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Clinical Activity Table Space */}
                <div className="md:col-span-12">
                    <Card className="hospital-card border-slate-200/60 dark:border-white/10 shadow-sm bg-white/60 dark:bg-card/40 overflow-hidden">
                        <CardHeader className="p-6 pb-4 border-b border-border/5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-muted-foreground">
                                        <FileTextIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                        Clinical History
                                    </CardTitle>
                                    <CardDescription className="text-xs font-medium opacity-80">Chronicle of your manual clinical records.</CardDescription>
                                </div>
                                <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-widest text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-500/10 rounded-lg h-8">
                                    Export PDF
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {healthRecords.length > 0 ? (
                                <div className="divide-y divide-border/5">
                                    {healthRecords.slice(0, 4).map((record, idx) => (
                                        <div key={record.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex flex-col items-center justify-center border border-slate-200 dark:border-white/10 group-hover:scale-105 transition-transform duration-300">
                                                    <span className="text-[9px] font-bold opacity-40 leading-none mb-0.5">{new Date(record.recordDate || "").toLocaleString('en-US', { month: 'short' }).toUpperCase()}</span>
                                                    <span className="text-lg font-black leading-none text-slate-700 dark:text-slate-200">{new Date(record.recordDate || "").getDate()}</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">Clinical Intake Session</p>
                                                        <span className="text-[9px] bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Record</span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-3">
                                                        <span className="flex items-center gap-1.5"><HeartPulseIcon className="h-3 w-3 text-slate-400" /> {record.bloodPressureSystolic}/{record.bloodPressureDiastolic}</span>
                                                        <span className="flex items-center gap-1.5"><ActivityIcon className="h-3 w-3 text-slate-400" /> {record.heartRate} bpm</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-violet-50 dark:hover:bg-white/10 text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" asChild>
                                                <Link href={`/patients/${patientProfile.id}`}>
                                                    <ArrowRightIcon className="h-4.5 w-4.5" />
                                                </Link>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-16 text-center space-y-3">
                                    <div className="h-16 w-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-200 dark:border-white/10 text-muted-foreground/30">
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
