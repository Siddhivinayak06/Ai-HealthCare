"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, AlertCircle, CheckCircle2, Scan, Sparkles, Brain, X, ImageIcon, Stethoscope, Activity, FileWarning, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { PatientSelector } from "@/components/patient-selector"
import { HeatmapViewer } from "@/components/explainability/heatmap-viewer"
import { ConfidenceBadge } from "@/components/explainability/confidence-badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { saveImageAnalysis, getLatestScanForPatient, compareImagingTrends, getHistoricalTrendsForPatient, submitFeedback } from "@/app/actions/analyses"
import { toast } from "sonner"
import { PatientTrendChart } from "@/components/patient-trend-chart"
import { useRouter } from "next/navigation"
import { getPatients } from "@/app/actions/patients"

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
    const [previousScan, setPreviousScan] = useState<any>(null)
    const [isBatch, setIsBatch] = useState(false)
    const [historyData, setHistoryData] = useState<any[]>([])
    const [comparisonNote, setComparisonNote] = useState<string>("")
    const [analyzingComparison, setAnalyzingComparison] = useState(false)
    const [selectedPatientId, setSelectedPatientId] = useState<string>("")
    const [saving, setSaving] = useState(false)
    const [saveMessage, setSaveMessage] = useState("")
    const router = useRouter()

    // Auto-select patient for patient users
    useEffect(() => {
        const initPatient = async () => {
            if (userRole === 'patient' || userRole === 'user') {
                const patients = await getPatients()
                if (patients && patients.length > 0) {
                    handlePatientChange(patients[0].id)
                }
            }
        }
        initPatient()
    }, [userRole])

    // Generate comparative note when results are ready
    useEffect(() => {
        const generateNote = async () => {
            if (result && previousScan && !comparisonNote && !analyzingComparison) {
                setAnalyzingComparison(true)
                try {
                    const response = await compareImagingTrends(previousScan, {
                        scanType: result.scan_type || scanType,
                        diagnosis: result.prediction,
                        severity: result.severity,
                        findings: result.findings
                    })

                    if (response.success) {
                        setComparisonNote(response.summary)
                    }
                } catch (e) {
                    console.error("Comparison generation failed", e)
                } finally {
                    setAnalyzingComparison(false)
                }
            }
        }
        generateNote()
    }, [result, previousScan])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            setFile(selectedFile)
            setPreview(URL.createObjectURL(selectedFile))
            setResult(null)
            setError(null)
            setIsBatch(selectedFile.name.endsWith(".zip"))
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const selectedFile = e.dataTransfer.files[0]
            if (selectedFile.type.startsWith("image/") || selectedFile.name.endsWith(".zip")) {
                setFile(selectedFile)
                setPreview(selectedFile.name.endsWith(".zip") ? null : URL.createObjectURL(selectedFile))
                setResult(null)
                setError(null)
                setIsBatch(selectedFile.name.endsWith(".zip"))
            }
        }
    }

    const handlePatientChange = async (id: string) => {
        setSelectedPatientId(id)
        if (id) {
            const lastScan = await getLatestScanForPatient(id)
            setPreviousScan(lastScan)
            const trends = await getHistoricalTrendsForPatient(id)
            setHistoryData(trends)
        } else {
            setPreviousScan(null)
            setHistoryData([])
        }
    }

    const handleSave = async () => {
        if (!selectedPatientId || !result) return
        setSaving(true)
        setSaveMessage("")

        try {
            const apiData = {
                patientId: selectedPatientId,
                scanType: (result.scan_type || scanType).toUpperCase(),
                diagnosis: result.prediction,
                confidence: result.confidence * 100,
                severity: result.severity || "Medium",
                findings: {
                    result: result.prediction,
                    details: result.findings || []
                },
                recommendations: (result.recommendations || ["Consult Radiologist"]).join(", "),
                processingTime: result.processing_time || 0.3,
                modelVersion: result.model_info?.architecture || "DenseNet121"
            }

            const response = await saveImageAnalysis(apiData)
            if (!response.success) throw new Error(response.error)
            setSaveMessage("Saved to patient record!")
            handlePatientChange(selectedPatientId) // Refresh history
            router.refresh()
        } catch (error: any) {
            setSaveMessage(error.message || "Failed to save.")
        } finally {
            setSaving(false)
        }
    }

    const handleAnalyze = async () => {
        if (!file) return
        setLoading(true)
        setError(null)
        setResult(null)
        setComparisonNote("")

        const formData = new FormData()
        formData.append("file", file)
        formData.append("scan_type", scanType)
        formData.append("explain", explain.toString())
        formData.append("is_batch", isBatch.toString())
        if (selectedPatientId) {
            formData.append("patientId", selectedPatientId)
        }

        try {
            const res = await fetch("/api/predict/image", {
                method: "POST",
                body: formData,
            })

            if (!res.ok) throw new Error("Failed to analyze image")

            const responseJson = await res.json()
            setResult(responseJson.success ? responseJson.data : responseJson)

            if (responseJson.auto_corrected && responseJson.scan_type) {
                const correctedType = responseJson.scan_type.toLowerCase()
                if (correctedType.includes("x-ray")) setScanType("xray")
                else if (correctedType.includes("ct")) setScanType("ct")
                else if (correctedType.includes("mri")) setScanType("mri")
            }

            // Auto-save if patient is selected
            // Auto-save if patient is selected
            if (selectedPatientId && (responseJson.success || responseJson.prediction)) {
                // If API already saved to DB, just refresh
                if (responseJson.dbScanId) {
                    setSaveMessage("Auto-saved to patient record")
                    handlePatientChange(selectedPatientId)
                    toast.success("Analysis saved to patient record")
                    router.refresh()
                } else {
                    // Fallback: Manually save if API didn't
                    const data = responseJson.success ? responseJson.data : responseJson
                    try {
                        setSaving(true)
                        const apiData = {
                            patientId: selectedPatientId,
                            scanType: (data.scan_type || scanType).toUpperCase(),
                            diagnosis: data.prediction,
                            confidence: data.confidence * 100,
                            severity: data.severity || "Medium",
                            findings: {
                                result: data.prediction,
                                details: data.findings || []
                            },
                            recommendations: (data.recommendations || ["Consult Radiologist"]).join(", "),
                            processingTime: data.processing_time || 0.3,
                            modelVersion: data.model_info?.architecture || "DenseNet121"
                        }
                        await saveImageAnalysis(apiData)
                        setSaveMessage("Auto-saved to patient record")
                        handlePatientChange(selectedPatientId) // Refresh history
                        toast.success("Analysis saved to patient record")
                        router.refresh()
                    } catch (saveError) {
                        console.error("Auto-save failed", saveError)
                        setSaveMessage("Auto-save failed")
                    } finally {
                        setSaving(false)
                    }
                }
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

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

            await submitFeedback({
                entityId: result.id,
                entityType: "IMAGE_ANALYSIS",
                action: correctLabel === result.prediction ? "APPROVE" : "OVERRIDE",
                feedback: `Clinician corrected AI prediction from ${result.prediction} to ${correctLabel}`,
                findings: result.findings,
                confidenceScore: result.confidence * 100
            })

            if (res.ok) {
                setFeedbackSent(true)
                toast.success("Feedback recorded")
            }
        } catch (e) {
            toast.error("Failed to record feedback")
        }
    }

    const [feedbackSent, setFeedbackSent] = useState(false)
    const [retraining, setRetraining] = useState(false)
    const [showRetrainConfirm, setShowRetrainConfirm] = useState(false)

    const handleRetrain = async () => {
        setRetraining(true)
        try {
            const res = await fetch("/api/predict/retrain", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scan_type: scanType, epochs: 5 })
            })
            if (res.ok) toast.success("Training started!")
            else toast.error("Failed to start training")
        } catch (e) {
            toast.error("Error triggering training")
        } finally {
            setRetraining(false)
            setShowRetrainConfirm(false)
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity?.toLowerCase()) {
            case "critical": return "bg-red-500/20 border-red-500/30 text-red-400"
            case "high": return "bg-rose-500/20 border-rose-500/30 text-rose-400"
            case "medium": return "bg-amber-500/20 border-amber-500/30 text-amber-400"
            default: return "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
        }
    }

    const getPossibleLabels = () => {
        if (scanType === 'xray') return ["Normal", "Pneumonia"]
        if (scanType === 'ct') return ["Normal", "Tumor"]
        return ["Normal", "Brain_Tumor"]
    }

    const isPatient = userRole === 'patient' || userRole === 'user'

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Scan Type Selection */}
            <div className="health-card p-6 relative overflow-hidden group bg-card/95 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5" />
                <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Scan className="h-4 w-4 text-violet-400" />
                                Modality Selection
                            </h3>
                            <p className="text-xs text-muted-foreground/70">Choose imaging type for neural processing</p>
                        </div>
                        {!isPatient && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowRetrainConfirm(true)}
                                disabled={retraining}
                                className="glass-panel h-8 border-violet-500/30 text-violet-300 hover:bg-violet-500/20 gap-2 hover-glow"
                            >
                                <Brain className={cn("h-3.5 w-3.5", retraining && "animate-pulse")} />
                                {retraining ? "Training..." : "Retrain Model"}
                            </Button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {SCAN_TYPES.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setScanType(type.id)}
                                className={cn(
                                    "relative p-5 rounded-2xl border-2 transition-all duration-500 text-left group overflow-hidden",
                                    scanType === type.id
                                        ? "border-violet-500/50 bg-violet-500/10 shadow-[0_0_25px_-5px_oklch(from_var(--primary)_l_c_h_/_0.3)]"
                                        : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10"
                                )}
                            >
                                <div className={cn(
                                    "text-3xl mb-3 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6",
                                    scanType === type.id && "scale-110"
                                )}>
                                    {type.icon}
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-foreground tracking-tight">{type.name}</p>
                                    <p className="text-[10px] text-muted-foreground leading-tight">{type.description}</p>
                                </div>
                                {scanType === type.id && (
                                    <div className="absolute top-3 right-3">
                                        <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Retrain Confirmation Modal */}
            {showRetrainConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="glass-panel-heavy p-8 rounded-3xl max-w-md w-full space-y-6 border-violet-500/30">
                        <div className="h-16 w-16 rounded-2xl bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
                            <Brain className="h-8 w-8 text-violet-400" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold text-foreground">Initiate Neural Retraining?</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                This will fine-tune the {scanType.toUpperCase()} architecture using validated clinical feedback.
                                <span className="block mt-1 text-violet-400 font-medium">Estimated duration: 3-5 minutes.</span>
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setShowRetrainConfirm(false)}>Abort</Button>
                            <Button className="flex-1 bg-violet-600 hover:bg-violet-500 rounded-xl" onClick={handleRetrain}>Confirm retrain</Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-8 lg:grid-cols-12">
                {/* Upload & Controls */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="health-card overflow-hidden flex flex-col h-full bg-card/95 backdrop-blur-sm">
                        <div className="p-5 border-b border-border/30 bg-gradient-to-r from-cyan-500/5 to-transparent">
                            <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest">
                                <Upload className="h-4 w-4 text-cyan-400" />
                                Acquisition
                            </h3>
                        </div>
                        <div className="p-8 flex-1 flex flex-col space-y-6">
                            <div
                                className={cn(
                                    "relative flex-1 min-h-[300px] border-2 border-dashed rounded-3xl transition-all duration-500 flex flex-col items-center justify-center gap-6 cursor-pointer group",
                                    isDragging ? "border-violet-500 bg-violet-500/10" : "border-white/10 hover:border-violet-400/30 hover:bg-white/[0.03]",
                                    loading && "animate-scan"
                                )}
                                onClick={() => document.getElementById('file-upload')?.click()}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                            >
                                {preview ? (
                                    <div className="relative w-full h-full p-4 p-center flex items-center justify-center">
                                        <img src={preview} alt="Input" className="max-h-[250px] rounded-2xl shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent rounded-2xl" />
                                    </div>
                                ) : isBatch ? (
                                    <div className="p-8 bg-violet-500/10 rounded-2xl border border-violet-500/20 flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                                        <div className="h-16 w-16 rounded-full bg-violet-500/20 flex items-center justify-center">
                                            <FileWarning className="h-8 w-8 text-violet-400" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-foreground">{file?.name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Batch Archive Locked</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-4">
                                        <div className="h-20 w-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-violet-500/10 transition-all duration-500">
                                            <ImageIcon className="h-10 w-10 text-slate-500 group-hover:text-violet-400 transition-colors" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-foreground">Drop clinical imaging</p>
                                            <p className="text-xs text-muted-foreground">Supports DICOM, JPEG, PNG, ZIP</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} accept="image/*,.zip" />

                            <div className="space-y-4">
                                <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-cyan-500/10">
                                            <Sparkles className="h-4 w-4 text-cyan-400" />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-bold text-foreground">Explainable AI (XAI)</Label>
                                            <p className="text-[10px] text-muted-foreground">Enable feature saliency maps</p>
                                        </div>
                                    </div>
                                    <Switch checked={explain} onCheckedChange={setExplain} className="data-[state=checked]:bg-cyan-500" />
                                </div>

                                <Button
                                    className="w-full h-14 text-white font-bold rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-xl shadow-violet-500/20 hover-glow group transition-all duration-300"
                                    disabled={!file || loading}
                                    onClick={handleAnalyze}
                                >
                                    {loading ? (
                                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                    ) : (
                                        <Scan className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                                    )}
                                    {loading ? "PROCESSING NEURAL LAYERS..." : "EXECUTE AI ANALYSIS"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Insights & Results */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="health-card h-full bg-card/95 backdrop-blur-sm flex flex-col">
                        <div className="p-5 border-b border-border/30 bg-gradient-to-r from-violet-500/5 to-transparent flex justify-between items-center">
                            <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest">
                                <Activity className="h-4 w-4 text-violet-400" />
                                Diagnostics
                            </h3>
                            {result && (
                                <Badge className={cn("px-3 py-1 rounded-full text-[10px] font-bold tracking-tighter uppercase border-none",
                                    result.severity === "Critical" ? "bg-rose-500 text-white" :
                                        result.severity === "High" ? "bg-amber-500 text-black" : "bg-emerald-500 text-white")}>
                                    {result.severity} Priority
                                </Badge>
                            )}
                        </div>

                        <div className="p-8 flex-1">
                            {result ? (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    {/* Primary Result Card */}
                                    <div className={cn(
                                        "p-6 rounded-[32px] border flex flex-col md:flex-row items-center gap-6 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-500",
                                        result.severity === "Normal" ? "gradient-normal" :
                                            result.severity === "Medium" ? "gradient-warning" : "gradient-critical"
                                    )}>
                                        <div className={cn(
                                            "h-20 w-20 rounded-full flex items-center justify-center shrink-0 shadow-2xl",
                                            result.severity === "Normal" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                                        )}>
                                            {result.severity === "Normal" ? <CheckCircle2 className="h-10 w-10" /> : <AlertCircle className="h-10 w-10" />}
                                        </div>
                                        <div className="text-center md:text-left space-y-1">
                                            <h3 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{result.prediction}</h3>
                                            <div className="flex items-center justify-center md:justify-start gap-4">
                                                <div className="flex items-center gap-1.5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                                    <Brain className="h-3 w-3 text-violet-400" />
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{result.model_info?.architecture || "Inference Engine V3"}</span>
                                                </div>
                                                <span className="h-4 w-[1px] bg-border/40" />
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{(result.processing_time || 0.8).toFixed(2)}s Latency</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Confidence Metrics */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="health-card p-5 space-y-4 bg-card/95 backdrop-blur-sm">
                                            <div className="flex justify-between items-end">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Statistical Certainty</p>
                                                    <p className="text-2xl font-black text-foreground">{(result.confidence * 100).toFixed(1)}%</p>
                                                </div>
                                                {result.confidence_metrics && (
                                                    <ConfidenceBadge
                                                        confidence={result.confidence_metrics.confidence}
                                                        uncertainty={result.confidence_metrics.uncertainty_level}
                                                        reviewRequired={result.confidence_metrics.review_required}
                                                    />
                                                )}
                                            </div>
                                            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_oklch(from_var(--primary)_l_c_h_/_0.5)]"
                                                    style={{ width: `${result.confidence * 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="health-card p-5 flex flex-col justify-center gap-3 bg-card/95 backdrop-blur-sm">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Explainable Heatmap</p>
                                            <div className="flex items-center gap-3">
                                                {result.explanation_url ? (
                                                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold animate-pulse">
                                                        FEATURE SALIENCY GENERATED
                                                    </div>
                                                ) : (
                                                    <div className="p-2 rounded-lg bg-white/5 text-slate-500 text-xs font-medium">
                                                        Visual explanation disabled
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* XAI Viewer */}
                                    {result.explanation_url && preview && (
                                        <div className="animate-in fade-in zoom-in-95 duration-700 delay-300">
                                            <HeatmapViewer
                                                originalImage={preview}
                                                heatmapUrl={`http://localhost:8000${result.explanation_url}`}
                                            />
                                        </div>
                                    )}

                                    {/* Medical Report Findings */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {result.findings?.length > 0 && (
                                            <div className="space-y-4">
                                                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                    <Stethoscope className="h-4 w-4 text-violet-400" />
                                                    Clinical Findings
                                                </h4>
                                                <div className="space-y-2">
                                                    {result.findings.map((f: string, i: number) => (
                                                        <div key={i} className="group p-3.5 rounded-xl bg-card border border-border/40 hover:border-violet-500/30 transition-all shadow-sm hover:shadow-md">
                                                            <p className="text-xs text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors font-medium flex gap-2">
                                                                <span className="text-violet-500 mt-0.5">•</span>
                                                                {f}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-6">
                                            {/* Historical Comparison */}
                                            {previousScan && (
                                                <div className="health-card p-5 rounded-3xl border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent relative overflow-hidden animate-in slide-in-from-right-4 duration-700 delay-500">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                                        <Clock className="h-12 w-12 text-violet-300" />
                                                    </div>
                                                    <h4 className="text-[11px] font-bold text-violet-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        Longitudinal Contrast
                                                    </h4>
                                                    <div className="flex gap-4 items-start">
                                                        <div className="w-14 h-14 rounded-xl border border-border/20 overflow-hidden shrink-0 group hover:scale-110 transition-transform duration-500 shadow-sm">
                                                            <img src={previousScan.imageUrl} className="w-full h-full object-cover grayscale opacity-80 group-hover:opacity-100 group-hover:grayscale-0 transition-all" />
                                                        </div>
                                                        <div className="space-y-1 mt-1">
                                                            <p className="text-[10px] font-bold text-foreground uppercase">{previousScan.diagnosis}</p>
                                                            <p className="text-[9px] text-muted-foreground italic">Scan date: {new Date(previousScan.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    {comparisonNote && (
                                                        <div className="mt-4 p-3 rounded-xl bg-card/50 border border-violet-500/10 border-l-violet-500 border-l-2">
                                                            <p className="text-[10px] text-muted-foreground leading-relaxed italic line-clamp-2">“{comparisonNote}”</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Trend Visualization */}
                                            {historyData.length > 0 && (
                                                <div className="space-y-4 animate-in fade-in duration-700 delay-700">
                                                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                        Patient Trajectory
                                                    </h4>
                                                    <div className="h-[120px]">
                                                        <PatientTrendChart data={historyData} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Footers */}
                                    <div className="pt-6 border-t border-border/20 flex flex-col md:flex-row gap-4">
                                        {!feedbackSent && (
                                            <div className="flex-1 space-y-3">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Human-in-the-Loop Validation</p>
                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-9 px-4 rounded-xl border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30 transition-all font-semibold"
                                                        onClick={() => handleFeedback(result.prediction)}
                                                    >
                                                        <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                                                        Confirm Detection
                                                    </Button>
                                                    {getPossibleLabels().filter(l => l !== result.prediction).map(l => (
                                                        <Button
                                                            key={l}
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-9 px-4 rounded-xl border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all font-medium"
                                                            onClick={() => handleFeedback(l)}
                                                        >
                                                            Mark as {l}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {!isPatient && (
                                            <div className="w-full md:w-auto flex flex-col justify-end gap-3">
                                                <div className="w-full md:w-[240px]">
                                                    <PatientSelector onSelect={handlePatientChange} />
                                                </div>
                                                <Button
                                                    onClick={handleSave}
                                                    disabled={!selectedPatientId || saving}
                                                    className="w-full h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 font-bold text-xs"
                                                >
                                                    {saving ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                                            Archiving...
                                                        </>
                                                    ) : (
                                                        "Commit to Patient Record"
                                                    )}
                                                </Button>
                                                {saveMessage && <p className="text-[10px] text-center text-emerald-400 font-bold animate-in fade-in">{saveMessage}</p>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30 min-h-[400px]">
                                    <div className="relative">
                                        <Scan className="h-20 w-20 text-slate-400" />
                                        <div className="absolute inset-0 bg-violet-500/20 blur-2xl rounded-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-black text-slate-200 uppercase tracking-tight">System Idle</h4>
                                        <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed mx-auto italic">
                                            Telemetry stream ready. Upload a medical scan to initiate neural diagnostic analysis.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
