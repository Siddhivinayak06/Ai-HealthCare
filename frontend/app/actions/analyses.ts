"use server"

import type { ImageAnalysis, RiskPrediction } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { logActivity } from "./activity"
import { generateText } from "ai"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// Helper to get raw token for Authorization header
import { cookies } from "next/headers"
async function getSessionToken() {
  const cookieStore = await cookies()
  return cookieStore.get("medai_session")?.value || ""
}

export async function saveImageAnalysis(data: {
  patientId?: string
  scanType: string
  imageUrl?: string
  diagnosis: string
  confidence: number
  severity: string
  findings: object
  recommendations: string[]
  processingTime: number
  modelVersion: string
}): Promise<{ success: boolean; error?: string; analysis?: ImageAnalysis }> {
  try {
    const res = await fetch(`${API_URL}/analyses/image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getSessionToken()}`,
      },
      body: JSON.stringify(data),
    })

    const result = await res.json()
    if (!res.ok) {
      return { success: false, error: result.message || "Failed to save analysis" }
    }

    await logActivity("Image analysis completed", "analysis", {
      scanType: data.scanType,
      severity: data.severity,
      analysisId: result.id,
    })

    revalidatePath("/imaging")
    revalidatePath("/")
    return { success: true, analysis: result }
  } catch (error) {
    console.error("Error saving analysis:", error)
    return { success: false, error: "Network error" }
  }
}

export async function getRecentAnalyses(limit = 10): Promise<ImageAnalysis[]> {
  try {
    const res = await fetch(`${API_URL}/analyses/recent?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${await getSessionToken()}`,
      },
      cache: "no-store"
    })

    if (!res.ok) return []
    return await res.json()
  } catch (error) {
    console.error("Error getting recent analyses:", error)
    return []
  }
}

export async function saveRiskPrediction(data: {
  patientId: string
  healthRecordId?: string
  condition: string
  riskScore: number
  severity: string
  contributingFactors: string[]
  recommendations: string[]
}): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/analyses/risk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getSessionToken()}`,
      },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const result = await res.json()
      return { success: false, error: result.message || "Failed to save prediction" }
    }

    await logActivity("Risk prediction generated", "prediction", {
      patientId: data.patientId,
      condition: data.condition,
      riskScore: data.riskScore,
    })

    revalidatePath("/predictions")
    return { success: true }
  } catch (error) {
    console.error("Error saving prediction:", error)
    return { success: false, error: "Network error" }
  }
}

export async function getPatientPredictions(patientId: string): Promise<RiskPrediction[]> {
  try {
    const res = await fetch(`${API_URL}/analyses/risk/${patientId}`, {
      headers: {
        Authorization: `Bearer ${await getSessionToken()}`,
      },
      cache: "no-store"
    })

    if (!res.ok) return []
    return await res.json()
  } catch (error) {
    console.error("Error getting patient predictions:", error)
    return []
  }
}

export async function predictHealthWithAI(patientData: {
  age: number
  gender: string
  weight: number
  height: number
  bloodPressureSystolic: number
  bloodPressureDiastolic: number
  heartRate: number
  bloodSugar: number
  cholesterolTotal: number
  cholesterolHDL: number
  cholesterolLDL: number
  smokingStatus: string
  alcoholConsumption: string
  exerciseFrequency: string
  familyHistory: string[]
  currentSymptoms: string
  medications: string
}): Promise<{
  success: boolean
  predictions?: {
    predictions: Array<{
      condition: string
      risk: number
      severity: string
      factors: string[]
      recommendations: string[]
    }>
    overallHealthScore: number
    summary: string
  }
  error?: string
}> {
  try {
    const bmi = patientData.weight / Math.pow(patientData.height / 100, 2)

    const prompt = `You are an AI health prediction assistant. Based on the following patient data, provide comprehensive health risk predictions.

Patient Data:
- Age: ${patientData.age}
- Gender: ${patientData.gender}
- BMI: ${bmi.toFixed(1)}
- Blood Pressure: ${patientData.bloodPressureSystolic}/${patientData.bloodPressureDiastolic} mmHg
- Heart Rate: ${patientData.heartRate} bpm
- Blood Sugar: ${patientData.bloodSugar} mg/dL
- Total Cholesterol: ${patientData.cholesterolTotal} mg/dL
- HDL Cholesterol: ${patientData.cholesterolHDL} mg/dL
- LDL Cholesterol: ${patientData.cholesterolLDL} mg/dL
- Smoking Status: ${patientData.smokingStatus}
- Alcohol Consumption: ${patientData.alcoholConsumption}
- Exercise Frequency: ${patientData.exerciseFrequency}
- Family History: ${patientData.familyHistory.join(", ") || "None reported"}
- Current Symptoms: ${patientData.currentSymptoms || "None reported"}
- Current Medications: ${patientData.medications || "None reported"}

Provide risk predictions in JSON format:
{
  "predictions": [
    {
      "condition": "Cardiovascular Disease",
      "risk": 0-100 (number),
      "severity": "low" | "moderate" | "high" | "critical",
      "factors": ["Factor 1", "Factor 2"],
      "recommendations": ["Recommendation 1", "Recommendation 2"]
    },
    {
      "condition": "Type 2 Diabetes",
      "risk": 0-100,
      "severity": "low" | "moderate" | "high" | "critical",
      "factors": ["Factor 1"],
      "recommendations": ["Recommendation 1"]
    },
    {
      "condition": "Stroke",
      "risk": 0-100,
      "severity": "low" | "moderate" | "high" | "critical",
      "factors": ["Factor 1"],
      "recommendations": ["Recommendation 1"]
    }
  ],
  "overallHealthScore": 0-100 (higher is healthier),
  "summary": "Brief overall health assessment"
}

Base risk calculations on established medical guidelines.`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
    })

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const predictions = JSON.parse(jsonMatch[0])
      return { success: true, predictions }
    }

    return { success: false, error: "Failed to parse predictions" }
  } catch (error) {
    console.error("Health prediction error:", error)
    return { success: false, error: "Prediction failed" }
  }
}
