"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { ImageUpload } from "@/components/image-upload"
import { AnalysisResults, type AnalysisResult } from "@/components/analysis-results"
import { AnalysisHistory } from "@/components/analysis-history"
import { saveImageAnalysis, getRecentAnalyses } from "@/app/actions/analyses"
import { getPatients } from "@/app/actions/patients"
import type { Patient } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Scan, Sparkles, Brain, Layers } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

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
      "xray": "X-Ray",
      "ct": "CT Scan",
      "mri": "MRI Scan",
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
      const formData = new FormData()
      formData.append("file", img.file)
      formData.append("scan_type", scanType)
      formData.append("explain", "true")

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
        const res = await fetch(`${apiUrl}/predict/image`, {
          method: "POST",
          body: formData,
        })

        if (res.ok) {
          const data = await res.json()

          // Map severity based on system spec (🔴 Critical, 🟠 Moderate, 🟢 Stable/Normal)
          const severityMap = (severity: string): "normal" | "low" | "moderate" | "high" => {
            const s = severity.toLowerCase()
            if (s === 'critical' || s === 'high') return "high"
            if (s === 'medium' || s === 'moderate') return "moderate"
            if (s === 'low') return "low"
            return "normal"
          }

          const result: AnalysisResult = {
            id: data.id || `result-${Date.now()}`,
            imageUrl: img.preview,
            heatmapUrl: data.explanation_url,
            scanType: data.scan_type || scanTypeName,
            diagnosis: data.prediction || data.diagnosis,
            confidence: Math.round((data.confidence || 0) * 100),
            severity: severityMap(data.severity || "Normal"),
            findings: data.findings ? data.findings.map((f: string) => ({
              region: "Area of Interest",
              description: f,
              probability: Math.round((data.confidence || 0) * 100)
            })) : [],
            recommendations: data.recommendations || [],
            processingTime: data.processing_time || 0.5,
            modelVersion: data.model_version || "DenseNet121 v1.2",
            autoCorrected: data.auto_corrected || false
          }

          newResults.push(result)

          await saveImageAnalysis({
            patientId: patientId || undefined,
            scanType: result.scanType,
            imageUrl: result.imageUrl,
            diagnosis: result.diagnosis,
            confidence: result.confidence,
            severity: result.severity,
            findings: {
              findings: result.findings,
              heatmapUrl: result.heatmapUrl,
              autoCorrected: result.autoCorrected
            },
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
        heatmapUrl: a.findings?.heatmapUrl,
        scanType: a.scan_type,
        diagnosis: a.diagnosis || "",
        confidence: a.confidence || 0,
        severity: (a.severity as any) || "normal",
        findings: (a.findings?.findings) || [],
        recommendations: a.recommendations || [],
        processingTime: a.processing_time || 0,
        modelVersion: a.model_version || "MedAI v3.2.1",
        createdAt: a.created_at,
        autoCorrected: a.findings?.autoCorrected || false
      })),
    )
  }

  const handleViewDetails = (result: AnalysisResult) => {
    console.log("View details for:", result.id)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 lg:p-8 pt-16 lg:pt-8">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[200px]" />
      </div>

      <div className="relative z-10 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
              <Scan className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">Medical Image Analysis</h1>
              <p className="text-slate-400 mt-1">Upload X-rays, MRIs, CT scans for AI-powered diagnostic analysis</p>
            </div>
            <div className="ml-auto flex gap-2">
              <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300 px-3 py-1.5">
                <Brain className="h-3.5 w-3.5 mr-1.5" />
                DenseNet121
              </Badge>
              <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-300 px-3 py-1.5">
                <Layers className="h-3.5 w-3.5 mr-1.5" />
                PyTorch
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Scans", value: recentAnalyses.length.toString(), color: "cyan" },
            { label: "Normal", value: recentAnalyses.filter(a => a.severity === "normal").length.toString(), color: "emerald" },
            { label: "Requires Attention", value: recentAnalyses.filter(a => a.severity === "high").length.toString(), color: "rose" },
            { label: "Model Accuracy", value: "94.2%", color: "violet" },
          ].map((stat, i) => (
            <Card key={i} className="relative overflow-hidden border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl">
              <CardContent className="p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 text-${stat.color}-400`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* Upload Card Wrapper */}
            <Card className="relative overflow-hidden border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-2xl shadow-2xl">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 rounded-full blur-3xl" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Scan className="h-5 w-5 text-cyan-400" />
                  Upload Medical Images
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Drag & drop or select images for AI-powered analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <ImageUpload onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} patients={patients} />
              </CardContent>
            </Card>

            {/* Results */}
            {results.length > 0 && (
              <Card className="relative overflow-hidden border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-2xl shadow-2xl">
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-full blur-3xl" />
                <CardHeader className="relative z-10">
                  <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-emerald-400" />
                    Analysis Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <AnalysisResults results={results} onViewDetails={handleViewDetails} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-4">
            <Card className="relative overflow-hidden border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-2xl shadow-2xl sticky top-8">
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-gradient-to-br from-violet-500/20 to-purple-500/10 rounded-full blur-3xl" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-xl font-bold text-white">Recent Analyses</CardTitle>
                <CardDescription className="text-slate-400">Last 10 scans processed</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <AnalysisHistory analyses={recentAnalyses} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
