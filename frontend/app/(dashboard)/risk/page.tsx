"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { predictRisk } from "@/app/actions/predict"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { Loader2, HeartPulse, Activity, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Sparkles, Zap, Heart, Brain } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"

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
            case "High": return "#ef4444"
            case "Medium": return "#f59e0b"
            default: return "#22c55e"
        }
    }

    const getRiskGradient = (level: string) => {
        switch (level) {
            case "High": return "from-rose-500/20 via-rose-500/10 to-transparent"
            case "Medium": return "from-amber-500/20 via-amber-500/10 to-transparent"
            default: return "from-emerald-500/20 via-emerald-500/10 to-transparent"
        }
    }

    const chartData = result ? [
        { name: "Risk", value: result.risk_score * 100 },
        { name: "Safe", value: 100 - (result.risk_score * 100) }
    ] : []

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-20" />
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-rose-500/15 via-pink-500/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-violet-500/10 via-fuchsia-500/5 to-transparent rounded-full blur-3xl" />

            <div className="relative p-4 lg:p-8 pt-16 lg:pt-8 space-y-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/25">
                                <HeartPulse className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">Cardiovascular Risk Assessment</h1>
                                <p className="text-muted-foreground">AI-powered health risk prediction using machine learning</p>
                            </div>
                        </div>
                    </div>
                    <Badge variant="outline" className="w-fit border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 px-4 py-1.5">
                        <Brain className="h-3.5 w-3.5 mr-1.5" />
                        Random Forest Model
                    </Badge>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bento-card p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
                            <HeartPulse className="h-6 w-6 text-rose-500" />
                        </div>
                        <div>
                            <p className="font-semibold">Heart Health</p>
                            <p className="text-sm text-muted-foreground">CVD risk factors</p>
                        </div>
                    </div>
                    <div className="bento-card p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                            <Activity className="h-6 w-6 text-violet-500" />
                        </div>
                        <div>
                            <p className="font-semibold">Vital Signs</p>
                            <p className="text-sm text-muted-foreground">BP, glucose, etc.</p>
                        </div>
                    </div>
                    <div className="bento-card p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-amber-500" />
                        </div>
                        <div>
                            <p className="font-semibold">Risk Score</p>
                            <p className="text-sm text-muted-foreground">0-100% scale</p>
                        </div>
                    </div>
                    <div className="bento-card p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                            <p className="font-semibold">AI Insights</p>
                            <p className="text-sm text-muted-foreground">Recommendations</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Input Form */}
                    <div className="bento-card overflow-hidden">
                        <CardHeader className="border-b border-border/50 bg-muted/20">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary" />
                                Patient Metrics
                            </CardTitle>
                            <CardDescription>
                                Enter health vitals for predictive analysis
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-6">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="age" render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel>Age</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        className="bg-secondary/50 border-border/50 focus:border-primary/50"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="bmi" render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel>BMI</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        {...field}
                                                        className="bg-secondary/50 border-border/50 focus:border-primary/50"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="sys_bp" render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel>Systolic BP</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        className="bg-secondary/50 border-border/50 focus:border-primary/50"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="dia_bp" render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel>Diastolic BP</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        className="bg-secondary/50 border-border/50 focus:border-primary/50"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="glucose" render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel>Glucose (mg/dL)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        className="bg-secondary/50 border-border/50 focus:border-primary/50"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="cholesterol" render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel>Cholesterol</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        className="bg-secondary/50 border-border/50 focus:border-primary/50"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    <FormField control={form.control} name="smoker" render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel>Smoking Status</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-secondary/50 border-border/50 focus:border-primary/50">
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="no">Non-smoker</SelectItem>
                                                    <SelectItem value="yes">Current Smoker</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <Button
                                        type="submit"
                                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white border-0 shadow-lg shadow-rose-500/25 transition-all duration-300 hover:shadow-rose-500/40 hover:scale-[1.02]"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Calculating Risk...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="mr-2 h-5 w-5" />
                                                Calculate Risk Score
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </div>

                    {/* Results Panel */}
                    <div className={cn(
                        "bento-card overflow-hidden transition-all duration-500",
                        result && `bg-gradient-to-b ${getRiskGradient(result.risk_level)}`
                    )}>
                        <CardHeader className="border-b border-border/50 bg-muted/20">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <HeartPulse className="h-5 w-5 text-rose-500" />
                                Risk Projection
                            </CardTitle>
                            <CardDescription>
                                AI-estimated probability of cardiovascular event
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[400px]">
                            {result ? (
                                <div className="w-full space-y-6 animate-in fade-in zoom-in-95 duration-500">
                                    {/* Chart */}
                                    <div className="h-[200px] w-full relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={chartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={70}
                                                    outerRadius={90}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    strokeWidth={0}
                                                >
                                                    <Cell key="risk" fill={getRiskColor(result.risk_level)} />
                                                    <Cell key="safe" fill="rgba(128,128,128,0.2)" />
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        {/* Center text */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className={cn(
                                                "text-5xl font-black tabular-nums",
                                                result.risk_level === "High" ? "text-rose-500" :
                                                    result.risk_level === "Medium" ? "text-amber-500" : "text-emerald-500"
                                            )}>
                                                {(result.risk_score * 100).toFixed(0)}%
                                            </span>
                                            <span className="text-sm text-muted-foreground">Risk Score</span>
                                        </div>
                                    </div>

                                    {/* Risk Badge */}
                                    <div className="flex justify-center">
                                        <Badge
                                            className={cn(
                                                "px-5 py-2 text-base font-semibold border-0 shadow-lg",
                                                result.risk_level === "High"
                                                    ? "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-500/30"
                                                    : result.risk_level === "Medium"
                                                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30"
                                                        : "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-500/30"
                                            )}
                                        >
                                            {result.risk_level === "High" && <TrendingUp className="h-4 w-4 mr-2" />}
                                            {result.risk_level === "Low" && <TrendingDown className="h-4 w-4 mr-2" />}
                                            {result.risk_level === "Medium" && <Activity className="h-4 w-4 mr-2" />}
                                            {result.risk_level} Risk Level
                                        </Badge>
                                    </div>

                                    {/* Recommendations */}
                                    <div className="space-y-3 pt-4 border-t border-border/50">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <Heart className="h-4 w-4 text-rose-500" />
                                            AI Recommendations
                                        </h4>
                                        <ul className="space-y-2">
                                            {result.recommendation.map((rec: string, i: number) => (
                                                <li
                                                    key={i}
                                                    className="flex items-start gap-3 text-sm p-3 rounded-lg bg-secondary/50 border border-border/50 animate-in slide-in-from-left duration-300"
                                                    style={{ animationDelay: `${i * 100}ms` }}
                                                >
                                                    {rec.includes("IMMEDIATE") ? (
                                                        <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                                                    ) : (
                                                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                                    )}
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground space-y-4">
                                    <div className="relative mx-auto w-fit">
                                        <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full blur-xl opacity-30 animate-pulse" />
                                        <div className="relative p-6 rounded-full bg-secondary/50 border border-border/50">
                                            <HeartPulse className="h-12 w-12 text-muted-foreground/50" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="font-medium">Awaiting Patient Data</p>
                                        <p className="text-sm max-w-[280px] mx-auto">Enter health vitals and click "Calculate Risk Score" to generate AI prediction</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </div>
                </div>
            </div>
        </div>
    )
}
