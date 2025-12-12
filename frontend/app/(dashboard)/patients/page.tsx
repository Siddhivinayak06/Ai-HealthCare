"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { PatientForm, type PatientData } from "@/components/patient-form"
import { RiskPredictionCard, generatePredictions, type RiskPrediction } from "@/components/risk-prediction"
import { HealthMetrics, generateMetrics } from "@/components/health-metrics"
import { PatientsList } from "@/components/patients-list"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPatients } from "@/app/actions/patients"
import { predictHealthWithAI } from "@/app/actions/analyses"
import type { Patient } from "@/lib/db"
import { UsersIcon } from "@/components/icons"

export default function PatientsPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [predictions, setPredictions] = useState<RiskPrediction[]>([])
  const [metrics, setMetrics] = useState<ReturnType<typeof generateMetrics>>([])
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [activeTab, setActiveTab] = useState("analyze")

  useEffect(() => {
    loadPatients()
  }, [])

  async function loadPatients() {
    const data = await getPatients()
    setPatients(data)
  }

  const handleAnalyze = async (data: PatientData) => {
    setIsAnalyzing(true)

    // Use AI to generate predictions
    const aiResult = await predictHealthWithAI(data)

    if (aiResult.success && aiResult.predictions) {
      // Map AI predictions to our format
      const formattedPredictions = aiResult.predictions.predictions.map((p, idx) => ({
        ...p,
        icon:
          idx === 0
            ? require("@/components/icons").HeartPulseIcon
            : idx === 1
              ? require("@/components/icons").ActivityIcon
              : require("@/components/icons").BrainIcon,
      }))
      setPredictions(formattedPredictions as RiskPrediction[])
    } else {
      // Fallback to local prediction generation
      const generatedPredictions = generatePredictions(data)
      setPredictions(generatedPredictions)
    }

    const generatedMetrics = generateMetrics(data)
    setMetrics(generatedMetrics)
    setHasAnalyzed(true)
    setIsAnalyzing(false)
  }

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setActiveTab("analyze")
  }

  return (
    <div className="p-4 lg:p-8 pt-16 lg:pt-8">
      <DashboardHeader
        title="Patient Management"
        description="Manage patients and analyze health data for AI-powered predictions"
        showActions={false}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="analyze">Health Analysis</TabsTrigger>
          <TabsTrigger value="patients">Patient Records ({patients.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div>
              <PatientForm
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                selectedPatient={selectedPatient}
                onClearPatient={() => setSelectedPatient(null)}
              />
            </div>

            <div className="space-y-6">
              {hasAnalyzed && (
                <>
                  <HealthMetrics metrics={metrics} />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Risk Predictions</h3>
                    <RiskPredictionCard predictions={predictions} />
                  </div>
                </>
              )}

              {!hasAnalyzed && (
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardContent className="flex flex-col items-center justify-center h-96">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
                      <UsersIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-center">Enter patient data and click analyze</p>
                    <p className="text-sm text-muted-foreground mt-1">AI-powered risk predictions will appear here</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="patients" className="mt-6">
          <PatientsList patients={patients} onSelectPatient={handleSelectPatient} onRefresh={loadPatients} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
