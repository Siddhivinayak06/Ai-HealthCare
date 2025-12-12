"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UploadIcon, XIcon, SparklesIcon, LoaderIcon } from "@/components/icons"
import { cn } from "@/lib/utils"
import { BentoCard } from "./bento-card"
import type { Patient } from "@/lib/db"

interface UploadedImage {
  id: string
  file: File
  preview: string
  type: string
}

interface ImageUploadProps {
  onAnalyze: (images: UploadedImage[], scanType: string, patientId?: string) => void
  isAnalyzing: boolean
  patients?: Patient[]
}

export function ImageUpload({ onAnalyze, isAnalyzing, patients = [] }: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [scanType, setScanType] = useState<string>("chest-xray")
  const [patientId, setPatientId] = useState<string>("none")
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"))
    addFiles(files)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      addFiles(files)
    }
  }

  const addFiles = (files: File[]) => {
    const newImages = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      type: file.type,
    }))
    setImages((prev) => [...prev, ...newImages])
  }

  const removeImage = (id: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === id)
      if (image) {
        URL.revokeObjectURL(image.preview)
      }
      return prev.filter((img) => img.id !== id)
    })
  }

  const handleAnalyze = () => {
    if (images.length > 0 && scanType) {
      onAnalyze(images, scanType, patientId === "none" ? undefined : patientId)
    }
  }

  return (
    <BentoCard size="lg">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-card-foreground">Upload Medical Images</h3>
        <p className="text-sm text-muted-foreground mt-1">AI-powered analysis for X-rays, MRIs, CT scans</p>
      </div>

      {/* Scan Type Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-card-foreground">Scan Type</label>
          <Select value={scanType} onValueChange={setScanType}>
            <SelectTrigger className="bg-secondary/50 border-border/50 h-11">
              <SelectValue placeholder="Select scan type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chest-xray">Chest X-Ray</SelectItem>
              <SelectItem value="brain-mri">Brain MRI</SelectItem>
              <SelectItem value="ct-scan">CT Scan</SelectItem>
              <SelectItem value="mammogram">Mammogram</SelectItem>
              <SelectItem value="spine-xray">Spine X-Ray</SelectItem>
              <SelectItem value="bone-scan">Bone Scan</SelectItem>
              <SelectItem value="ultrasound">Ultrasound</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-card-foreground">Link to Patient</label>
          <Select value={patientId} onValueChange={setPatientId}>
            <SelectTrigger className="bg-secondary/50 border-border/50 h-11">
              <SelectValue placeholder="Select patient (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No patient selected</SelectItem>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Drop Zone - enhanced with Bento styling */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300",
          isDragOver
            ? "border-primary bg-primary/5 scale-[1.01] shadow-lg shadow-primary/10"
            : "border-border/50 hover:border-primary/40 hover:bg-secondary/30",
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileInput}
        />
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-4 ring-primary/5">
              <UploadIcon className="h-8 w-8 text-primary" />
            </div>
            {isDragOver && <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl animate-pulse" />}
          </div>
          <div>
            <p className="font-semibold text-card-foreground text-lg">Drop medical images here</p>
            <p className="text-sm text-muted-foreground mt-1">or click to browse from your device</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded-md bg-secondary/50">DICOM</span>
            <span className="px-2 py-1 rounded-md bg-secondary/50">PNG</span>
            <span className="px-2 py-1 rounded-md bg-secondary/50">JPEG</span>
          </div>
        </div>
      </div>

      {/* Uploaded Images Preview */}
      {images.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-sm font-semibold text-card-foreground">{images.length} image(s) selected</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative group aspect-square rounded-xl overflow-hidden bg-secondary ring-1 ring-border/30"
              >
                <img
                  src={image.preview || "/placeholder.svg"}
                  alt="Medical scan preview"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/90 text-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:bg-destructive hover:text-destructive-foreground"
                >
                  <XIcon className="h-4 w-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-xs text-white truncate font-medium">{image.file.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analyze Button */}
      <Button
        className="w-full mt-6 h-12 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 font-semibold text-base transition-all duration-200"
        disabled={images.length === 0 || !scanType || isAnalyzing}
        onClick={handleAnalyze}
      >
        {isAnalyzing ? (
          <>
            <LoaderIcon className="h-5 w-5 animate-spin" />
            Analyzing with AI...
          </>
        ) : (
          <>
            <SparklesIcon className="h-5 w-5" />
            Analyze with AI
          </>
        )}
      </Button>
    </BentoCard>
  )
}
