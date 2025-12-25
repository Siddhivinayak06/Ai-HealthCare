"use client"

import { useState } from "react"
import { AppointmentList } from "@/components/appointments/appointment-list"
import { BookingModal } from "@/components/appointments/booking-modal"
import { Button } from "@/components/ui/button"
import { PlusIcon, CalendarIcon, RefreshCcwIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface AppointmentsClientProps {
    appointments: any[]
    user: any
}

export function AppointmentsClient({ appointments: initialAppointments, user }: AppointmentsClientProps) {
    const [bookingOpen, setBookingOpen] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const router = useRouter()

    const handleRefresh = async () => {
        setIsRefreshing(true)
        router.refresh()
        setTimeout(() => setIsRefreshing(false), 1000)
    }

    return (
        <div className="relative min-h-screen p-4 lg:p-8 pt-16 lg:pt-8 space-y-10 overflow-hidden max-w-7xl mx-auto">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDelay: '2s' }} />

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                        <CalendarIcon className="h-3 w-3" />
                        Management
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tighter bg-gradient-to-r from-foreground via-foreground/80 to-muted-foreground bg-clip-text text-transparent leading-tight">
                        Appointments
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-xl font-medium">
                        Schedule and manage your healthcare consultations in one unified interface.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 rounded-xl border-border/50 bg-secondary/30 backdrop-blur-sm hover:bg-secondary/50 transition-all"
                        onClick={handleRefresh}
                    >
                        <RefreshCcwIcon className={cn("h-5 w-5", isRefreshing && "animate-spin")} />
                    </Button>
                    <Button
                        className="btn-gradient h-11 px-6 rounded-xl shadow-lg shadow-primary/20 gap-2 font-bold"
                        onClick={() => setBookingOpen(true)}
                    >
                        <PlusIcon className="h-5 w-5" />
                        Book Appointment
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <Card className="health-card bg-secondary/20 border-border/50 border-none shadow-xl overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Scheduled</p>
                                <h3 className="text-3xl font-black">{initialAppointments.filter(a => a.status === 'scheduled').length}</h3>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                <CalendarIcon className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="health-card bg-secondary/20 border-border/50 border-none shadow-xl overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Completed This Month</p>
                                <h3 className="text-3xl font-black">{initialAppointments.filter(a => a.status === 'completed').length}</h3>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                <PlusIcon className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="health-card bg-secondary/20 border-border/50 border-none shadow-xl overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Efficiency Rate</p>
                                <h3 className="text-3xl font-black">98%</h3>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                                <RefreshCcwIcon className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="relative z-10">
                <AppointmentList appointments={initialAppointments} isDoctor={user?.role === 'doctor'} />
            </div>

            <BookingModal
                open={bookingOpen}
                onOpenChange={setBookingOpen}
                user={user}
            />
        </div>
    )
}
