"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    getDoctorsList,
    createAppointment
} from "@/app/actions/appointments"
import { getPatients } from "@/app/actions/patients"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { CalendarIcon, ClockIcon, LoaderIcon } from "@/components/icons"
import { toast } from "sonner"

interface BookingModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: any
}

export function BookingModal({ open, onOpenChange, user }: BookingModalProps) {
    const [loading, setLoading] = useState(false)
    const [doctors, setDoctors] = useState<any[]>([])
    const [patientsList, setPatientsList] = useState<any[]>([])

    const [formData, setFormData] = useState({
        participantId: "", // userId for doctor, patientId for patient
        title: "",
        date: "",
        startTime: "",
        duration: "30",
        notes: "",
        type: "checkup"
    })

    const isDoctor = user?.role === "doctor"

    useEffect(() => {
        if (!open) return

        async function fetchData() {
            if (isDoctor) {
                const data = await getPatients()
                setPatientsList(data || [])
            } else {
                const data = await getDoctorsList()
                setDoctors(data || [])
            }
        }
        fetchData()
    }, [open, isDoctor])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.participantId || !formData.date || !formData.startTime) {
            toast.error("Please fill in all required fields")
            return
        }

        setLoading(true)
        try {
            const startStr = `${formData.date}T${formData.startTime}:00`
            const startDate = new Date(startStr)
            const endDate = new Date(startDate.getTime() + parseInt(formData.duration) * 60000)

            const result = await createAppointment({
                userId: isDoctor ? user.id : formData.participantId,
                patientId: isDoctor ? formData.participantId : (patientsList[0]?.id || ""), // Need a better way to get patient ID if user is patient
                title: formData.title || "Routine Checkup",
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
                type: formData.type,
                notes: formData.notes
            })

            if (result.success) {
                toast.success("Appointment scheduled successfully")
                onOpenChange(false)
                setFormData({
                    participantId: "",
                    title: "",
                    date: "",
                    startTime: "",
                    duration: "30",
                    notes: "",
                    type: "checkup"
                })
            } else {
                toast.error(result.error || "Failed to schedule appointment")
            }
        } catch (error) {
            toast.error("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] border-border/50 bg-background/95 backdrop-blur-2xl shadow-2xl rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                        Book New Appointment
                    </DialogTitle>
                    <DialogDescription>
                        Schedule a consultation with our medical experts.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>{isDoctor ? "Select Patient" : "Select Specialist"}</Label>
                            <Select
                                value={formData.participantId}
                                onValueChange={(v) => setFormData({ ...formData, participantId: v })}
                            >
                                <SelectTrigger className="h-12 rounded-xl bg-secondary/30 border-border/50">
                                    <SelectValue placeholder={isDoctor ? "Choose a patient..." : "Choose a doctor..."} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border/50 bg-background/95 backdrop-blur-xl">
                                    {(isDoctor ? patientsList : doctors).map((item) => (
                                        <SelectItem key={item.id} value={item.id} className="rounded-lg">
                                            {isDoctor ? `${item.firstName} ${item.lastName}` : item.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Appointment Title</Label>
                            <Input
                                placeholder="e.g. Follow-up consultation"
                                className="h-12 rounded-xl bg-secondary/30 border-border/50"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        className="h-12 rounded-xl bg-secondary/30 border-border/50 pl-10"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                    <CalendarIcon className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Time</Label>
                                <div className="relative">
                                    <Input
                                        type="time"
                                        className="h-12 rounded-xl bg-secondary/30 border-border/50 pl-10"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    />
                                    <ClockIcon className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Notes (Optional)</Label>
                            <Textarea
                                placeholder="Reason for visit, symptoms, etc."
                                className="min-h-[100px] rounded-xl bg-secondary/30 border-border/50 resize-none"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="btn-gradient rounded-xl px-8 h-11"
                        >
                            {loading ? <LoaderIcon className="h-4 w-4 animate-spin mr-2" /> : null}
                            Schedule Appointment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
