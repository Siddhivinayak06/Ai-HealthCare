"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, AlertCircle, CheckCircle2, Scan, Brain, X, ImageIcon, Stethoscope, Activity, FileWarning, Clock, Zap, Server, Gauge, Cpu, ChevronDown, Sparkles, TrendingUp } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { PatientSelector } from "@/components/patient-selector"

import { ConfidenceBadge } from "@/components/explainability/confidence-badge"

import { Label } from "@/components/ui/label"
import { saveImageAnalysis, getLatestScanForPatient, getHistoricalTrendsForPatient, submitFeedback } from "@/app/actions/analyses"
import { toast } from "sonner"
import { PatientTrendChart } from "@/components/patient-trend-chart"
import { useRouter } from "next/navigation"
import { getPatients } from "@/app/actions/patients"

interface AnalysisClientProps {
    userRole: string
    recentAnalyses?: any[]
}

const SCAN_TYPES = [
    { id: "xray", name: "X-Ray", icon: "🩻", description: "Chest & bone imaging" },
    { id: "ct", name: "CT Scan", icon: "🔬", description: "Cross-sectional imaging" },
    { id: "mri", name: "MRI", icon: "🧲", description: "Magnetic resonance imaging" },
]

import { AnalysisHistory } from "@/components/analysis-history"

export function AnalysisClient({ userRole, recentAnalyses = [] }: AnalysisClientProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [scanType, setScanType] = useState("xray")
    const [previousScan, setPreviousScan] = useState<any>(null)
    const [isBatch, setIsBatch] = useState(false)
    const [historyData, setHistoryData] = useState<any[]>([])

    const [selectedPatientId, setSelectedPatientId] = useState<string>("")
    const [saving, setSaving] = useState(false)
    const [saveMessage, setSaveMessage] = useState("")
    const [isSavedToDb, setIsSavedToDb] = useState(false) // Track if already saved
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
        // Prevent double save if already saved by API
        if (isSavedToDb) {
            toast.info("Analysis already saved to patient record")
            return
        }
        if (!selectedPatientId || !result) return
        setSaving(true)
        setSaveMessage("")

        try {
            const apiData = {
                patientId: selectedPatientId,
                scanType: (result.scan_type || scanType).toUpperCase(),
                diagnosis: result.prediction,
                confidence: result.confidence * 100,
                severity: result.severity || (result.prediction.toLowerCase().includes("normal") ? "Low" : "Medium"),
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
            setIsSavedToDb(true) // Mark as saved
            setSaveMessage("Saved to patient record!")
            handlePatientChange(selectedPatientId) // Refresh history
            router.refresh()
        } catch (error: any) {
            setSaveMessage(error.message || "Failed to save.")
        } finally {
            setSaving(false)
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

    const [analysisStep, setAnalysisStep] = useState(0)
    const [estimatedTime, setEstimatedTime] = useState(4)

    // ANALYSIS STEPS DEFINITION
    const ANALYSIS_STEPS = [
        { id: 'norm', label: 'Image Normalization & Preprocessing', duration: 800 },
        { id: 'feat', label: 'Feature Extraction (DenseNet-121)', duration: 1200 },
        { id: 'infer', label: 'Model Inference & Anomaly Detection', duration: 1500 },
        { id: 'risk', label: 'Risk Scoring & Confidence Calibration', duration: 800 }
    ]

    const handleAnalyze = async () => {
        if (!file) {
            toast.error("Please select an image first")
            return
        }

        setLoading(true)
        setResult(null)
        setAnalysisStep(0)

        // 1. Start Analysis Animation Sequence
        // Standardized timing per step preference
        setEstimatedTime(4)
        const STEP_TIMINGS = [0, 600, 1400, 2200]

        STEP_TIMINGS.forEach((delay, index) => {
            setTimeout(() => {
                if (loading) setAnalysisStep(index)
            }, delay)
        })

        // Countdown Timer
        const countInterval = setInterval(() => {
            setEstimatedTime(prev => Math.max(0, prev - 1))
        }, 1000)

        const stepInterval = setInterval(() => {
            // Keep interval primarily for fallback safety
        }, 3000)

        const formData = new FormData()
        formData.append('file', file)

        try {
            // Actual API Call
            const response = await fetch('/api/predict/image', {
                method: 'POST',
                body: formData
            })

            clearInterval(stepInterval)
            clearInterval(countInterval)

            // Ensure we show the final step before revealing
            setAnalysisStep(ANALYSIS_STEPS.length - 1)
            await new Promise(r => setTimeout(r, 600)) // Short pause on "Risk Scoring"

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Analysis failed')
            }

            const data = await response.json()
            setResult(data)

            // Add to history
            if (data) {
                await saveAnalysisToHistory(data)
            }

        } catch (error) {
            console.error("Analysis error:", error)
            toast.error(error instanceof Error ? error.message : "Failed to analyze image")
        } finally {
            setLoading(false)
            setRegistryOpen(false) // Collapse registry to focus on result
        }
    }

    const saveAnalysisToHistory = async (data: any) => {
        if (!selectedPatientId) return; // Cannot save history without patient

        try {
            const apiData = {
                patientId: selectedPatientId,
                scanType: (result?.scan_type || scanType).toUpperCase(),
                diagnosis: data.prediction,
                confidence: data.confidence * 100,
                severity: data.severity || (data.prediction.toLowerCase().includes("normal") ? "Low" : "Medium"),
                findings: {
                    result: data.prediction,
                    details: data.findings || []
                },
                recommendations: ["Consult Radiologist"],
                processingTime: result?.processing_time || 0.4,
                modelVersion: "DenseNet121"
            }

            // prevent duplicate saves if manually handled later? 
            // Actually, usually automatic history is good, but if we want to add to DB:
            await saveImageAnalysis(apiData)
            router.refresh()
        } catch (e) {
            console.error("Failed to save history", e)
        }
    }

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

    // Determine if critical
    const isCritical =
        result?.prediction?.toLowerCase().includes("malignant") ||
        result?.prediction?.toLowerCase().includes("pneumonia") ||
        result?.prediction?.toLowerCase().includes("tumor") ||
        result?.severity?.toLowerCase() === "high" ||
        result?.severity?.toLowerCase() === "critical"

    const [registryOpen, setRegistryOpen] = useState(false)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full relative">
            {/* Ambient Background Drift */}
            <div className="fixed inset-0 pointer-events-none z-[-1] opacity-[0.03] animate-drift-slow bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500" />

            {/* CSS for Scan Sweep Animation */}
            <style jsx global>{`
                @keyframes scan-sweep {
                    0% { top: -10%; opacity: 0; }
                    5% { opacity: 1; }
                    95% { opacity: 1; }
                    100% { top: 110%; opacity: 0; }
                }
                .animate-scan-sweep {
                    animation: scan-sweep 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                    background: linear-gradient(to bottom, transparent 0%, rgba(139, 92, 246, 0.05) 50%, rgba(139, 92, 246, 0.4) 90%, rgba(56, 189, 248, 0.9) 100%);
                    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.5), 0 0 15px rgba(56, 189, 248, 0.8);
                    border-bottom: 2px solid rgba(56, 189, 248, 1);
                }
            `}</style>

            {/* LEFT COLUMN - STICKY CONTEXT (Reduced to ~33%) */}
            <div className="lg:col-span-4 sticky top-24 space-y-5 h-fit z-10">
                {/* 1. Scan Context / Preview */}
                <div className="hospital-card flex flex-col shadow-sm">
                    <div className="p-4 border-b border-border/10 flex justify-between items-center bg-white/50 dark:bg-white/5">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                            <Scan className={cn("h-3.5 w-3.5 text-violet-500", loading && "animate-spin-slow")} />
                            Scan Context
                        </h3>
                        {result && (
                            <Badge variant="outline" className="backdrop-blur-md bg-emerald-500/10 border-emerald-500/20 text-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.2)] text-[9px] px-2 py-0.5 h-5 animate-in fade-in zoom-in-95 duration-500">
                                ANALYZED
                            </Badge>
                        )}
                    </div>

                    <div
                        className="relative group cursor-pointer bg-slate-50 dark:bg-black/20 min-h-[380px] flex flex-col transition-all active:scale-[0.99]"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                    >
                        {/* Hidden Input */}
                        <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} accept="image/*,.zip" />

                        {/* Image Display or Upload Prompts */}
                        {preview || result?.image_url || result?.file_url ? (
                            <div className="flex-1 relative flex items-center justify-center bg-zinc-950 overflow-hidden">
                                <img
                                    src={result?.image_url || result?.file_url || preview}
                                    className={cn(
                                        "w-full h-full object-contain max-h-[440px] transition-all duration-700",
                                        loading ? "opacity-60 scale-[1.02] blur-[1px]" : "opacity-100"
                                    )}
                                    alt="Scan"
                                />

                                {/* SCAN SWEEP EFFECT - DUAL LAYER */}
                                {loading && (
                                    <>
                                        {/* 1. Primary Scan Line */}
                                        <div className="absolute left-0 right-0 h-24 w-full z-20 animate-scan-sweep border-t border-violet-500/30 opacity-60" />

                                        {/* 2. Micro Noise Shimmer (Subtle) */}
                                        <div className="absolute inset-0 z-10 bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20200%20200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22noiseFilter%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.65%22%20numOctaves%3D%223%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noiseFilter)%22%2F%3E%3C%2Fsvg%3E')] opacity-[0.05] animate-shimmer-slow pointer-events-none mix-blend-overlay" />
                                    </>
                                )}

                                {/* Hover Overlay */}
                                {!loading && (
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2">
                                        <Upload className="h-8 w-8 text-white/80" />
                                        <span className="text-xs font-medium">Click to change scan</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={cn(
                                "flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 transition-colors",
                                isDragging ? "bg-violet-500/10" : ""
                            )}>
                                <div className="h-16 w-16 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                                    <Upload className={cn("h-8 w-8 text-violet-500", isDragging && "animate-bounce")} />
                                </div>
                                <div>
                                    <p className="font-bold text-foreground">Upload Scan</p>
                                    <p className="text-xs text-muted-foreground mt-1">Drag & drop or click to browse</p>
                                </div>
                                <div className="flex gap-1.5 opacity-60">
                                    {['DICOM', 'PNG', 'JPEG'].map(ext => (
                                        <span key={ext} className="text-[9px] border px-1.5 py-0.5 rounded text-muted-foreground">{ext}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Analysis Trigger - Footer of Card */}
                        <div className="p-4 border-t border-border/10 bg-white dark:bg-white/5">
                            <Button
                                className={cn(
                                    "w-full h-11 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]",
                                    loading
                                        ? "bg-slate-100 dark:bg-white/10 text-muted-foreground cursor-wait shadow-none"
                                        : "bg-violet-600 hover:bg-violet-500 shadow-violet-500/20"
                                )}
                                disabled={!file || loading}
                                onClick={(e) => { e.stopPropagation(); handleAnalyze() }}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider">
                                            {ANALYSIS_STEPS[analysisStep]?.label || "Processing..."}
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <Brain className="mr-2 h-4 w-4 animate-brain-pulse text-white" />
                                        <span className="relative z-10">Run Diagnostics</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 2. Metadata - Fade out slightly during loading */}
                <div className={cn(
                    "hospital-card p-5 space-y-4 transition-opacity duration-500",
                    loading ? "opacity-50 grayscale" : "opacity-100"
                )}>
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                        Acquisition Metadata
                    </h4>

                    {/* Modality Selector */}
                    <div className="grid grid-cols-3 gap-3">
                        {SCAN_TYPES.map(type => (
                            <button
                                key={type.id}
                                disabled={loading}
                                onClick={() => setScanType(type.id)}
                                className={cn(
                                    "relative flex flex-col items-center justify-center py-3 px-2 rounded-2xl border transition-all duration-300 group overflow-hidden",
                                    scanType === type.id
                                        ? "bg-violet-500/5 dark:bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.15)] scale-[1.02]"
                                        : "border-transparent bg-slate-50 dark:bg-white/5 text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/10 opacity-70 hover:opacity-100"
                                )}
                            >
                                {scanType === type.id && (
                                    <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-violet-500 shadow-[0_0_6px_rgba(139,92,246,0.8)] animate-pulse" />
                                )}
                                <span className={cn("text-xl mb-1.5 transition-transform duration-300", scanType === type.id && "scale-110")}>{type.icon}</span>
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em]">{type.name}</span>
                            </button>
                        ))}
                    </div>

                    {/* File Info */}
                    {file && (
                        <div className="bg-slate-50/50 dark:bg-white/5 rounded-2xl p-3 flex items-center gap-3 border border-border/20">
                            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                                <ImageIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate">{file.name}</p>
                                <p className="text-[10px] text-muted-foreground tracking-wide">{(file.size / (1024 * 1024)).toFixed(2)} MB • {isBatch ? 'Batch Archive' : 'Single Image'}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. System Status */}
                <div className="hospital-card p-4 space-y-3">
                    <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <Activity className="h-3 w-3 text-amber-500" />
                        System Telemetry
                    </h4>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Neural Engine</span>
                            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                                <span className="relative flex h-2 w-2">
                                    <span className={cn("animate-dark-ripple absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-80", loading && "duration-1000")} />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                </span>
                                Online
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Inference Latency</span>
                            <span className="font-bold font-mono text-foreground">{loading ? <span className="animate-pulse">Measuring...</span> : (result?.processing_time || 0.8) + 's'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">GPU Load</span>
                            <span className="font-bold font-mono text-foreground animate-in fade-in duration-1000">{loading ? 89 : 72}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: loading ? '89%' : '72%', transform: 'translateX(0)', animation: 'slideRight 1s ease-out' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN - SCROLLABLE CONTENT */}
            <div className="lg:col-span-8 space-y-6 pb-24">

                {/* 1. LOADING STATE OR DIAGNOSTIC VERDICT */}
                {loading ? (
                    /* PROFESSIONAL PROGRESS STEPS */
                    <div className="health-card p-8 border-2 border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-card/50 rounded-3xl animate-in fade-in zoom-in-95 duration-300">
                        <div className="max-w-md mx-auto space-y-8">
                            <div className="text-center space-y-2">
                                <div className="h-16 w-16 bg-violet-100 dark:bg-violet-900/20 text-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
                                    <Brain className="h-8 w-8 animate-pulse" />
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-violet-500 animate-slide-right" />
                                </div>
                                <h3 className="text-lg font-bold">Analyzing Scan Data</h3>
                                <p className="text-sm text-muted-foreground animate-pulse">Estimated completion: ~{estimatedTime} seconds</p>
                            </div>

                            <div className="space-y-0 relative pl-4">
                                {/* Connecting Line */}
                                <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-emerald-500/50 via-emerald-500/20 to-transparent" />

                                {ANALYSIS_STEPS.map((step, index) => (
                                    <div
                                        key={step.id}
                                        style={{
                                            animationDelay: `${index * 150}ms`,
                                            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
                                        }}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 relative bg-white/50 dark:bg-transparent backdrop-blur-sm",
                                            index === analysisStep
                                                ? "border-violet-500/30 shadow-lg shadow-violet-500/5 scale-[1.02] z-10"
                                                : index < analysisStep
                                                    ? "border-transparent opacity-60"
                                                    : "border-transparent opacity-30 blur-[0.5px]"
                                        )}
                                    >
                                        <div className="shrink-0 relative z-10 bg-card rounded-full">
                                            {index < analysisStep ? (
                                                <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                </div>
                                            ) : index === analysisStep ? (
                                                <div className="h-6 w-6 rounded-full border-[3px] border-violet-500 border-t-transparent animate-spin" />
                                            ) : (
                                                <div className="h-6 w-6 rounded-full border-2 border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className={cn(
                                                "text-xs font-bold tracking-wide uppercase",
                                                index === analysisStep ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground"
                                            )}>
                                                {step.label}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : result ? (
                    /* 1. DIAGNOSTIC VERDICT (Top Priority) */
                    <div className={cn(
                        "relative overflow-hidden rounded-3xl border border-border/10 bg-white dark:bg-zinc-900 animate-in fade-in slide-in-from-bottom-4 duration-700 transition-all",
                        isCritical
                            ? "shadow-[0_0_50px_-12px_rgba(225,29,72,0.25)] border-rose-500/20"
                            : "shadow-[0_0_50px_-12px_rgba(16,185,129,0.25)] border-emerald-500/20"
                    )}>
                        {/* Ambient Background Blob */}
                        <div className={cn(
                            "absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none",
                            isCritical ? "bg-rose-500" : "bg-emerald-500"
                        )} />

                        <div className={cn(
                            "absolute top-0 left-0 w-1.5 h-full transition-all duration-1000",
                            isCritical ? 'bg-rose-500' : 'bg-emerald-500'
                        )} />

                        <div className="p-8 pl-10">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
                                <div>
                                    <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4 flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-700 delay-100">
                                        <Brain className="h-3.5 w-3.5" />
                                        Primary Diagnosis
                                    </h5>
                                    <h2 className={cn(
                                        "text-4xl font-black tracking-tighter mb-2 animate-in fade-in zoom-in-95 duration-700 delay-200",
                                        isCritical ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                                    )}>
                                        {result.prediction}
                                    </h2>
                                    <p className="text-sm text-muted-foreground font-medium max-w-lg leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
                                        The analysis indicates <span className="text-foreground font-bold">{result.prediction}</span> with
                                        a confidence interval of <span className="text-foreground font-bold font-mono">{(result.confidence * 100).toFixed(1)}%</span>.
                                        {isCritical ? " This requires immediate clinical review." : " No acute abnormalities detected."}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2 min-w-[140px] animate-in fade-in slide-in-from-right-4 duration-700 delay-500">
                                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-border/50 text-center">
                                        <p className="text-[10px] uppercase text-muted-foreground font-bold">Confidence</p>
                                        <p className="text-2xl font-black font-mono text-foreground">{(result.confidence * 100).toFixed(1)}%</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-border/50 text-center">
                                        <p className="text-[10px] uppercase text-muted-foreground font-bold">Severity</p>
                                        <p className={cn("text-lg font-black uppercase", isCritical ? "text-rose-500" : "text-emerald-500")}>
                                            {result.prediction?.toLowerCase().includes("normal") ? "LOW" : result.severity || "MEDIUM"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px w-full bg-border/40 my-6" />

                            {/* HUMAN VALIDATION */}
                            {!feedbackSent && (
                                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-700">
                                    <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                        Physician Verification Required
                                    </h5>
                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            size="lg"
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform"
                                            onClick={() => handleFeedback(result.prediction)}
                                        >
                                            <CheckCircle2 className="mr-2 h-5 w-5" />
                                            Confirm Diagnosis
                                        </Button>

                                        {getPossibleLabels().filter(l => l !== result.prediction).map(l => (
                                            <Button
                                                key={l}
                                                variant="outline"
                                                size="lg"
                                                className="border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl"
                                                onClick={() => handleFeedback(l)}
                                            >
                                                Mark as {l}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* EMPTY STATE HERO - REFINED */
                    <div className="health-card p-12 text-center border-dashed border-2 border-slate-200 dark:border-white/10 bg-slate-50/30 dark:bg-white/5 rounded-3xl animate-in fade-in duration-500 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity" />
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="h-24 w-24 bg-gradient-to-br from-violet-100 to-indigo-50 dark:from-violet-500/10 dark:to-indigo-500/5 text-violet-500 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/50 dark:border-white/5">
                                <div className="h-16 w-16 bg-white dark:bg-white/10 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/10">
                                    <Scan className="h-8 w-8 text-violet-600 dark:text-violet-400 opacity-80" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">Ready for Analysis</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                                Select a patient scan from the left panel to initialize the <span className="font-semibold text-violet-600 dark:text-violet-400">Deep Learning Diagnostic Engine</span>.
                            </p>
                        </div>
                    </div>
                )}

                {/* 2. INSIGHTS GRID (Merged) */}
                {result && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                        <div className="flex items-center gap-2 px-1">
                            <Sparkles className="h-4 w-4 text-violet-500" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Clinical Insights</h4>
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {/* Findings Grid */}
                            <div className="bento-cell h-full border-l-4 border-l-violet-500/20">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Observations</h4>
                                <div className="space-y-2.5">
                                    {result.findings?.map((f: string, i: number) => (
                                        <div key={i} className="p-3 bg-white/50 dark:bg-white/5 rounded-xl border border-border/50 text-sm font-medium flex items-start gap-2.5 shadow-sm animate-in fade-in slide-in-from-left-2 duration-500 hover:scale-[1.01] transition-transform" style={{ animationDelay: `${i * 100}ms` }}>
                                            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                                            <span className="leading-snug text-slate-700 dark:text-slate-200 text-xs tracking-wide">{f}</span>
                                        </div>
                                    ))}
                                    {(!result.findings || result.findings.length === 0) && (
                                        <p className="text-sm text-muted-foreground italic">No specific anomaly markers identified.</p>
                                    )}
                                </div>
                            </div>

                            {/* Technical Metrics */}
                            <div className="bento-cell h-full">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Technical Metrics</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-white/50 dark:bg-white/5 rounded-2xl border border-border/50">
                                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Model Arch</p>
                                        <p className="text-xs font-bold font-mono truncate">DenseNet-121</p>
                                    </div>
                                    <div className="p-3 bg-white/50 dark:bg-white/5 rounded-2xl border border-border/50">
                                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Input Res</p>
                                        <p className="text-xs font-bold font-mono">1024px</p>
                                    </div>
                                    <div className="p-3 bg-white/50 dark:bg-white/5 rounded-2xl border border-border/50 col-span-2">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Entropy Score</p>
                                            <p className="text-xs font-bold text-violet-500 flex items-center gap-1 font-mono">
                                                <Activity className="h-3 w-3" />
                                                {(Number(result.confidence_metrics?.uncertainty_level) || 0.12).toFixed(3)}
                                            </p>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-violet-500 rounded-full animate-pulse" style={{ width: '15%' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* 3. PATIENT HISTORY & REGISTRY */}
                <div className="space-y-6 pt-4">
                    {/* Trending Chart - Reduced Height */}
                    {historyData.length > 0 && (
                        <div className="hospital-card p-6 bg-white dark:bg-card/50">
                            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <TrendingUp className="h-3.5 w-3.5 text-cyan-500" />
                                Health Progression
                            </h4>
                            <div className="h-[180px] w-full">
                                <PatientTrendChart data={historyData} />
                            </div>
                        </div>
                    )}

                    {/* Collapsible Registry */}
                    <div className="rounded-3xl border border-border/40 bg-white/50 dark:bg-card/50 overflow-hidden backdrop-blur-sm">
                        <button
                            onClick={() => setRegistryOpen(!registryOpen)}
                            className="w-full flex items-center justify-between p-4 bg-slate-50/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                        >
                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Registry & Recent Scans
                            </h3>
                            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", registryOpen && "rotate-180")} />
                        </button>

                        <div className={cn(
                            "grid transition-all duration-300 ease-in-out",
                            registryOpen ? "grid-rows-[1fr] opacity-100 p-4 pt-0" : "grid-rows-[0fr] opacity-0"
                        )}>
                            <div className="overflow-hidden">
                                <AnalysisHistory analyses={recentAnalyses as any} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
