"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, AlertCircle, CheckCircle2, Scan, Sparkles, Brain, X, ImageIcon, Stethoscope, Activity, FileWarning } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { PatientSelector } from "@/components/patient-selector"
import { HeatmapViewer } from "@/components/explainability/heatmap-viewer"
import { ConfidenceBadge } from "@/components/explainability/confidence-badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface AnalysisClientProps {
    userRole: string
}

const SCAN_TYPES = [
    { id: "xray", name: "X-Ray", icon: "🩻", description: "Chest & bone imaging" },
    { id: "ct", name: "CT Scan", icon: "🔬", description: "Cross-sectional imaging" },
    { id: "mri", name: "MRI", icon: "🧲", description: "Magnetic resonance imaging" },
]

export function AnalysisClient({ userRole }: AnalysisClientProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [scanType, setScanType] = useState("xray")
    const [explain, setExplain] = useState(true)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            setFile(selectedFile)
            setPreview(URL.createObjectURL(selectedFile))
            setResult(null)
            setError(null)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const selectedFile = e.dataTransfer.files[0]
            if (selectedFile.type.startsWith("image/")) {
                setFile(selectedFile)
                setPreview(URL.createObjectURL(selectedFile))
                setResult(null)
                setError(null)
            }
        }
    }

    const [selectedPatientId, setSelectedPatientId] = useState<string>("")
    const [saving, setSaving] = useState(false)
    const [saveMessage, setSaveMessage] = useState("")

    const handleSave = async () => {
        if (!selectedPatientId || !result) return
        setSaving(true)
        setSaveMessage("")

        try {
            const apiData = {
                patientId: selectedPatientId,
                scanType: result.scan_type || scanType.toUpperCase(),
                diagnosis: result.prediction,
                confidence: result.confidence,
                severity: result.severity || "Medium",
                findings: {
                    result: result.prediction,
                    details: result.findings || []
                },
                recommendations: result.recommendations || ["Consult Radiologist"],
                processingTime: 0.3,
                modelVersion: "DenseNet121"
            }

            const { saveImageAnalysis } = await import("@/app/actions/analysis")
            const response = await saveImageAnalysis(apiData)
            if (response.error) throw new Error(response.error)
            setSaveMessage("Saved to patient record!")
        } catch (error) {
            setSaveMessage("Failed to save.")
        } finally {
            setSaving(false)
        }
    }

    const handleAnalyze = async () => {
        if (!file) return

        setLoading(true)
        setError(null)

        const formData = new FormData()
        formData.append("file", file)
        formData.append("scan_type", scanType)
        formData.append("explain", explain.toString())

        try {
            const res = await fetch("/api/predict/image", {
                method: "POST",
                body: formData,
            })

            if (!res.ok) {
                throw new Error("Failed to analyze image")
            }

            const responseJson = await res.json()
            let resultData = responseJson

            if (responseJson.success && responseJson.data) {
                resultData = responseJson.data
            }

            setResult(resultData)

            // Auto-switch tab if corrected
            if (resultData.auto_corrected && resultData.scan_type) {
                const correctedType = resultData.scan_type.toLowerCase()
                if (correctedType.includes("x-ray")) setScanType("xray")
                else if (correctedType.includes("ct")) setScanType("ct")
                else if (correctedType.includes("mri")) setScanType("mri")
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    const isPatient = userRole === 'patient' || userRole === 'user'

    const getSeverityColor = (severity: string) => {
        switch (severity?.toLowerCase()) {
            case "critical": return "bg-red-500/20 border-red-500/30 text-red-400"
            case "high": return "bg-rose-500/20 border-rose-500/30 text-rose-400"
            case "medium": return "bg-amber-500/20 border-amber-500/30 text-amber-400"
            case "low": return "bg-blue-500/20 border-blue-500/30 text-blue-400"
            default: return "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
        }
    }

    const [feedbackSent, setFeedbackSent] = useState(false)
    const [retraining, setRetraining] = useState(false)
    const [showRetrainConfirm, setShowRetrainConfirm] = useState(false)

    const handleFeedback = async (correctLabel: string) => {
        if (!result?.id) return

        try {
            const res = await fetch("/api/predict/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image_id: result.id,
                    scan_type: result.scan_type.toLowerCase().includes("x-ray") ? "xray" :
                        result.scan_type.toLowerCase().includes("ct") ? "ct" : "mri",
                    correct_label: correctLabel
                })
            })
            if (res.ok) {
                setFeedbackSent(true)
            }
        } catch (e) {
            console.error("Feedback failed", e)
        }
    }

    // Helper to map display name to simplified backend scan type
    const getBackendScanType = () => {
        if (scanType === 'xray') return 'xray'
        if (scanType === 'ct') return 'ct'
        if (scanType === 'mri') return 'mri'
        return 'xray'
    }

    const handleRetrain = async () => {
        setRetraining(true)
        try {
            const res = await fetch("/api/predict/retrain", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    scan_type: getBackendScanType(),
                    epochs: 5
                })
            })
            if (res.ok) {
                alert(`Training started for ${getBackendScanType().toUpperCase()}! The model will update automatically when finished.`)
            } else {
                alert("Failed to start training.")
            }
        } catch (e) {
            alert("Error triggering training.")
        } finally {
            setRetraining(false)
        }
    }

    // Determine possible labels based on scan type for correction buttons
    const getPossibleLabels = () => {
        // Use result scan type if available (handles auto-correction), else current state
        const effectiveType = result?.scan_type
            ? (result.scan_type.toLowerCase().includes('x-ray') ? 'xray' : result.scan_type.toLowerCase().includes('ct') ? 'ct' : 'mri')
            : scanType

        if (effectiveType === 'xray') return ["Normal", "Pneumonia"]
        if (effectiveType === 'ct') return ["Normal", "Tumor"]
        if (effectiveType === 'mri') return ["Normal", "Brain_Tumor"]
        return ["Normal", "Abnormal"]
    }

    return (
        <div className="space-y-6">
            {/* Scan Type Selector */}
            <div className="bento-card p-4">
                <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Select Scan Type</p>
                    {/* Retrain Button for Doctors/Admins */}
                    {userRole !== 'patient' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowRetrainConfirm(true)}
                            disabled={retraining}
                            className="text-xs h-7 gap-1 bg-secondary/50 hover:bg-primary/10 border-primary/20"
                        >
                            <Brain className={cn("h-3 w-3", retraining && "animate-pulse")} />
                            {retraining ? "Training..." : "Retrain Model"}
                        </Button>
                    )}
                </div>

                {/* Retrain Confirmation Dialog (Simple Inline for now) */}
                {showRetrainConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-background border border-border p-6 rounded-xl shadow-xl max-w-sm w-full space-y-4">
                            <h3 className="text-lg font-semibold">Start Retraining?</h3>
                            <p className="text-sm text-muted-foreground">
                                This will start a background training session for <b>{getBackendScanType().toUpperCase()}</b> using the latest feedback data. This may take a few minutes.
                            </p>
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" onClick={() => setShowRetrainConfirm(false)}>Cancel</Button>
                                <Button onClick={handleRetrain}>Confirm Start</Button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                    {SCAN_TYPES.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => setScanType(type.id)}
                            className={cn(
                                "p-4 rounded-xl border-2 transition-all duration-200 text-left",
                                scanType === type.id
                                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                                    : "border-border/50 bg-secondary/30 hover:bg-secondary/50 hover:border-primary/30"
                            )}
                        >
                            <div className="text-2xl mb-2">{type.icon}</div>
                            <p className="font-semibold">{type.name}</p>
                            <p className="text-xs text-muted-foreground">{type.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {isPatient && (
                <Alert className="bg-amber-500/10 border-amber-500/20">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-amber-700 dark:text-amber-300">
                        This is for informational purposes only. Please consult a doctor for official diagnosis.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Upload Card */}
                <div className="bento-card overflow-hidden">
                    <CardHeader className="border-b border-border/50 bg-muted/20">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Upload className="h-5 w-5 text-primary" />
                            Upload {SCAN_TYPES.find(t => t.id === scanType)?.name}
                        </CardTitle>
                        <CardDescription>
                            Drag and drop or click to upload your medical image
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6 space-y-4">
                        {!preview ? (
                            <div
                                className={cn(
                                    "relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 text-center cursor-pointer min-h-[280px] transition-all duration-300",
                                    isDragging
                                        ? "border-primary bg-primary/10 scale-[1.02]"
                                        : "border-border hover:border-primary/50 hover:bg-secondary/30"
                                )}
                                onClick={() => document.getElementById('file-upload')?.click()}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/50 rounded-full blur-xl opacity-30 animate-pulse" />
                                    <div className="relative p-5 rounded-full bg-primary/10 border border-primary/20">
                                        <Upload className={cn(
                                            "h-8 w-8 transition-colors",
                                            isDragging ? "text-primary" : "text-muted-foreground"
                                        )} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="font-semibold">
                                        {isDragging ? "Drop your image here" : "Click or drag image to upload"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Supports JPG, PNG, DICOM • Max 10MB</p>
                                </div>
                            </div>
                        ) : (
                            <div className="relative group rounded-2xl overflow-hidden border border-border/50 min-h-[280px] bg-secondary/20 flex items-center justify-center">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="max-h-[280px] w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-3 right-3 h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setFile(null)
                                        setPreview(null)
                                        setResult(null)
                                        setFeedbackSent(false)
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="flex items-center gap-2 text-xs text-white bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2">
                                        <ImageIcon className="h-3.5 w-3.5" />
                                        <span className="truncate">{file?.name}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="file-upload"
                            onChange={handleFileChange}
                        />

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-primary/20">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Explainable AI (XAI)</Label>
                                <p className="text-[10px] text-muted-foreground italic">Generate visual heatmaps & uncertainty metrics</p>
                            </div>
                            <Switch checked={explain} onCheckedChange={setExplain} />
                        </div>

                        <Button
                            className={cn(
                                "w-full h-12 text-base font-semibold transition-all duration-300",
                                file && !loading
                                    ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02]"
                                    : "bg-secondary text-muted-foreground cursor-not-allowed"
                            )}
                            disabled={!file || loading}
                            onClick={handleAnalyze}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Analyzing {SCAN_TYPES.find(t => t.id === scanType)?.name}...
                                </>
                            ) : (
                                <>
                                    <Scan className="mr-2 h-5 w-5" />
                                    Analyze {SCAN_TYPES.find(t => t.id === scanType)?.name}
                                </>
                            )}
                        </Button>
                    </CardContent>
                </div>

                {/* Results Card */}
                <div className={cn(
                    "bento-card overflow-hidden transition-all duration-500",
                    result && (result.severity === "Normal" || result.severity === "Low"
                        ? "ring-2 ring-emerald-500/30"
                        : result.severity === "Critical" || result.severity === "High"
                            ? "ring-2 ring-rose-500/30"
                            : "ring-2 ring-amber-500/30"
                    )
                )}>
                    <CardHeader className="border-b border-border/50 bg-muted/20">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Analysis Results
                        </CardTitle>
                        <CardDescription>
                            AI detection, findings, and recommendations
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6 min-h-[400px]">
                        {result ? (
                            <div className="w-full space-y-5 animate-in fade-in zoom-in-95 duration-500">
                                {/* Auto-Correction Notice */}
                                {result.auto_corrected && (
                                    <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3 animate-pulse">
                                        <Brain className="h-5 w-5 text-indigo-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Smart Calibration Active</p>
                                            <p className="text-xs text-muted-foreground">
                                                Our AI detected you uploaded a <b>{result.scan_type}</b> and automatically switched the analysis mode for better accuracy.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Scan Type & Severity */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="bg-primary/10 border-primary/30">
                                        {result.scan_type || SCAN_TYPES.find(t => t.id === scanType)?.name}
                                    </Badge>
                                    <Badge className={cn("border", getSeverityColor(result.severity))}>
                                        {result.severity || "Unknown"} Severity
                                    </Badge>
                                    {result.confidence_metrics && (
                                        <ConfidenceBadge
                                            confidence={result.confidence_metrics.confidence}
                                            uncertainty={result.confidence_metrics.uncertainty_level}
                                            reviewRequired={result.confidence_metrics.review_required}
                                        />
                                    )}
                                </div>

                                {/* Prediction Result */}
                                <div className={cn(
                                    "p-4 rounded-xl border flex items-center gap-4",
                                    result.severity === "Normal" || result.severity === "Low"
                                        ? "bg-emerald-500/10 border-emerald-500/20"
                                        : result.severity === "Critical" || result.severity === "High"
                                            ? "bg-rose-500/10 border-rose-500/20"
                                            : "bg-amber-500/10 border-amber-500/20"
                                )}>
                                    {result.severity === "Normal" || result.severity === "Low" ? (
                                        <div className="p-3 rounded-full bg-emerald-500/20">
                                            <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                                        </div>
                                    ) : result.severity === "Critical" || result.severity === "High" ? (
                                        <div className="p-3 rounded-full bg-rose-500/20">
                                            <FileWarning className="h-7 w-7 text-rose-500" />
                                        </div>
                                    ) : (
                                        <div className="p-3 rounded-full bg-amber-500/20">
                                            <AlertCircle className="h-7 w-7 text-amber-500" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-lg">{result.prediction}</h3>
                                        <p className="text-sm text-muted-foreground">AI Diagnosis</p>
                                    </div>
                                    {result.triage && (
                                        <div className="ml-auto text-right">
                                            <Badge className={cn(
                                                "text-[10px] uppercase font-bold",
                                                result.triage.priority === 'high' ? 'bg-rose-500' :
                                                    result.triage.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                                            )}>
                                                {result.triage.priority} Priority
                                            </Badge>
                                            <p className="text-[9px] text-muted-foreground mt-0.5">{result.triage.triageNote}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Confidence */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Confidence Score</span>
                                        <span className="font-bold tabular-nums">
                                            {(result.confidence * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: `${result.confidence * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* XAI Heatmap Integration */}
                                {result.explanation_url && preview && (
                                    <HeatmapViewer
                                        originalImage={preview}
                                        heatmapUrl={`http://localhost:8000${result.explanation_url}`}
                                        summary={result.explanation_text}
                                    />
                                )}

                                {/* Findings */}
                                {result.findings && result.findings.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium flex items-center gap-2">
                                            <Stethoscope className="h-4 w-4 text-primary" />
                                            Key Findings
                                        </p>
                                        <ul className="space-y-1.5">
                                            {result.findings.map((finding: string, idx: number) => (
                                                <li key={idx} className="text-sm p-2 rounded-lg bg-secondary/50 border border-border/50 flex items-start gap-2">
                                                    <span className="text-primary mt-0.5">•</span>
                                                    {finding}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Recommendations */}
                                {result.recommendations && result.recommendations.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-primary" />
                                            Recommendations
                                        </p>
                                        <ul className="space-y-1.5">
                                            {result.recommendations.map((rec: string, idx: number) => (
                                                <li key={idx} className="text-sm p-2 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-2">
                                                    {rec.includes("🚨") || rec.includes("IMMEDIATE") ? (
                                                        <span className="text-rose-500 mt-0.5">⚠️</span>
                                                    ) : rec.includes("⚠️") ? (
                                                        <span className="text-amber-500 mt-0.5">⚠️</span>
                                                    ) : (
                                                        <span className="text-emerald-500 mt-0.5">✓</span>
                                                    )}
                                                    {rec.replace(/🚨|⚠️|✅/g, '').trim()}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Feedback Section (Continuous Learning) */}
                                {result.id && !feedbackSent && (
                                    <div className="p-4 rounded-xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-emerald-500/10 opacity-50" />
                                        <div className="relative z-10 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-semibold text-primary">Help Improve AI Accuracy</p>
                                                    <p className="text-xs text-muted-foreground">Is this diagnosis correct?</p>
                                                </div>
                                                <Sparkles className="h-4 w-4 text-primary/40" />
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-8 text-xs bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all duration-300 hover:scale-105"
                                                    onClick={() => handleFeedback(result.prediction)}
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                                    Yes, Correct
                                                </Button>

                                                {getPossibleLabels().filter(l => l !== result.prediction).map(label => (
                                                    <Button
                                                        key={label}
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-xs transition-all duration-300 hover:bg-secondary/80"
                                                        onClick={() => handleFeedback(label)}
                                                    >
                                                        No, it's {label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {feedbackSent && (
                                    <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 text-sm font-medium text-center border border-emerald-500/20 flex items-center justify-center gap-2 animate-in fade-in zoom-in-90">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Thank you! The model will learn from this.
                                    </div>
                                )}

                                {/* Model Info */}
                                <div className="p-3 rounded-xl bg-secondary/30 border border-border/50 space-y-2">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Model Info</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Architecture</span>
                                            <span className="font-medium">{result.model_info?.architecture || "DenseNet121"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Type</span>
                                            <span className="font-medium">{result.model_info?.type || "Medical"}</span>
                                        </div>
                                    </div>
                                </div>

                                {!isPatient && (
                                    <div className="pt-4 space-y-3 border-t border-border/50">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">Save to Patient Record</p>
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <PatientSelector onSelect={setSelectedPatientId} />
                                                </div>
                                                <Button
                                                    onClick={handleSave}
                                                    disabled={!selectedPatientId || saving}
                                                    className="min-w-[100px]"
                                                >
                                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                                                </Button>
                                            </div>
                                        </div>
                                        {saveMessage && (
                                            <p className={cn("text-xs", saveMessage.includes("Saved") ? "text-emerald-500" : "text-rose-500")}>
                                                {saveMessage}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground space-y-4">
                                <div className="relative mx-auto w-fit">
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/50 rounded-full blur-xl opacity-30 animate-pulse" />
                                    <div className="relative p-6 rounded-full bg-secondary/50 border border-border/50">
                                        <Scan className="h-12 w-12 text-muted-foreground/50" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="font-medium">Awaiting Image</p>
                                    <p className="text-sm max-w-[280px] mx-auto">Upload a medical image and click "Analyze" to get AI predictions</p>
                                    <div className="flex items-center justify-center gap-2 text-xs text-primary/80 pt-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                        <span>Continuous Learning Enabled</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </div>
            </div >
        </div >
    )
}
