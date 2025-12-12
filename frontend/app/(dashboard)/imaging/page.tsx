"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { ImageUpload } from "@/components/image-upload"
import { AnalysisResults, type AnalysisResult } from "@/components/analysis-results"
import { AnalysisHistory } from "@/components/analysis-history"
import { saveImageAnalysis, getRecentAnalyses } from "@/app/actions/analyses"
import { getPatients } from "@/app/actions/patients"
import type { Patient } from "@/lib/db"

export default function ImagingPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisResult[]>([])

  useEffect(() => {
    async function loadData() {
      const [patientsData, analysesData] = await Promise.all([getPatients(), getRecentAnalyses(10)])

      setPatients(patientsData)
      setRecentAnalyses(
        analysesData.map((a) => ({
          id: a.id,
          imageUrl: a.image_url || "/medical-scan-abstract.png",
          scanType: a.scan_type,
          diagnosis: a.diagnosis || "",
          confidence: a.confidence || 0,
          severity: (a.severity as "normal" | "low" | "moderate" | "high") || "normal",
          findings: (a.findings as AnalysisResult["findings"]) || [],
          recommendations: a.recommendations || [],
          processingTime: a.processing_time || 0,
          modelVersion: a.model_version || "MedAI v3.2.1",
          patientName: (a as { first_name?: string; last_name?: string }).first_name
            ? `${(a as { first_name?: string }).first_name} ${(a as { last_name?: string }).last_name}`
            : undefined,
          createdAt: a.created_at,
        })),
      )
    }
    loadData()
  }, [])

  const handleAnalyze = async (
    images: Array<{ preview: string; file: File }>,
    scanType: string,
    patientId?: string,
  ) => {
    setIsAnalyzing(true)

    const scanTypeNames: Record<string, string> = {
      "chest-xray": "Chest X-Ray",
      "brain-mri": "Brain MRI",
      "ct-scan": "CT Scan",
      mammogram: "Mammogram",
      "spine-xray": "Spine X-Ray",
      "bone-scan": "Bone Scan",
      ultrasound: "Ultrasound",
    }

    const scanTypeName = scanTypeNames[scanType] || scanType
    const newResults: AnalysisResult[] = []

    for (const img of images) {
      // Create FormData to send the file
      const formData = new FormData()
      formData.append("file", img.file)

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
        const res = await fetch(`${apiUrl}/predict/image`, {
          method: "POST",
          body: formData,
        })

        if (res.ok) {
          const data = await res.json()

          // Map API response to AnalysisResult
          // Assuming API returns { prediction: string, confidence: number }
          const severityMap = (pred: string) => {
            if (pred.includes("Normal")) return "normal"
            if (pred.includes("Pneumonia")) return "high"
            return "moderate"
          }

          const result: AnalysisResult = {
            id: `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            imageUrl: img.preview,
            scanType: scanTypeName,
            diagnosis: data.prediction,
            confidence: Math.round(data.confidence * 100),
            severity: severityMap(data.prediction),
            findings: [
              {
                region: "Global",
                description: `Detected patterns consistent with ${data.prediction}`,
                probability: Math.round(data.confidence * 100)
              }
            ],
            recommendations: data.prediction.includes("Normal")
              ? ["Routine checkup recommended in 1 year"]
              : ["Immediate consultation with pulmonologist", "Confirmatory tests required"],
            processingTime: 0.5, // Mock time
            modelVersion: "ResNet18 v1",
          }

          newResults.push(result)

          await saveImageAnalysis({
            patientId: patientId || undefined,
            scanType: scanTypeName,
            imageUrl: img.preview,
            diagnosis: result.diagnosis,
            confidence: result.confidence,
            severity: result.severity,
            findings: result.findings,
            recommendations: result.recommendations,
            processingTime: result.processingTime,
            modelVersion: result.modelVersion,
          })
        }
      } catch (error) {
        console.error("Analysis failed:", error)
      }
    }

    setResults(newResults)
    setIsAnalyzing(false)

    const analysesData = await getRecentAnalyses(10)
    setRecentAnalyses(
      analysesData.map((a) => ({
        id: a.id,
        imageUrl: a.image_url || "/medical-scan-abstract.png",
        scanType: a.scan_type,
        diagnosis: a.diagnosis || "",
        confidence: a.confidence || 0,
        severity: (a.severity as "normal" | "low" | "moderate" | "high") || "normal",
        findings: (a.findings as AnalysisResult["findings"]) || [],
        recommendations: a.recommendations || [],
        processingTime: a.processing_time || 0,
        modelVersion: a.model_version || "MedAI v3.2.1",
        createdAt: a.created_at,
      })),
    )
  }

  const handleViewDetails = (result: AnalysisResult) => {
    console.log("View details for:", result.id)
  }

  return (
    <div className="p-4 lg:p-8 pt-16 lg:pt-8 space-y-8">
      <DashboardHeader
        title="Medical Image Analysis"
        subtitle="Upload X-rays, MRIs, CT scans for AI-powered diagnostic analysis"
        showActions={false}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <ImageUpload onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} patients={patients} />
          <AnalysisResults results={results} onViewDetails={handleViewDetails} />
        </div>
        <div className="lg:col-span-4">
          <AnalysisHistory analyses={recentAnalyses} />
        </div>
      </div>
    </div>
  )
}
