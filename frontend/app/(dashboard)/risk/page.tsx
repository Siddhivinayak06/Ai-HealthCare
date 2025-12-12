"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { predictRisk } from "@/app/actions/predict"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2, HeartPulse, Activity, AlertTriangle, CheckCircle } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

const formSchema = z.object({
    age: z.coerce.number().min(18).max(100),
    bmi: z.coerce.number().min(10).max(60),
    sys_bp: z.coerce.number().min(80).max(250),
    dia_bp: z.coerce.number().min(40).max(150),
    glucose: z.coerce.number().min(50).max(400),
    cholesterol: z.coerce.number().min(100).max(500),
    smoker: z.string(),
})

export default function RiskPage() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            age: 45,
            bmi: 24,
            sys_bp: 120,
            dia_bp: 80,
            glucose: 100,
            cholesterol: 180,
            smoker: "no",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        setResult(null)
        try {
            // Transform for API
            const apiData = {
                ...values,
                smoker: values.smoker === "yes" ? 1 : 0
            }

            const result = await predictRisk(apiData)

            if (!result.success) throw new Error(result.error)

            setResult(result.data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const getRiskColor = (level: string) => {
        switch (level) {
            case "High": return "#ef4444" // red
            case "Medium": return "#f59e0b" // orange
            default: return "#22c55e" // green
        }
    }

    const chartData = result ? [
        { name: "Risk", value: result.risk_score * 100 },
        { name: "Safe", value: 100 - (result.risk_score * 100) }
    ] : []

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Predictive Health Risk</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Patient Metrics</CardTitle>
                        <CardDescription>Enter health vitals for predictive analysis.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="age" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Age</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="bmi" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>BMI</FormLabel>
                                            <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="sys_bp" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Systolic BP</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="dia_bp" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Diastolic BP</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="glucose" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Glucose (mg/dL)</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="cholesterol" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cholesterol</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="smoker" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Smoker</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="no">No</SelectItem>
                                                    <SelectItem value="yes">Yes</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Calculate Risk
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Risk Projection</CardTitle>
                        <CardDescription>AI-estimated probability of cardiovascular event.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
                        {result ? (
                            <div className="w-full space-y-6">
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                <Cell key="risk" fill={getRiskColor(result.risk_level)} />
                                                <Cell key="safe" fill="#e5e7eb" />
                                            </Pie>
                                            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
                                                {(result.risk_score * 100).toFixed(0)}%
                                            </text>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="text-center space-y-2">
                                    <div className={`text-xl font-bold ${result.risk_level === 'High' ? 'text-red-500' : result.risk_level === 'Medium' ? 'text-orange-500' : 'text-green-500'}`}>
                                        {result.risk_level} Risk Level
                                    </div>
                                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md text-left">
                                        <ul className="list-disc pl-4 space-y-1">
                                            {result.recommendation.map((rec: string, i: number) => (
                                                <li key={i}>{rec}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground opacity-50 space-y-2">
                                <Activity className="h-16 w-16 mx-auto" />
                                <p>Enter patient data to generate projection</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
