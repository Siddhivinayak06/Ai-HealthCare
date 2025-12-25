"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createPatient } from "@/app/actions/patients"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Loader2, UserPlus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const formSchema = z.object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
    gender: z.string().min(1, "Gender is required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().min(10, "Phone number should be at least 10 digits").optional().or(z.literal("")),
    address: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    bloodType: z.string().optional(),
    allergies: z.string().optional(),
    medicalConditions: z.string().optional(),
})

export function PatientForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            dateOfBirth: "",
            gender: "",
            email: "",
            phone: "",
            address: "",
            emergencyContactName: "",
            emergencyContactPhone: "",
            bloodType: "",
            allergies: "",
            medicalConditions: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            const result = await createPatient({
                ...values,
                allergies: values.allergies ? values.allergies.split(",").map(s => s.trim()) : [],
                medicalConditions: values.medicalConditions ? values.medicalConditions.split(",").map(s => s.trim()) : [],
            })

            if (result.success) {
                toast.success("Profile Created: Your patient profile has been successfully set up.")
                router.push("/dashboard")
            } else {
                toast.error(result.error || "Failed to create profile")
            }
        } catch (error) {
            console.error(error)
            toast.error("An unexpected error occurred.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative z-10 container max-w-4xl py-10">
            <div className="mb-8">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6 group">
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </Link>
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground/80 to-muted-foreground bg-clip-text text-transparent">
                        Create Health Profile
                    </h1>
                    <p className="text-muted-foreground text-lg font-medium">
                        Set up your digital medical identity to enable AI-powered diagnostics and personalized health tracking.
                    </p>
                </div>
            </div>

            <div className="health-card p-1 rounded-3xl shadow-xl bg-secondary/10 border-none">
                <div className="bg-background/40 backdrop-blur-xl rounded-[22px] p-6 lg:p-10 border border-white/5">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/30">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                            <UserPlus className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Patient Registration</h2>
                            <p className="text-sm text-muted-foreground font-medium">Please fill in all required fields accurately.</p>
                        </div>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                            {/* Section 1: Personal Info */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    Personal Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField control={form.control} name="firstName" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold">First Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. John" {...field} className="h-12 rounded-xl bg-secondary/30 border-border/50 focus:bg-secondary/50 transition-all font-medium" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="lastName" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold">Last Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Doe" {...field} className="h-12 rounded-xl bg-secondary/30 border-border/50 focus:bg-secondary/50 transition-all font-medium" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold">Date of Birth</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} className="h-12 rounded-xl bg-secondary/30 border-border/50 focus:bg-secondary/50 transition-all font-medium" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="gender" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold">Gender</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 rounded-xl bg-secondary/30 border-border/50 focus:bg-secondary/50 transition-all">
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-border/50 bg-background/95 backdrop-blur-xl">
                                                    <SelectItem value="Male" className="rounded-lg">Male</SelectItem>
                                                    <SelectItem value="Female" className="rounded-lg">Female</SelectItem>
                                                    <SelectItem value="Other" className="rounded-lg">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            </div>

                            <Separator className="bg-border/30" />

                            {/* Section 2: Contact Info */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                                    Contact Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField control={form.control} name="email" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold">Email Address</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="john@example.com" {...field} className="h-12 rounded-xl bg-secondary/30 border-border/50 focus:bg-secondary/50 transition-all font-medium" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="phone" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold">Phone Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="+1 (555) 000-0000" {...field} className="h-12 rounded-xl bg-secondary/30 border-border/50 focus:bg-secondary/50 transition-all font-medium" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="address" render={({ field }) => (
                                        <FormItem className="col-span-1 md:col-span-2">
                                            <FormLabel className="font-bold">Residential Address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="123 Innovation Dr, Tech City, TC 94043" {...field} className="h-12 rounded-xl bg-secondary/30 border-border/50 focus:bg-secondary/50 transition-all font-medium" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            </div>

                            <Separator className="bg-border/30" />

                            {/* Section 3: Medical Info */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                    Medical History
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField control={form.control} name="bloodType" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold">Blood Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 rounded-xl bg-secondary/30 border-border/50 focus:bg-secondary/50 transition-all">
                                                        <SelectValue placeholder="Select blood type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-border/50 bg-background/95 backdrop-blur-xl">
                                                    <SelectItem value="A+" className="rounded-lg">A+</SelectItem>
                                                    <SelectItem value="A-" className="rounded-lg">A-</SelectItem>
                                                    <SelectItem value="B+" className="rounded-lg">B+</SelectItem>
                                                    <SelectItem value="B-" className="rounded-lg">B-</SelectItem>
                                                    <SelectItem value="AB+" className="rounded-lg">AB+</SelectItem>
                                                    <SelectItem value="AB-" className="rounded-lg">AB-</SelectItem>
                                                    <SelectItem value="O+" className="rounded-lg">O+</SelectItem>
                                                    <SelectItem value="O-" className="rounded-lg">O-</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="emergencyContactName" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold">Emergency Contact</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Name of relative/friend" {...field} className="h-12 rounded-xl bg-secondary/30 border-border/50 focus:bg-secondary/50 transition-all font-medium" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="medicalConditions" render={({ field }) => (
                                        <FormItem className="col-span-1 md:col-span-2">
                                            <FormLabel className="font-bold">Known Conditions</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Diabetes, Hypertension..." {...field} className="h-12 rounded-xl bg-secondary/30 border-border/50 focus:bg-secondary/50 transition-all font-medium" />
                                            </FormControl>
                                            <FormDescription className="text-xs font-medium opacity-60">Comma-separated list of existing medical conditions</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="allergies" render={({ field }) => (
                                        <FormItem className="col-span-1 md:col-span-2">
                                            <FormLabel className="font-bold">Allergies</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Peanuts, Penicillin..." {...field} className="h-12 rounded-xl bg-secondary/30 border-border/50 focus:bg-secondary/50 transition-all font-medium" />
                                            </FormControl>
                                            <FormDescription className="text-xs font-medium opacity-60">Comma-separated list of known allergies</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 border-t border-border/30">
                                <Button type="submit" size="lg" disabled={loading} className="btn-gradient min-w-[200px] h-14 rounded-2xl shadow-xl shadow-primary/20 transition-all text-base gap-2 font-bold">
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                                    Create Health Profile
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    )
}
