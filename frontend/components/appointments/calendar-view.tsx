"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, User } from "lucide-react"
import { AppointmentDialog } from "./appointment-dialog"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface Appointment {
    id: string
    title: string
    start_time: string
    end_time: string
    type: string
    patient_id: string
    first_name?: string
    last_name?: string
}

interface CalendarViewProps {
    appointments: Appointment[]
    user?: any
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8)

const typeColors: Record<string, string> = {
    checkup: "from-blue-500/20 to-blue-600/20 border-blue-500",
    followup: "from-green-500/20 to-green-600/20 border-green-500",
    emergency: "from-red-500/20 to-red-600/20 border-red-500",
    consultation: "from-purple-500/20 to-purple-600/20 border-purple-500",
}

export function CalendarView({ appointments, user }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
    const router = useRouter()

    const getWeekStart = (date: Date) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day
        return new Date(d.setDate(diff))
    }

    const weekStart = getWeekStart(currentDate)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const nextWeek = () => {
        const d = new Date(currentDate)
        d.setDate(d.getDate() + 7)
        setCurrentDate(d)
    }

    const prevWeek = () => {
        const d = new Date(currentDate)
        d.setDate(d.getDate() - 7)
        setCurrentDate(d)
    }

    const goToToday = () => {
        setCurrentDate(new Date())
    }

    const handleCreate = (date: Date) => {
        setSelectedDate(date)
        setSelectedAppointment(null)
        setDialogOpen(true)
    }

    const handleEdit = (apt: Appointment) => {
        setSelectedAppointment(apt)
        setDialogOpen(true)
    }

    const totalAppointmentsThisWeek = appointments.filter(apt => {
        const aptDate = new Date(apt.start_time)
        return aptDate >= weekStart && aptDate <= weekEnd
    }).length

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        <Calendar className="inline-block mr-3 h-8 w-8 text-primary" />
                        Appointment Schedule
                    </h1>
                    <p className="text-muted-foreground">
                        {totalAppointmentsThisWeek} appointment{totalAppointmentsThisWeek !== 1 ? 's' : ''} this week
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-secondary/50 backdrop-blur-sm rounded-xl p-1.5 border border-border/50">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={prevWeek}
                            className="h-9 w-9 rounded-lg hover:bg-background/80 transition-all"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={goToToday}
                            className="px-3 text-xs font-medium hover:bg-background/80"
                        >
                            Today
                        </Button>
                        <span className="text-sm font-semibold px-3 min-w-[140px] text-center">
                            {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={nextWeek}
                            className="h-9 w-9 rounded-lg hover:bg-background/80 transition-all"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button
                        onClick={() => {
                            setSelectedDate(new Date())
                            setSelectedAppointment(null)
                            setDialogOpen(true)
                        }}
                        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
                    >
                        <Plus className="mr-2 h-4 w-4" /> New Appointment
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-xl">
                <div className="grid grid-cols-[70px_1fr] h-full overflow-y-auto">
                    {/* Time labels column */}
                    <div className="border-r border-border/50 bg-muted/10">
                        <div className="h-14 border-b border-border/50 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        {HOURS.map(hour => (
                            <div key={hour} className="h-20 border-b border-border/30 text-xs text-muted-foreground p-2 flex items-start justify-end pr-3 font-medium">
                                {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
                            </div>
                        ))}
                    </div>

                    {/* Days columns */}
                    <div className="grid grid-cols-7 relative min-w-[800px]">
                        {/* Header row */}
                        {DAYS.map((day, i) => {
                            const date = new Date(weekStart)
                            date.setDate(date.getDate() + i)
                            const isToday = new Date().toDateString() === date.toDateString()
                            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))

                            return (
                                <div
                                    key={day}
                                    className={cn(
                                        "h-14 border-b border-r border-border/50 flex flex-col items-center justify-center transition-colors",
                                        isToday ? "bg-primary/5" : "bg-muted/5",
                                        isPast && !isToday && "opacity-60"
                                    )}
                                >
                                    <span className={cn(
                                        "text-xs font-medium uppercase tracking-wider",
                                        isToday ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {day}
                                    </span>
                                    <div className={cn(
                                        "h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold mt-0.5 transition-all",
                                        isToday && "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                                    )}>
                                        {date.getDate()}
                                    </div>
                                </div>
                            )
                        })}

                        {/* Grid cells */}
                        {Array.from({ length: 7 }).map((_, dayIndex) => {
                            const currentDayDate = new Date(weekStart)
                            currentDayDate.setDate(currentDayDate.getDate() + dayIndex)
                            const isToday = new Date().toDateString() === currentDayDate.toDateString()

                            return (
                                <div
                                    key={dayIndex}
                                    className={cn(
                                        "relative border-r border-border/30 h-full",
                                        isToday && "bg-primary/5"
                                    )}
                                >
                                    {HOURS.map(hour => (
                                        <div
                                            key={hour}
                                            className="h-20 border-b border-border/20 hover:bg-primary/5 transition-all duration-200 cursor-pointer group"
                                            onClick={() => {
                                                const clickedDate = new Date(currentDayDate)
                                                clickedDate.setHours(hour)
                                                handleCreate(clickedDate)
                                            }}
                                        >
                                            <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Plus className="h-5 w-5 text-primary/50" />
                                            </div>
                                        </div>
                                    ))}

                                    {/* Render appointments */}
                                    {appointments
                                        .filter(apt => new Date(apt.start_time).toDateString() === currentDayDate.toDateString())
                                        .map(apt => {
                                            const start = new Date(apt.start_time)
                                            const end = new Date(apt.end_time)
                                            const startHour = start.getHours() + (start.getMinutes() / 60)
                                            const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
                                            const top = (startHour - 8) * 80 + 56 // 80px per hour + header offset
                                            const height = Math.max(duration * 80, 40)

                                            if (startHour < 8) return null

                                            const colorClass = typeColors[apt.type] || typeColors.checkup

                                            return (
                                                <div
                                                    key={apt.id}
                                                    className={cn(
                                                        "absolute left-1 right-1 rounded-lg bg-gradient-to-br border-l-4 p-2.5 text-xs cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg z-10 overflow-hidden",
                                                        colorClass
                                                    )}
                                                    style={{ top: `${top}px`, height: `${height}px` }}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleEdit(apt)
                                                    }}
                                                >
                                                    <div className="font-semibold text-foreground truncate">{apt.title}</div>
                                                    {height > 50 && (
                                                        <div className="text-muted-foreground flex items-center gap-1 mt-1">
                                                            <User className="h-3 w-3" />
                                                            <span className="truncate">{apt.first_name} {apt.last_name}</span>
                                                        </div>
                                                    )}
                                                    {height > 70 && (
                                                        <div className="text-muted-foreground/70 mt-1 text-[10px]">
                                                            {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500/50 to-blue-600/50 border border-blue-500" />
                    <span>Checkup</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500/50 to-green-600/50 border border-green-500" />
                    <span>Follow-up</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500/50 to-red-600/50 border border-red-500" />
                    <span>Emergency</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500/50 to-purple-600/50 border border-purple-500" />
                    <span>Consultation</span>
                </div>
            </div>

            <AppointmentDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                appointment={selectedAppointment}
                selectedDate={selectedDate}
                onSuccess={() => router.refresh()}
                user={user}
            />
        </div>
    )
}
