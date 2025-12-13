"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createAppointment, updateAppointment } from "@/app/actions/appointments"
import { PatientSelector } from "@/components/patient-selector"
import { DoctorSelector } from "@/components/doctor-selector"
import { AlertCircle, Loader2, Calendar, Clock, FileText, Stethoscope, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface AppointmentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    appointment?: any | null
    selectedDate?: Date | null
    onSuccess: () => void
    user?: any
}

export function AppointmentDialog({
    open,
    onOpenChange,
    appointment,
    selectedDate,
    onSuccess,
    user
}: AppointmentDialogProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const [patientId, setPatientId] = useState("")
    const [doctorId, setDoctorId] = useState("")
    const [title, setTitle] = useState("")
    const [date, setDate] = useState("")
    const [startTime, setStartTime] = useState("09:00")
    const [endTime, setEndTime] = useState("09:30")
    const [type, setType] = useState("checkup")
    const [notes, setNotes] = useState("")

    const isPatient = user?.role === "patient"

    useEffect(() => {
        if (open) {
            setError("")
            if (appointment) {
                setPatientId(appointment.patient_id)
                setTitle(appointment.title)
                const start = new Date(appointment.start_time)
                const end = new Date(appointment.end_time)
                setDate(start.toISOString().split('T')[0])
                setStartTime(start.toTimeString().slice(0, 5))
                setEndTime(end.toTimeString().slice(0, 5))
                setType(appointment.type)
                setNotes(appointment.notes || "")
            } else if (selectedDate) {
                setDate(selectedDate.toISOString().split('T')[0])
                const hour = selectedDate.getHours()
                setStartTime(`${hour.toString().padStart(2, '0')}:00`)
                setEndTime(`${(hour + 1).toString().padStart(2, '0')}:00`)
                setTitle("")
                setPatientId(isPatient ? "self" : "")
                setDoctorId("")
                setType("checkup")
                setNotes("")
            } else {
                setDate(new Date().toISOString().split('T')[0])
                setStartTime("09:00")
                setEndTime("09:30")
                setTitle("")
                setPatientId(isPatient ? "self" : "")
                setDoctorId("")
                setType("checkup")
                setNotes("")
            }
        }
    }, [appointment, selectedDate, open, isPatient])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            if (startTime >= endTime) {
                setError("End time must be after start time")
                setLoading(false)
                return
            }

            const startDateTime = new Date(`${date}T${startTime}:00`).toISOString()
            const endDateTime = new Date(`${date}T${endTime}:00`).toISOString()

            const data = {
                patient_id: patientId,
                doctor_id: isPatient ? doctorId : undefined,
                title,
                start_time: startDateTime,
                end_time: endDateTime,
                type,
                notes
            }

            let result
            if (appointment) {
                result = await updateAppointment(appointment.id, data)
            } else {
                result = await createAppointment(data)
            }

            if (result && result.error) {
                setError(result.error)
            } else {
                onSuccess()
                onOpenChange(false)
            }
        } catch (error: any) {
            console.error("Error saving appointment:", error)
            setError(error.message || "Failed to save appointment")
        } finally {
            setLoading(false)
        }
    }

    const typeOptions = [
        { value: "checkup", label: "Checkup", icon: "💊", color: "text-blue-500" },
        { value: "followup", label: "Follow-up", icon: "🔄", color: "text-green-500" },
        { value: "emergency", label: "Emergency", icon: "🚨", color: "text-red-500" },
        { value: "consultation", label: "Consultation", icon: "💬", color: "text-purple-500" },
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border/50">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            {appointment ? "Edit Appointment" : "Schedule Appointment"}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            {appointment ? "Update the appointment details below" : "Fill in the details to schedule a new appointment"}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-5">
                    {error && (
                        <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl flex items-center gap-3 border border-destructive/20 animate-in slide-in-from-top-2">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {/* Patient/Doctor Selection */}
                    {!isPatient && (
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                                <User className="h-4 w-4 text-muted-foreground" />
                                Select Patient
                            </Label>
                            <div className="relative">
                                <PatientSelector onSelect={setPatientId} />
                                {patientId && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-500 font-medium">
                                        ✓ Selected
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {isPatient && (
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                                Select Doctor
                            </Label>
                            <div className="relative">
                                <DoctorSelector onSelect={setDoctorId} />
                                {doctorId && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-500 font-medium">
                                        ✓ Selected
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="flex items-center gap-2 text-sm font-medium">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            Appointment Title
                        </Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Annual Health Checkup"
                            className="h-11 bg-secondary/30 border-border/50 focus:border-primary/50 transition-colors"
                            required
                        />
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date" className="flex items-center gap-2 text-sm font-medium">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                Date
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="h-11 bg-secondary/30 border-border/50 focus:border-primary/50"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                Time Slot
                            </Label>
                            <div className="flex gap-2 items-center">
                                <Input
                                    type="time"
                                    value={startTime}
                                    onChange={e => setStartTime(e.target.value)}
                                    className="h-11 bg-secondary/30 border-border/50 focus:border-primary/50"
                                    required
                                />
                                <span className="text-muted-foreground font-medium">to</span>
                                <Input
                                    type="time"
                                    value={endTime}
                                    onChange={e => setEndTime(e.target.value)}
                                    className="h-11 bg-secondary/30 border-border/50 focus:border-primary/50"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Appointment Type */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Appointment Type</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {typeOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setType(opt.value)}
                                    className={cn(
                                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200",
                                        type === opt.value
                                            ? "border-primary bg-primary/10 shadow-md"
                                            : "border-border/50 hover:border-border bg-secondary/20 hover:bg-secondary/40"
                                    )}
                                >
                                    <span className="text-xl">{opt.icon}</span>
                                    <span className={cn(
                                        "text-xs font-medium",
                                        type === opt.value ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {opt.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-medium">
                            Additional Notes <span className="text-muted-foreground font-normal">(optional)</span>
                        </Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Any special requirements or notes for the appointment..."
                            className="min-h-[80px] bg-secondary/30 border-border/50 focus:border-primary/50 resize-none"
                        />
                    </div>

                    <DialogFooter className="gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="px-6"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || (isPatient ? !doctorId : !patientId)}
                            className="px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? "Saving..." : appointment ? "Update Appointment" : "Schedule Appointment"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
