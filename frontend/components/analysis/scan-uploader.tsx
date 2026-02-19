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
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6 lg:h-fit z-10">
            {/* 1. Scan Context / Preview */}
            <div className="hospital-card flex flex-col shadow-lg border-white/20 overflow-hidden relative group/card">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <Scan className={cn("h-3.5 w-3.5 text-violet-500", loading && "animate-spin-slow")} />
                        Live Feed
                    </h3>
                    {result && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-[9px] font-bold text-emerald-500 tracking-wide">ANALYZED</span>
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
                    <input type="file" id="file-upload" className="hidden" onChange={onFileChange} accept="image/*,.zip" />

                    {/* Image Display or Upload Prompts */}
                    {preview || result?.image_url || result?.file_url ? (
                        <div className="flex-1 relative flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-hidden p-6">
                            <img
                                src={result?.image_url || result?.file_url || preview}
                                className={cn(
                                    "w-full h-full object-contain max-h-[260px] sm:max-h-[320px] lg:max-h-[380px] transition-all duration-700 filter drop-shadow-2xl",
                                    loading ? "opacity-60 scale-[1.02] blur-[2px] saturate-0" : "opacity-100 scale-100"
                                )}
                                alt="Scan"
                            />

                            {/* Corner Accents */}
                            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/30 rounded-tl-lg" />
                            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-white/30 rounded-tr-lg" />
                            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-white/30 rounded-bl-lg" />
                            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white/30 rounded-br-lg" />

                            {/* SCAN SWEEP EFFECT - DUAL LAYER */}
                            {loading && (
                                <>
                                    <div className="absolute inset-x-0 top-0 h-[2px] bg-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.6)] animate-scan z-20" />
                                    <div className="absolute inset-0 z-10 bg-gradient-to-b from-violet-500/10 to-transparent animate-pulse pointer-events-none" />
                                </>
                            )}

                            {/* Hover Overlay */}
                            {!loading && (
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white gap-3 backdrop-blur-sm">
                                    <div className="p-3 bg-white/10 rounded-full border border-white/20">
                                        <Upload className="h-6 w-6 text-white" />
                                    </div>
                                    <span className="text-xs font-medium tracking-wide">Replace Scan</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Drop Zone - Technical Instrument Style */
                        <div
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            className={cn(
                                "relative flex-1 min-h-[300px] flex flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden group",
                                isDragging
                                    ? "border-violet-500 bg-violet-500/10 scale-[1.01] shadow-[0_0_30px_rgba(139,92,246,0.2)]"
                                    : "border-slate-200/50 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 hover:border-violet-500/50 hover:bg-violet-500/5"
                            )}
                        >
                            {/* Technical Grid Background */}
                            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                                style={{ backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`, backgroundSize: '20px 20px' }}>
                            </div>

                            {/* Corner Brackets (Viewfinder) */}
                            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-slate-300 dark:border-white/20 rounded-tl-lg transition-colors group-hover:border-violet-500/50" />
                            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-slate-300 dark:border-white/20 rounded-tr-lg transition-colors group-hover:border-violet-500/50" />
                            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-slate-300 dark:border-white/20 rounded-bl-lg transition-colors group-hover:border-violet-500/50" />
                            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-slate-300 dark:border-white/20 rounded-br-lg transition-colors group-hover:border-violet-500/50" />

                            {/* Central Crosshair */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none">
                                <div className="w-[1px] h-full bg-violet-500" />
                                <div className="absolute w-full h-[1px] bg-violet-500" />
                            </div>

                            <div className="bg-white dark:bg-white/10 p-6 rounded-full shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300 relative z-10">
                                <UploadCloud className={cn("w-10 h-10 transition-colors", isDragging ? "text-violet-500" : "text-slate-400 dark:text-white/60")} />
                            </div>

                            <div className="text-center relative z-10">
                                <h3 className="text-lg font-bold text-foreground">Upload Medical Imaging</h3>
                                <p className="text-xs font-mono text-muted-foreground mt-2 uppercase tracking-wider">DICOM • JPEG • PNG • NIFTI</p>
                            </div>

                            <label className="absolute inset-0 cursor-pointer z-20">
                                <input
                                    type="file"
                                    accept="image/*,.zip,.dcm,.nii"
                                    onChange={onFileChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    )}

                    {/* Analysis Trigger - Floating Overlay */}
                    <div className="absolute bottom-6 left-6 right-6 z-20">
                        <Button
                            className={cn(
                                "w-full h-12 rounded-xl shadow-xl transition-all duration-500 border border-white/10 overflow-hidden relative group/btn",
                                loading
                                    ? "bg-zinc-900/90 text-zinc-500 cursor-wait border-zinc-800"
                                    : "bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl border-white/20"
                            )}
                            disabled={!file || loading}
                            onClick={(e) => { e.stopPropagation(); onAnalyze() }}
                        >
                            {/* Animated Background Gradient */}
                            {!loading && <div className="absolute inset-0 bg-gradient-to-r from-violet-600/50 via-fuchsia-600/50 to-violet-600/50 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 pointer-events-none" />}

                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] animate-pulse">
                                        {analysisSteps[analysisStep]?.label || "Initializing..."}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 relative z-10">
                                    <Brain className="h-4 w-4 text-violet-300 group-hover/btn:text-white transition-colors" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Run Diagnostics</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* 2. Metadata Grid - Premium Stat Pills */}
            <div className={cn(
                "grid grid-cols-2 gap-3 transition-opacity duration-500",
                loading ? "opacity-50 pointer-events-none" : "opacity-100"
            )}>
                {/* Modality Selector */}
                <div className="col-span-2 hospital-card p-4">
                    <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                        {scanTypes.map(type => (
                            <button
                                key={type.id}
                                disabled={loading}
                                onClick={() => onScanTypeChange(type.id)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
                                    scanType === type.id
                                        ? "bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm scale-[1.02]"
                                        : "text-muted-foreground hover:bg-white/50 dark:hover:bg-white/5"
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
                    <div className="col-span-2 flex gap-3">
                        <div className="flex-1 hospital-card p-3 flex items-center gap-3 bg-blue-500/5 border-blue-500/10">
                            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                <ImageIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">File Format</p>
                                <p className="text-xs font-bold truncate">{file.name.split('.').pop()?.toUpperCase()}</p>
                            </div>
                        </div>
                        <div className="flex-1 hospital-card p-3 flex items-center gap-3 bg-violet-500/5 border-violet-500/10">
                            <div className="p-2 bg-violet-500/10 text-violet-500 rounded-lg">
                                <Activity className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Size</p>
                                <p className="text-xs font-bold">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. System Status */}
            <div className="hospital-card p-4 space-y-3 shadow-sm border-white/10 bg-white/5 backdrop-blur-sm">
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
                        <span className="font-bold font-mono text-foreground">{loading ? <span className="animate-pulse">Measuring...</span> : (result?.processing_time || 0.8).toFixed(3) + 's'}</span>
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
    )
}
