"use client"

import { useState } from "react"
import {
    CheckCircle2Icon,
    XCircleIcon,
    ClockIcon,
    CalendarIcon,
    UserIcon,
    StethoscopeIcon,
    MoreVerticalIcon,
    LoaderIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { updateAppointmentStatus } from "@/app/actions/appointments"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface Appointment {
    id: string
    title: string
    startTime: Date | string
    endTime: Date | string
    status: string
    type: string
    notes?: string
    patientName?: string
    doctorName?: string
}

interface AppointmentListProps {
    appointments: Appointment[]
    isDoctor: boolean
}

export function AppointmentList({ appointments, isDoctor }: AppointmentListProps) {
    const [updating, setUpdating] = useState<string | null>(null)

    const handleStatusUpdate = async (id: string, status: string) => {
        setUpdating(id)
        try {
            const result = await updateAppointmentStatus(id, status)
            if (result.success) {
                toast.success(`Appointment marked as ${status}`)
            } else {
                toast.error("Failed to update status")
            }
        } catch (error) {
            toast.error("Something went wrong")
        } finally {
            setUpdating(null)
        }
    }

    const getStatusStyles = (status: string) => {
        switch (status.toLowerCase()) {
            case "scheduled":
                return "bg-blue-500/10 text-blue-400 border-blue-500/20"
            case "completed":
                return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            case "cancelled":
                return "bg-rose-500/10 text-rose-400 border-rose-500/20"
            default:
                return "bg-slate-500/10 text-slate-400 border-slate-500/20"
        }
    }

    if (appointments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-secondary/20 rounded-3xl border border-dashed border-border/50">
                <CalendarIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">No appointments scheduled</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {appointments.map((appt) => {
                const start = new Date(appt.startTime)
                const isPast = start < new Date() && appt.status === "scheduled"

                return (
                    <div
                        key={appt.id}
                        className={cn(
                            "group relative overflow-hidden health-card p-5 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5",
                            appt.status === "cancelled" && "opacity-60"
                        )}
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110",
                                    appt.status === "completed" ? "bg-emerald-500/20" : "bg-primary/20"
                                )}>
                                    {isDoctor ? (
                                        <UserIcon className={cn("h-6 w-6", appt.status === "completed" ? "text-emerald-400" : "text-primary")} />
                                    ) : (
                                        <StethoscopeIcon className={cn("h-6 w-6", appt.status === "completed" ? "text-emerald-400" : "text-primary")} />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-lg leading-tight">{appt.title}</h3>
                                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                                        {isDoctor ? (
                                            <><UserIcon className="h-3.5 w-3.5" /> Patient: {appt.patientName}</>
                                        ) : (
                                            <><StethoscopeIcon className="h-3.5 w-3.5" /> Specialist: {appt.doctorName}</>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 md:gap-8">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-foreground font-bold">
                                        <CalendarIcon className="h-4 w-4 text-primary/70" />
                                        {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                        <ClockIcon className="h-4 w-4 text-muted-foreground/50" />
                                        {start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className={cn("px-3 py-1 rounded-full font-bold uppercase text-[10px] tracking-widest", getStatusStyles(appt.status))}>
                                        {appt.status}
                                    </Badge>

                                    {appt.status === "scheduled" && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-secondary">
                                                    <MoreVerticalIcon className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl border-border/50 bg-background/95 backdrop-blur-xl">
                                                <DropdownMenuItem
                                                    className="gap-2 text-emerald-500 focus:text-emerald-500 rounded-lg cursor-pointer"
                                                    onClick={() => handleStatusUpdate(appt.id, "completed")}
                                                >
                                                    <CheckCircle2Icon className="h-4 w-4" /> Mark Completed
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="gap-2 text-rose-500 focus:text-rose-500 rounded-lg cursor-pointer"
                                                    onClick={() => handleStatusUpdate(appt.id, "cancelled")}
                                                >
                                                    <XCircleIcon className="h-4 w-4" /> Cancel Appointment
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </div>
                        </div>

                        {appt.notes && (
                            <div className="mt-4 pt-4 border-t border-border/30">
                                <p className="text-xs text-muted-foreground leading-relaxed italic">
                                    <span className="font-bold not-italic mr-1">Notes:</span> {appt.notes}
                                </p>
                            </div>
                        )}

                        {updating === appt.id && (
                            <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] flex items-center justify-center z-10 transition-opacity">
                                <LoaderIcon className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        )}

                        {isPast && appt.status === "scheduled" && (
                            <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-[10px] font-bold animate-pulse">
                                OVERDUE
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
