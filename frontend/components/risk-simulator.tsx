"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Zap, Activity, Heart, AlertTriangle, TrendingDown, TrendingUp, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { PatientSelector } from "@/components/patient-selector"

interface SimulationData {
    age: number
    bmi: number
    sys_bp: number
    dia_bp: number
    glucose: number
    cholesterol: number
    smoker: boolean
}

interface PredictionResult {
    risk_score: number
    risk_level: string
    recommendation: string[]
}

export function RiskSimulator() {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<SimulationData>({
        age: 45,
        bmi: 24,
        sys_bp: 120,
        dia_bp: 80,
        glucose: 95,
        cholesterol: 190,
        smoker: false,
    })

    const [result, setResult] = useState<PredictionResult | null>(null)

    const handleSimulate = async () => {
        setLoading(true)
        try {
            const response = await fetch("/api/predict/risk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    smoker: data.smoker ? 1 : 0,
                }),
            })

            if (response.ok) {
                const resData = await response.json()
                setResult(resData)
            } else {
                console.error("Simulation failed")
            }
        } catch (error) {
            console.error("Error simulating risk:", error)
        } finally {
            setLoading(false)
        }
    }

    const [selectedPatientId, setSelectedPatientId] = useState<string>("")
    const [saving, setSaving] = useState(false)
    const [saveMessage, setSaveMessage] = useState("")

    // Dynamically import action to avoid build cycle if any
    const handleSave = async () => {
        if (!selectedPatientId || !result) return
        setSaving(true)
        setSaveMessage("")

        try {
            const apiData = {
                patientId: selectedPatientId,
                condition: "Cardiovascular Risk",
                riskScore: result.risk_score,
                severity: result.risk_level,
                contributingFactors: {
                    age: data.age,
                    bmi: data.bmi,
                    smoker: data.smoker,
                    bp: `${data.sys_bp}/${data.dia_bp}`
                },
                recommendations: result.recommendation
            }

            const { saveRiskPrediction } = await import("@/app/actions/analysis")
            const response = await saveRiskPrediction(apiData)

            if (response.error) throw new Error(response.error)
            setSaveMessage("Saved to patient record!")
        } catch (error) {
            setSaveMessage("Failed to save.")
        } finally {
            setSaving(false)
        }
    }

    const getRiskGradient = (score: number) => {
        if (score < 0.3) return "from-emerald-500/20 via-emerald-500/10 to-transparent"
        if (score < 0.7) return "from-amber-500/20 via-amber-500/10 to-transparent"
        return "from-rose-500/20 via-rose-500/10 to-transparent"
    }

    const getRiskTextColor = (score: number) => {
        if (score < 0.3) return "text-emerald-400"
        if (score < 0.7) return "text-amber-400"
        return "text-rose-400"
    }

    const getRiskGlow = (score: number) => {
        if (score < 0.3) return "shadow-emerald-500/20"
        if (score < 0.7) return "shadow-amber-500/20"
        return "shadow-rose-500/20"
    }

    return (
        <Card className="relative overflow-hidden border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-2xl shadow-2xl">
            {/* Decorative gradient orbs */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <CardHeader className="relative z-10 pb-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-bold flex items-center gap-3 text-white">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25">
                                <Activity className="h-5 w-5 text-white" />
                            </div>
                            Risk Simulator
                            <Badge variant="outline" className="ml-2 border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium">
                                <Sparkles className="h-3 w-3 mr-1" />
                                AI Powered
                            </Badge>
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Simulate lifestyle changes to see their impact on your health risk score
                        </CardDescription>
                    </div>
                    <Button
                        onClick={handleSimulate}
                        disabled={loading}
                        className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-violet-500/40 hover:scale-105"
                    >
                        {loading ? (
                            <Zap className="mr-2 h-4 w-4 animate-pulse" />
                        ) : (
                            <Zap className="mr-2 h-4 w-4" />
                        )}
                        {loading ? "Simulating..." : "Run Simulation"}
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="relative z-10 grid lg:grid-cols-2 gap-8">
                {/* Controls */}
                <div className="space-y-5">
                    {/* Age Slider */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 hover:bg-white/[0.07] transition-colors">
                        <div className="flex items-center justify-between">
                            <Label className="text-slate-300 font-medium">Age</Label>
                            <span className="text-lg font-bold text-white tabular-nums">{data.age} <span className="text-sm text-slate-500">years</span></span>
                        </div>
                        <Slider
                            value={[data.age]}
                            min={18}
                            max={100}
                            step={1}
                            onValueChange={([val]) => setData({ ...data, age: val })}
                            className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-violet-500 [&_[role=slider]]:to-fuchsia-500 [&_[role=slider]]:border-0 [&_[role=slider]]:shadow-lg"
                        />
                    </div>

                    {/* BMI Slider */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 hover:bg-white/[0.07] transition-colors">
                        <div className="flex items-center justify-between">
                            <Label className="text-slate-300 font-medium">BMI</Label>
                            <span className="text-lg font-bold text-white tabular-nums">{data.bmi.toFixed(1)}</span>
                        </div>
                        <Slider
                            value={[data.bmi]}
                            min={15}
                            max={50}
                            step={0.1}
                            onValueChange={([val]) => setData({ ...data, bmi: val })}
                            className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-violet-500 [&_[role=slider]]:to-fuchsia-500 [&_[role=slider]]:border-0"
                        />
                    </div>

                    {/* Blood Pressure */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 hover:bg-white/[0.07] transition-colors">
                            <div className="flex items-center justify-between">
                                <Label className="text-slate-300 text-sm">Systolic BP</Label>
                                <span className="font-bold text-white tabular-nums">{data.sys_bp}</span>
                            </div>
                            <Slider
                                value={[data.sys_bp]}
                                min={90}
                                max={200}
                                step={1}
                                onValueChange={([val]) => setData({ ...data, sys_bp: val })}
                                className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-cyan-500 [&_[role=slider]]:to-blue-500 [&_[role=slider]]:border-0"
                            />
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 hover:bg-white/[0.07] transition-colors">
                            <div className="flex items-center justify-between">
                                <Label className="text-slate-300 text-sm">Diastolic BP</Label>
                                <span className="font-bold text-white tabular-nums">{data.dia_bp}</span>
                            </div>
                            <Slider
                                value={[data.dia_bp]}
                                min={60}
                                max={130}
                                step={1}
                                onValueChange={([val]) => setData({ ...data, dia_bp: val })}
                                className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-cyan-500 [&_[role=slider]]:to-blue-500 [&_[role=slider]]:border-0"
                            />
                        </div>
                    </div>

                    {/* Glucose & Cholesterol */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 hover:bg-white/[0.07] transition-colors">
                            <div className="flex items-center justify-between">
                                <Label className="text-slate-300 text-sm">Glucose</Label>
                                <span className="font-bold text-white tabular-nums">{data.glucose} <span className="text-xs text-slate-500">mg/dL</span></span>
                            </div>
                            <Slider
                                value={[data.glucose]}
                                min={70}
                                max={300}
                                step={1}
                                onValueChange={([val]) => setData({ ...data, glucose: val })}
                                className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-amber-500 [&_[role=slider]]:to-orange-500 [&_[role=slider]]:border-0"
                            />
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 hover:bg-white/[0.07] transition-colors">
                            <div className="flex items-center justify-between">
                                <Label className="text-slate-300 text-sm">Cholesterol</Label>
                                <span className="font-bold text-white tabular-nums">{data.cholesterol} <span className="text-xs text-slate-500">mg/dL</span></span>
                            </div>
                            <Slider
                                value={[data.cholesterol]}
                                min={100}
                                max={400}
                                step={1}
                                onValueChange={([val]) => setData({ ...data, cholesterol: val })}
                                className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-amber-500 [&_[role=slider]]:to-orange-500 [&_[role=slider]]:border-0"
                            />
                        </div>
                    </div>

                    {/* Smoker Toggle */}
                    <div className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
                        data.smoker
                            ? "bg-rose-500/10 border-rose-500/30"
                            : "bg-emerald-500/10 border-emerald-500/30"
                    )}>
                        <div className="space-y-0.5">
                            <Label className="text-base text-white font-medium">Smoking Status</Label>
                            <p className={cn("text-xs", data.smoker ? "text-rose-400" : "text-emerald-400")}>
                                {data.smoker ? "Currently smoking" : "Non-smoker"}
                            </p>
                        </div>
                        <Switch
                            checked={data.smoker}
                            onCheckedChange={(checked) => setData({ ...data, smoker: checked })}
                            className="data-[state=checked]:bg-rose-500 data-[state=unchecked]:bg-emerald-500"
                        />
                    </div>
                </div>

                {/* Results Panel */}
                <div className={cn(
                    "relative flex flex-col items-center justify-center p-8 rounded-2xl border border-white/10 min-h-[450px] transition-all duration-500",
                    result ? `bg-gradient-to-b ${getRiskGradient(result.risk_score)}` : "bg-white/5"
                )}>
                    {!result ? (
                        <div className="text-center text-slate-400 space-y-4">
                            <div className="relative mx-auto w-fit">
                                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full blur-xl opacity-50 animate-pulse" />
                                <div className="relative p-6 rounded-full bg-slate-800/80 border border-white/10">
                                    <Activity className="h-10 w-10 text-slate-500" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="font-medium text-slate-300">Ready to Simulate</p>
                                <p className="text-sm max-w-[250px] mx-auto">Adjust the health parameters and click "Run Simulation" to see AI predictions</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full space-y-6 animate-in fade-in zoom-in-95 duration-500">
                            {/* Risk Score Display */}
                            <div className="text-center space-y-3">
                                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Estimated Health Risk</p>
                                <div className={cn(
                                    "text-6xl font-black tabular-nums transition-all duration-500",
                                    getRiskTextColor(result.risk_score)
                                )}>
                                    {(result.risk_score * 100).toFixed(0)}
                                    <span className="text-3xl">%</span>
                                </div>
                                <Badge
                                    className={cn(
                                        "px-4 py-1.5 text-sm font-semibold border-0 shadow-lg transition-all duration-500",
                                        result.risk_level === "High"
                                            ? "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-500/30"
                                            : result.risk_level === "Medium"
                                                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30"
                                                : "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-500/30"
                                    )}
                                >
                                    {result.risk_level === "High" && <TrendingUp className="h-3.5 w-3.5 mr-1.5" />}
                                    {result.risk_level === "Low" && <TrendingDown className="h-3.5 w-3.5 mr-1.5" />}
                                    {result.risk_level} Risk Level
                                </Badge>
                            </div>

                            {/* Risk Bar */}
                            <div className="space-y-2 px-4">
                                <div className="flex justify-between text-xs text-slate-500 font-medium">
                                    <span>Safe Zone</span>
                                    <span>Danger Zone</span>
                                </div>
                                <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-1000 ease-out",
                                            result.risk_score < 0.3
                                                ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                                                : result.risk_score < 0.7
                                                    ? "bg-gradient-to-r from-amber-500 to-orange-400"
                                                    : "bg-gradient-to-r from-rose-500 to-red-400"
                                        )}
                                        style={{ width: `${result.risk_score * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="space-y-3 pt-2">
                                <h4 className="font-semibold text-white flex items-center gap-2">
                                    <Heart className="h-4 w-4 text-rose-400" />
                                    AI Recommendations
                                </h4>
                                <ul className="space-y-2">
                                    {result.recommendation.map((rec, idx) => (
                                        <li
                                            key={idx}
                                            className="flex items-start gap-3 text-sm text-slate-300 p-3 rounded-lg bg-white/5 border border-white/10 animate-in slide-in-from-left duration-300"
                                            style={{ animationDelay: `${idx * 100}ms` }}
                                        >
                                            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="pt-4 space-y-3 border-t border-white/10">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-300">Save to Patient Record</p>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <PatientSelector onSelect={setSelectedPatientId} />
                                        </div>
                                        <Button
                                            onClick={handleSave}
                                            disabled={!selectedPatientId || saving}
                                            className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25 min-w-[100px]"
                                        >
                                            {saving ? "Saving..." : "Save"}
                                        </Button>
                                    </div>
                                </div>
                                {saveMessage && (
                                    <p className={cn("text-xs", saveMessage.includes("Saved") ? "text-emerald-400" : "text-rose-400")}>
                                        {saveMessage}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
