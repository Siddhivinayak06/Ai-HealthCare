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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, UserPlus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

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

export default function NewPatientPage() {
    const router = useRouter()
    const { toast } = useToast()
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
                toast({
                    title: "Profile Created",
                    description: "Your patient profile has been successfully set up.",
                })
                router.push("/dashboard")
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to create profile",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 lg:p-8 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
            <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none" />

            <div className="relative z-10 container max-w-4xl">
                <div className="mb-8">
                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6 group">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </Link>
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold tracking-tight text-gradient">Create Health Profile</h1>
                        <p className="text-muted-foreground text-lg">
                            Set up your digital medical identity to enable AI-powered diagnostics and personalized health tracking.
                        </p>
                    </div>
                </div>

                <div className="glass-panel p-1 rounded-2xl shadow-xl">
                    <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 lg:p-10 border border-white/5">
                        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/50">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <UserPlus className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">Patient Registration</h2>
                                <p className="text-sm text-muted-foreground">Please fill in all required fields accurately.</p>
                            </div>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                                {/* Section 1: Personal Info */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-primary/50" />
                                        Personal Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="firstName" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>First Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. John" {...field} className="bg-background/50 focus:bg-background transition-colors" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="lastName" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Last Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Doe" {...field} className="bg-background/50 focus:bg-background transition-colors" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Date of Birth</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} className="bg-background/50 focus:bg-background transition-colors" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="gender" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gender</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-background/50 focus:bg-background transition-colors">
                                                            <SelectValue placeholder="Select gender" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Male">Male</SelectItem>
                                                        <SelectItem value="Female">Female</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>

                                <Separator className="opacity-50" />

                                {/* Section 2: Contact Info */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-accent/50" />
                                        Contact Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="email" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email Address</FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="john@example.com" {...field} className="bg-background/50 focus:bg-background transition-colors" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="phone" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="+1 (555) 000-0000" {...field} className="bg-background/50 focus:bg-background transition-colors" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="address" render={({ field }) => (
                                            <FormItem className="col-span-1 md:col-span-2">
                                                <FormLabel>Residential Address</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="123 Innovation Dr, Tech City, TC 94043" {...field} className="bg-background/50 focus:bg-background transition-colors" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>

                                <Separator className="opacity-50" />

                                {/* Section 3: Medical Info */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-destructive/50" />
                                        Medical History
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="bloodType" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Blood Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-background/50 focus:bg-background transition-colors">
                                                            <SelectValue placeholder="Select blood type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="A+">A+</SelectItem>
                                                        <SelectItem value="A-">A-</SelectItem>
                                                        <SelectItem value="B+">B+</SelectItem>
                                                        <SelectItem value="B-">B-</SelectItem>
                                                        <SelectItem value="AB+">AB+</SelectItem>
                                                        <SelectItem value="AB-">AB-</SelectItem>
                                                        <SelectItem value="O+">O+</SelectItem>
                                                        <SelectItem value="O-">O-</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="emergencyContactName" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Emergency Contact</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Name of relative/friend" {...field} className="bg-background/50 focus:bg-background transition-colors" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="medicalConditions" render={({ field }) => (
                                            <FormItem className="col-span-1 md:col-span-2">
                                                <FormLabel>Known Conditions</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Diabetes, Hypertension..." {...field} className="bg-background/50 focus:bg-background transition-colors" />
                                                </FormControl>
                                                <FormDescription>Comma-separated list of existing medical conditions</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="allergies" render={({ field }) => (
                                            <FormItem className="col-span-1 md:col-span-2">
                                                <FormLabel>Allergies</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Peanuts, Penicillin..." {...field} className="bg-background/50 focus:bg-background transition-colors" />
                                                </FormControl>
                                                <FormDescription>Comma-separated list of known allergies</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-6 border-t border-border/50">
                                    <Button type="submit" size="lg" disabled={loading} className="min-w-[200px] shadow-lg hover:shadow-primary/25 transition-all text-base gap-2 bg-gradient-to-r from-primary to-accent hover:to-primary">
                                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                                        Create Profile
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
            </div>
        </div>
    )
}
