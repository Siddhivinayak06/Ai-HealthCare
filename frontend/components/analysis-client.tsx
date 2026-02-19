"use client"

import { useState, useEffect } from "react"
import { Scan } from "lucide-react"
import { cn } from "@/lib/utils"
import { saveImageAnalysis, getLatestScanForPatient, getHistoricalTrendsForPatient, submitFeedback } from "@/app/actions/analyses"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { getPatients } from "@/app/actions/patients"

// Sub-components
import { ScanUploader } from "@/components/analysis/scan-uploader"
import { AnalysisProgress } from "@/components/analysis/analysis-progress"
import { DiagnosisVerdict } from "@/components/analysis/diagnosis-verdict"
import { ClinicalInsights } from "@/components/analysis/clinical-insights"
import { PatientRegistry } from "@/components/analysis/patient-registry"

interface AnalysisClientProps {
    userRole: string
    recentAnalyses?: any[]
}

const SCAN_TYPES = [
    { id: "xray", name: "X-Ray", icon: "🩻", description: "Chest & bone imaging" },
    { id: "ct", name: "CT Scan", icon: "🔬", description: "Cross-sectional imaging" },
    { id: "mri", name: "MRI", icon: "🧲", description: "Magnetic resonance imaging" },
]

const ANALYSIS_STEPS = [
    { id: 'norm', label: 'Image Normalization & Preprocessing', duration: 800 },
    { id: 'feat', label: 'Deep Feature Extraction', duration: 1200 },
    { id: 'infer', label: 'Model Inference & Anomaly Detection', duration: 1500 },
    { id: 'risk', label: 'Risk Scoring & Confidence Calibration', duration: 800 }
]

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
    const [isSavedToDb, setIsSavedToDb] = useState(false)
    const router = useRouter()

    const [feedbackSent, setFeedbackSent] = useState(false)
    const [retraining, setRetraining] = useState(false)
    const [showRetrainConfirm, setShowRetrainConfirm] = useState(false)

    const [analysisStep, setAnalysisStep] = useState(0)
    const [estimatedTime, setEstimatedTime] = useState(4)
    const [registryOpen, setRegistryOpen] = useState(false)

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

    // ==================== Event Handlers ====================

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
                modelVersion: result?.model_info?.architecture || "Unknown"
            }

            const response = await saveImageAnalysis(apiData)
            if (!response.success) throw new Error(response.error)
            setIsSavedToDb(true)
            setSaveMessage("Saved to patient record!")
            handlePatientChange(selectedPatientId)
            router.refresh()
        } catch (error: any) {
            setSaveMessage(error.message || "Failed to save.")
        } finally {
            setSaving(false)
        }
    }

    const handleFeedback = async (correctLabel: string) => {
        const entityId = result?.id || result?.image_url || `analysis-${Date.now()}`

        // Immediately update UI
        setFeedbackSent(true)
        toast.success(correctLabel === result?.prediction
            ? "Diagnosis confirmed by physician"
            : `Diagnosis overridden to: ${correctLabel}`)

        // Fire-and-forget: send feedback to ML backend (non-blocking)
        try {
            await fetch("/api/predict/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image_id: entityId,
                    scan_type: (result?.scan_type || scanType).toLowerCase().includes("x-ray") ? "xray" :
                        (result?.scan_type || scanType).toLowerCase().includes("ct") ? "ct" : "mri",
                    correct_label: correctLabel
                })
            })
        } catch (e) {
            console.warn("ML feedback failed (non-critical):", e)
        }

        // Fire-and-forget: log to audit DB (non-blocking)
        try {
            await submitFeedback({
                entityId: entityId,
                entityType: "IMAGE_ANALYSIS",
                action: correctLabel === result.prediction ? "APPROVE" : "OVERRIDE",
                feedback: `Clinician corrected AI prediction from ${result.prediction} to ${correctLabel}`,
                findings: result.findings,
                confidenceScore: result.confidence * 100
            })
        } catch (e) {
            console.warn("Audit log failed (non-critical):", e)
        }
    }

    const handleAnalyze = async () => {
        if (!file) {
            toast.error("Please select an image first")
            return
        }

        setLoading(true)
        setResult(null)
        setAnalysisStep(0)

        setEstimatedTime(4)
        const STEP_TIMINGS = [0, 600, 1400, 2200]

        STEP_TIMINGS.forEach((delay, index) => {
            setTimeout(() => {
                if (loading) setAnalysisStep(index)
            }, delay)
        })

        const countInterval = setInterval(() => {
            setEstimatedTime((prev: number) => Math.max(0, prev - 1))
        }, 1000)

        const stepInterval = setInterval(() => { }, 3000)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('scan_type', scanType)
        if (selectedPatientId) formData.append('patientId', selectedPatientId)

        try {
            const response = await fetch('/api/predict/image', {
                method: 'POST',
                body: formData
            })

            clearInterval(stepInterval)
            clearInterval(countInterval)

            setAnalysisStep(ANALYSIS_STEPS.length - 1)
            await new Promise(r => setTimeout(r, 600))

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Analysis failed')
            }

            const data = await response.json()
            setResult(data)

            if (data) {
                await saveAnalysisToHistory(data)
            }

        } catch (error) {
            console.error("Analysis error:", error)
            toast.error(error instanceof Error ? error.message : "Failed to analyze image")
        } finally {
            setLoading(false)
            setRegistryOpen(false)
        }
    }

    const saveAnalysisToHistory = async (data: any) => {
        if (!selectedPatientId) return

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
                modelVersion: result?.model_info?.architecture || "Unknown"
            }

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

    const getPossibleLabels = () => {
        if (scanType === 'xray') return ["Normal", "Pneumonia"]
        if (scanType === 'ct') return ["Normal", "Tumor"]
        return ["Normal", "Brain_Tumor"]
    }

    const isPatient = userRole === 'patient' || userRole === 'user'

    const isCritical =
        result?.prediction?.toLowerCase().includes("malignant") ||
        result?.prediction?.toLowerCase().includes("pneumonia") ||
        result?.prediction?.toLowerCase().includes("tumor") ||
        result?.severity?.toLowerCase() === "high" ||
        result?.severity?.toLowerCase() === "critical"

    // ==================== Render ====================

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full relative">

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
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-float-slow {
                    animation: float-slow 4s ease-in-out infinite;
                }
                @media (max-width: 1023px) {
                    .lg\:sticky { position: relative !important; top: auto !important; }
                }
            `}</style>

            {/* LEFT COLUMN */}
            <ScanUploader
                file={file}
                preview={preview}
                isDragging={isDragging}
                loading={loading}
                result={result}
                scanType={scanType}
                isBatch={isBatch}
                scanTypes={SCAN_TYPES}
                analysisStep={analysisStep}
                analysisSteps={ANALYSIS_STEPS}
                onFileChange={handleFileChange}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onScanTypeChange={setScanType}
                onAnalyze={handleAnalyze}
            />

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-8 space-y-6 pb-24">

                {/* Loading / Result / Empty */}
                {loading ? (
                    <AnalysisProgress
                        analysisStep={analysisStep}
                        estimatedTime={estimatedTime}
                        analysisSteps={ANALYSIS_STEPS}
                    />
                ) : result ? (
                    <DiagnosisVerdict
                        result={result}
                        isCritical={isCritical}
                        feedbackSent={feedbackSent}
                        possibleLabels={getPossibleLabels()}
                        onFeedback={handleFeedback}
                    />
                ) : (
                    /* EMPTY STATE HERO - HOLOGRAPHIC STYLE */
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-12 text-center min-h-[400px] flex flex-col items-center justify-center group">

                        {/* Animated Background Grid */}
                        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05]" />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                        <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
                            {/* Holographic Icon Container */}
                            <div className="relative h-32 w-32 mb-8 animate-float-slow">
                                <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-2xl animate-pulse" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="relative h-24 w-24 rounded-2xl bg-gradient-to-tr from-violet-500/20 to-cyan-500/20 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl">
                                        <Scan className="h-10 w-10 text-white/80" />
                                        {/* Spinning Ring */}
                                        <div className="absolute inset-0 border border-white/20 rounded-2xl animate-[spin_8s_linear_infinite]" />
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 mb-4 tracking-tight">
                                Awaiting Medical Scan
                            </h3>
                            <p className="text-muted-foreground/80 leading-relaxed mb-8">
                                Upload a patient X-ray, CT, or MRI scan to initialize the <span className="text-violet-400 font-medium">Neural Diagnostic Engine</span>.
                            </p>

                            {/* Decorative Tech Lines */}
                            <div className="flex items-center gap-4 opacity-30">
                                <div className="h-px w-12 bg-gradient-to-r from-transparent to-white" />
                                <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                <div className="h-px w-12 bg-gradient-to-l from-transparent to-white" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Clinical Insights */}
                {result && <ClinicalInsights result={result} />}

                {/* Patient History & Registry */}
                <PatientRegistry
                    historyData={historyData}
                    registryOpen={registryOpen}
                    onToggleRegistry={() => setRegistryOpen(!registryOpen)}
                    recentAnalyses={recentAnalyses}
                />
            </div>
        </div>
    )
}
