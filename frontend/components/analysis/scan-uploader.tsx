"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Upload, ImageIcon, Scan, Brain, Activity, CheckCircle2, UploadCloud } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScanType {
    id: string
    name: string
    icon: string
    description: string
}

interface AnalysisStep {
    id: string
    label: string
    duration: number
}

interface ScanUploaderProps {
    file: File | null
    preview: string | null
    isDragging: boolean
    loading: boolean
    result: any
    scanType: string
    isBatch: boolean
    scanTypes: ScanType[]
    analysisStep: number
    analysisSteps: AnalysisStep[]
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onDrop: (e: React.DragEvent) => void
    onDragOver: (e: React.DragEvent) => void
    onDragLeave: () => void
    onScanTypeChange: (type: string) => void
    onAnalyze: () => void
}

export function ScanUploader({
    file,
    preview,
    isDragging,
    loading,
    result,
    scanType,
    isBatch,
    scanTypes,
    analysisStep,
    analysisSteps,
    onFileChange,
    onDrop,
    onDragOver,
    onDragLeave,
    onScanTypeChange,
    onAnalyze,
}: ScanUploaderProps) {
    return (
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6 lg:h-fit z-10 w-full max-w-xl mx-auto">
            {/* 1. Scan Context / Preview */}
            <div className="flex flex-col bg-white dark:bg-slate-950 rounded-[32px] border border-slate-200/60 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.1)] overflow-hidden relative group/card">
                {/* Header */}
                <div className="p-5 flex justify-between items-center bg-transparent">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Scan className={cn("h-4 w-4 text-violet-500", loading && "animate-spin-slow")} />
                        Live Feed
                    </h3>
                    {result && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 tracking-wide">ANALYZED</span>
                        </div>
                    )}
                </div>

                {/* Main Interaction Area */}
                <div
                    className={cn(
                        "relative group cursor-pointer bg-black/5 dark:bg-black/40 min-h-[280px] sm:min-h-[340px] lg:min-h-[400px] flex flex-col transition-all duration-500 overflow-hidden",
                        isDragging && "bg-violet-500/10 ring-2 ring-inset ring-violet-500/50"
                    )}
                    onClick={() => document.getElementById('file-upload')?.click()}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                >
                    {/* Technical Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none" />

                    {/* Hidden Input */}
                    <input type="file" id="file-upload" className="hidden" onChange={onFileChange} accept="image/*,.zip,.dcm,.nii" />

                    {/* Image Display or Upload Prompts */}
                    {preview || result?.image_url || result?.file_url ? (
                        <div className="flex-1 relative flex items-center justify-center bg-slate-400/20 dark:bg-slate-800/50 overflow-hidden p-6 rounded-[24px] m-2">
                            <img
                                src={result?.image_url || result?.file_url || preview}
                                className={cn(
                                    "w-full h-full object-contain max-h-[260px] sm:max-h-[320px] lg:max-h-[380px] transition-all duration-700 mix-blend-multiply dark:mix-blend-normal",
                                    loading ? "opacity-60 scale-[1.02] blur-[2px] saturate-0" : "opacity-100 scale-100"
                                )}
                                alt="Scan"
                            />

                            {/* Crisp Rounded Corner Accents */}
                            <div className="absolute top-4 left-4 w-8 h-8 border-t-[3px] border-l-[3px] border-slate-300 dark:border-slate-600 rounded-tl-[20px]" />
                            <div className="absolute top-4 right-4 w-8 h-8 border-t-[3px] border-r-[3px] border-slate-300 dark:border-slate-600 rounded-tr-[20px]" />
                            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-[3px] border-l-[3px] border-slate-300 dark:border-slate-600 rounded-bl-[20px]" />
                            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-[3px] border-r-[3px] border-slate-300 dark:border-slate-600 rounded-br-[20px]" />

                            {/* SCAN SWEEP EFFECT - DUAL LAYER */}
                            {loading && (
                                <>
                                    <div className="absolute inset-x-0 top-0 h-[2px] bg-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.6)] animate-scan z-20" />
                                    <div className="absolute inset-0 z-10 bg-gradient-to-b from-violet-500/10 to-transparent animate-pulse pointer-events-none" />
                                </>
                            )}

                            {/* Hover Overlay */}
                            {!loading && (
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white gap-3 backdrop-blur-sm rounded-[24px]">
                                    <div className="p-3 bg-white/10 rounded-full border border-white/20">
                                        <Upload className="h-6 w-6 text-white" />
                                    </div>
                                    <span className="text-xs font-medium tracking-wide">Replace Scan</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Drop Zone - Minimalist Style */
                        <div
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            className={cn(
                                "relative flex-1 min-h-[300px] flex flex-col items-center justify-center rounded-3xl transition-all duration-300 overflow-hidden group",
                                isDragging
                                    ? "bg-violet-50 dark:bg-violet-900/10 scale-[1.01]"
                                    : "bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-100/50 dark:hover:bg-slate-900/40"
                            )}
                        >
                            {/* Subtle dotted background grid (optional, but very light) */}
                            <div className="absolute inset-0 z-0 opacity-[0.05] dark:opacity-[0.1]" style={{ backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`, backgroundSize: '32px 32px' }}></div>

                            {/* Crisp Corner Accents */}
                            <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-slate-200 dark:border-slate-800 rounded-tl-[24px] transition-colors group-hover:border-violet-200 dark:group-hover:border-violet-800" />
                            <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-slate-200 dark:border-slate-800 rounded-tr-[24px] transition-colors group-hover:border-violet-200 dark:group-hover:border-violet-800" />
                            <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-slate-200 dark:border-slate-800 rounded-bl-[24px] transition-colors group-hover:border-violet-200 dark:group-hover:border-violet-800" />
                            <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-slate-200 dark:border-slate-800 rounded-br-[24px] transition-colors group-hover:border-violet-200 dark:group-hover:border-violet-800" />

                            <div className="bg-white dark:bg-slate-950 p-6 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] mb-8 group-hover:scale-105 transition-transform duration-300 relative z-10 border border-slate-100 dark:border-slate-800">
                                <UploadCloud className={cn("w-10 h-10 transition-colors", isDragging ? "text-violet-500" : "text-slate-400 dark:text-slate-500")} strokeWidth={1.5} />
                            </div>

                            <div className="text-center relative z-10">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Upload Medical Imaging</h3>
                                <p className="text-[11px] font-mono text-slate-500 tracking-[0.2em] mt-3">DICOM • JPEG • PNG • NIFTI</p>
                            </div>

                        </div>
                    )}

                    {/* Analysis Trigger - Floating Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 z-20">
                        <Button
                            className={cn(
                                "w-full h-[60px] rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] transition-all duration-500 overflow-hidden relative group/btn",
                                loading
                                    ? "bg-slate-900/90 dark:bg-slate-950/90 text-slate-500 dark:text-slate-600 cursor-wait border border-slate-800"
                                    : "bg-white/95 dark:bg-slate-900/95 hover:bg-white dark:hover:bg-slate-900 text-slate-900 dark:text-white backdrop-blur-xl border border-slate-100 dark:border-slate-800"
                            )}
                            disabled={!file || loading}
                            onClick={(e) => { e.stopPropagation(); onAnalyze() }}
                        >
                            {/* Animated Background Gradient (Subtle) */}
                            {!loading && <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-fuchsia-500/5 to-violet-500/5 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-700 pointer-events-none" />}

                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
                                    </span>
                                    <span className="text-xs font-bold uppercase tracking-[0.15em] animate-pulse text-white">
                                        {analysisSteps[analysisStep]?.label || "Initializing..."}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-3 relative z-10">
                                    <Brain className="h-5 w-5 text-violet-500 transition-transform group-hover/btn:scale-110 duration-300" strokeWidth={2} />
                                    <span className="text-[13px] font-bold uppercase tracking-[0.15em] text-slate-900 dark:text-slate-100">Run Diagnostics</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* 2. Metadata Grid - Premium Stat Pills */}
            <div className={cn(
                "grid grid-cols-2 gap-4 transition-opacity duration-500",
                loading ? "opacity-50 pointer-events-none" : "opacity-100"
            )}>
                {/* Modality Selector */}
                <div className="col-span-2 bg-white dark:bg-slate-950 rounded-[28px] border border-slate-200/60 dark:border-slate-800/60 p-3 shadow-sm">
                    <div className="flex bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-[20px] border border-slate-100 dark:border-slate-800">
                        {scanTypes.map(type => (
                            <button
                                key={type.id}
                                disabled={loading}
                                onClick={() => onScanTypeChange(type.id)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[16px] text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
                                    scanType === type.id
                                        ? "bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] scale-[1.02]"
                                        : "text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200"
                                )}
                            >
                                <span>{type.icon}</span>
                                <span className="hidden sm:inline">{type.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* File Info */}
                {file && (
                    <div className="col-span-2 flex gap-4">
                        <div className="flex-1 bg-white dark:bg-slate-950 rounded-[28px] border border-slate-200/60 dark:border-slate-800/60 p-4 flex items-center gap-4 shadow-sm">
                            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl">
                                <ImageIcon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-1">File Format</p>
                                <p className="text-sm font-bold truncate text-slate-900 dark:text-slate-100">{file.name.split('.').pop()?.toUpperCase()}</p>
                            </div>
                        </div>
                        <div className="flex-1 bg-white dark:bg-slate-950 rounded-[28px] border border-slate-200/60 dark:border-slate-800/60 p-4 flex items-center gap-4 shadow-sm">
                            <div className="p-3 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-2xl">
                                <Activity className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-1">Size</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. System Status */}
            <div className="bg-slate-50 dark:bg-slate-950/50 rounded-[28px] border border-slate-200/60 dark:border-slate-800/60 p-5 space-y-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-amber-500" />
                    System Telemetry
                </h4>
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">Neural Engine</span>
                        <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                            <span className="relative flex h-2 w-2">
                                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-80", loading && "duration-1000")} />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            Online
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">Inference Latency</span>
                        <span className="font-bold font-mono text-slate-900 dark:text-slate-100">{loading ? <span className="animate-pulse">Measuring...</span> : (result?.processing_time || 0.8).toFixed(3) + 's'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">GPU Load</span>
                        <span className="font-bold font-mono text-slate-900 dark:text-slate-100 animate-in fade-in duration-1000">{loading ? 89 : 72}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mt-1">
                        <div
                            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: loading ? '89%' : '72%', transform: 'translateX(0)', animation: 'slideRight 1s ease-out' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
