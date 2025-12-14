"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, X, Scan, AlertTriangle, CheckCircle2, ImageIcon, Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PredictionResult {
    prediction: string
    confidence: number
    details: string
}

export function ImageDiagnostics() {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<PredictionResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const clearFile = () => {
        setFile(null)
        setPreview(null)
        setResult(null)
        setError(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const resizeImage = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.src = URL.createObjectURL(file)
            img.onload = () => {
                const canvas = document.createElement("canvas")
                let width = img.width
                let height = img.height
                const maxDim = 800 // Safe upper bound for model (224px input)

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width)
                        width = maxDim
                    } else {
                        width = Math.round((width * maxDim) / height)
                        height = maxDim
                    }
                }

                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext("2d")
                if (!ctx) {
                    reject(new Error("Failed to get canvas context"))
                    return
                }
                ctx.drawImage(img, 0, 0, width, height)

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob)
                        } else {
                            reject(new Error("Canvas to Blob failed"))
                        }
                    },
                    "image/jpeg",
                    0.85
                )
            }
            img.onerror = (err) => reject(err)
        })
    }

    const handleAnalyze = async () => {
        if (!file) return

        setLoading(true)
        setError(null)

        try {
            // Resize image before upload to speed up transmission
            // Model only uses 224x224, so sending 4k images is wasteful/slow
            const resizedBlob = await resizeImage(file)

            const formData = new FormData()
            formData.append("file", resizedBlob, file.name)
            // Add scan type if you have a selector, generic fallback for now
            formData.append("scan_type", "xray")

            const response = await fetch("/api/predict/image", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}))
                // Handle the 503 Service Unavailable specifically
                if (response.status === 503) {
                    throw new Error(errData.details || "Service is waking up. Please try again in a moment.")
                }
                throw new Error("Analysis failed")
            }

            const data = await response.json()
            setResult(data)
        } catch (err: any) {
            console.error(err)
            setError(err.message || "Failed to analyze image. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="relative overflow-hidden border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-2xl shadow-2xl h-full flex flex-col">
            {/* Decorative gradient orbs */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-gradient-to-br from-cyan-500/30 to-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-gradient-to-br from-teal-500/20 to-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <CardHeader className="relative z-10 pb-3">
                <CardTitle className="text-xl font-bold flex items-center gap-3 text-white">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/25">
                        <Scan className="h-5 w-5 text-white" />
                    </div>
                    AI Image Diagnostics
                    <Badge variant="outline" className="ml-auto border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-medium">
                        <Sparkles className="h-3 w-3 mr-1" />
                        DenseNet
                    </Badge>
                </CardTitle>
                <CardDescription className="text-slate-400">
                    Upload X-rays or scans for AI-powered condition detection
                </CardDescription>
            </CardHeader>

            <CardContent className="relative z-10 flex-1 space-y-4">
                {!preview ? (
                    <div
                        className={cn(
                            "relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 text-center cursor-pointer min-h-[280px] transition-all duration-300",
                            isDragging
                                ? "border-cyan-500 bg-cyan-500/10 scale-[1.02]"
                                : "border-slate-600 hover:border-cyan-500/50 hover:bg-white/5"
                        )}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                    >
                        {/* Animated background glow */}
                        <div className={cn(
                            "absolute inset-0 rounded-2xl transition-opacity duration-300",
                            isDragging ? "opacity-100" : "opacity-0"
                        )}>
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 animate-pulse rounded-2xl" />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-xl opacity-30 animate-pulse" />
                            <div className="relative p-5 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20">
                                <Upload className={cn(
                                    "h-8 w-8 transition-colors",
                                    isDragging ? "text-cyan-400" : "text-slate-400"
                                )} />
                            </div>
                        </div>
                        <div className="space-y-1 relative z-10">
                            <p className="font-semibold text-white">
                                {isDragging ? "Drop your image here" : "Click or drag image to upload"}
                            </p>
                            <p className="text-sm text-slate-500">Supports JPG, PNG • Max 10MB</p>
                        </div>
                    </div>
                ) : (
                    <div className="relative group rounded-2xl overflow-hidden border border-white/10 min-h-[280px] bg-black/20 flex items-center justify-center">
                        {/* Image with subtle shadow */}
                        <img
                            src={preview}
                            alt="Preview"
                            className="max-h-[280px] w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                        />

                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Clear button */}
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-3 right-3 h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 bg-rose-500 hover:bg-rose-600 border-0 shadow-lg"
                            onClick={(e) => {
                                e.stopPropagation()
                                clearFile()
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>

                        {/* File info */}
                        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="flex items-center gap-2 text-xs text-white/80 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2">
                                <ImageIcon className="h-3.5 w-3.5" />
                                <span className="truncate">{file?.name}</span>
                            </div>
                        </div>
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                />

                {error && (
                    <div className="flex items-center gap-3 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl animate-in shake duration-300">
                        <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
                        {error}
                    </div>
                )}

                {result && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className={cn(
                            "p-5 rounded-xl border space-y-4 transition-all",
                            result.prediction === "Normal"
                                ? "bg-emerald-500/10 border-emerald-500/20"
                                : "bg-rose-500/10 border-rose-500/20"
                        )}>
                            {/* Prediction Header */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Diagnosis Result</span>
                                <Badge
                                    className={cn(
                                        "px-3 py-1 text-sm font-semibold border-0 shadow-lg",
                                        result.prediction === "Normal"
                                            ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-500/30"
                                            : "bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-rose-500/30"
                                    )}
                                >
                                    {result.prediction === "Normal" && <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
                                    {result.prediction !== "Normal" && <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />}
                                    {result.prediction}
                                </Badge>
                            </div>

                            {/* Confidence Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">AI Confidence</span>
                                    <span className={cn(
                                        "font-bold tabular-nums",
                                        result.prediction === "Normal" ? "text-emerald-400" : "text-rose-400"
                                    )}>
                                        {(result.confidence * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-1000 ease-out",
                                            result.prediction === "Normal"
                                                ? "bg-gradient-to-r from-emerald-500 to-green-400"
                                                : "bg-gradient-to-r from-rose-500 to-red-400"
                                        )}
                                        style={{ width: `${result.confidence * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Details */}
                            <div className="pt-3 border-t border-white/5 flex items-center gap-2 text-sm text-slate-400">
                                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                                {result.details}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="relative z-10 pt-0">
                <Button
                    className={cn(
                        "w-full h-12 text-base font-semibold transition-all duration-300",
                        file && !loading
                            ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-0 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02]"
                            : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    )}
                    disabled={!file || loading}
                    onClick={handleAnalyze}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Analyzing Image...
                        </>
                    ) : (
                        <>
                            <Scan className="mr-2 h-5 w-5" />
                            Analyze with AI
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    )
}
