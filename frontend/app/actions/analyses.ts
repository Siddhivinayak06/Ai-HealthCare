"use server"

import { db } from "@/lib/db"
import { riskPredictions, patients, auditLogs, scans, diagnoses } from "@/lib/schema"
import { eq, desc, and, ne, lt, sql, count } from "drizzle-orm"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { logActivity } from "./activity"
import { generateText } from "ai"
import type { RiskPrediction, Scan, Diagnosis } from "@/lib/db"

/**
 * Require a valid session and return the user.
 */
async function requireUser() {
  const { user } = await getSession()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function saveImageAnalysis(data: {
  patientId?: string
  scanType: string
  imageUrl?: string
  diagnosis: string
  confidence: number
  severity: string
  findings: any
  recommendations: string[]
  processingTime: number
  modelVersion: string
}): Promise<{ success: boolean; error?: string; analysis?: any }> {
  try {
    const user = await requireUser()

    if (!data.patientId) return { success: false, error: "Patient ID is required" }

    // 1. Insert into scans
    const scanResult = await db
      .insert(scans)
      .values({
        patientId: data.patientId,
        scanType: data.scanType,
        imageUrl: data.imageUrl || "",
        uploadedBy: user.id,
      })
      .returning()

    const newScan = scanResult[0]

    // 2. Insert into diagnoses
    const diagnosisResult = await db
      .insert(diagnoses)
      .values({
        scanId: newScan.id,
        predictedCondition: data.diagnosis,
        confidenceScore: (data.confidence / 100).toString(),
        riskLevel: data.severity,
        explanation: {
          findings: data.findings,
          recommendations: data.recommendations
        },
        modelVersion: data.modelVersion,
      })
      .returning()

    const newDiagnosis = diagnosisResult[0]




    await logActivity("Image analysis completed", "analysis", {
      scanType: data.scanType,
      severity: data.severity,
      analysisId: newScan.id,
    })

    revalidatePath("/imaging")
    revalidatePath("/analysis")
    revalidatePath("/")
    return { success: true, analysis: newScan }
  } catch (error) {
    console.error("Error saving analysis:", error)
    return { success: false, error: "Database error" }
  }
}

export async function getRecentAnalyses(limit = 10): Promise<any[]> {
  try {
    const user = await requireUser()

    // Query scans + diagnoses + patients
    let query = db
      .select({
        id: scans.id, // Using scan ID as the main ID
        scan_type: scans.scanType,
        image_url: scans.imageUrl,
        created_at: scans.createdAt,
        diagnosis: diagnoses.predictedCondition,
        confidence: diagnoses.confidenceScore,
        severity: diagnoses.riskLevel,
        explanation: diagnoses.explanation,
        model_version: diagnoses.modelVersion,
        first_name: patients.firstName,
        last_name: patients.lastName,
        patient_id: scans.patientId,
      })
      .from(scans)
      .leftJoin(diagnoses, eq(scans.id, diagnoses.scanId))
      .leftJoin(patients, eq(scans.patientId, patients.id))
      .$dynamic()

    // RBAC: Patients only see their own analyses
    if (user.role === "patient") {
      // Scans doesn't have userId directly, but we can verify via patients table or initial uploader
      // The schema says `scans.uploadedBy`. If patient uploaded it, they can see it.
      // Or if the scan belongs to a patient profile that is owned by this user.

      // Option 1: Filter by uploadedBy (Simpler if users always upload their own)
      // Option 2: Filter by patients.userId (Better if doctors upload FOR patients)

      // Let's use patients.userId to be safe, assuming the join on patients works
      query = query.where(eq(patients.userId, user.id))
    }

    const results = await query
      .orderBy(desc(scans.createdAt))
      .limit(limit)

    return results.map(r => {
      // Parse explanation JSON safely
      const explanation = r.explanation as any || {};

      return {
        id: r.id,
        scanType: r.scan_type,
        imageUrl: r.image_url,
        diagnosis: r.diagnosis || "Pending",
        confidence: r.confidence ? Math.round(parseFloat(r.confidence) * 1000) / 10 : 0,
        severity: r.severity || "Normal",
        findings: explanation.findings?.details || explanation.findings || [], // Standardize specific findings path
        recommendations: explanation.recommendations || [],
        processingTime: 0.5, // Not in new schema, default to placeholder
        modelVersion: r.model_version || "V2.0",
        createdAt: r.created_at,
        patientName: r.first_name ? `${r.first_name} ${r.last_name || ""}`.trim() : "Unknown Patient",
      }
    })
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
    const user = await requireUser()

    await db.insert(riskPredictions).values({
      userId: user.id,
      patientId: data.patientId,
      healthRecordId: data.healthRecordId,
      condition: data.condition,
      riskScore: (data.riskScore / 100).toString(),
      severity: data.severity,
      contributingFactors: data.contributingFactors.join(", "),
      recommendations: data.recommendations.join(". "),
    })

    await logActivity("Risk prediction generated", "prediction", {
      patientId: data.patientId,
      condition: data.condition,
      riskScore: data.riskScore,
    })

    revalidatePath("/predictions")
    revalidatePath("/risk")
    return { success: true }
  } catch (error) {
    console.error("Error saving prediction:", error)
    return { success: false, error: "Database error" }
  }
}

export async function getPatientPredictions(patientId: string): Promise<RiskPrediction[]> {
  try {
    await requireUser()
    const result = await db
      .select()
      .from(riskPredictions)
      .where(eq(riskPredictions.patientId, patientId))
      .orderBy(desc(riskPredictions.createdAt))

    return result.map(r => ({
      ...r,
      riskScore: r.riskScore ? parseFloat(r.riskScore) * 100 : 0
    })) as unknown as RiskPrediction[]
  } catch (error) {
    console.error("Error getting patient predictions:", error)
    return []
  }
}

export async function submitFeedback(data: {
  entityId: string
  entityType: "IMAGE_ANALYSIS" | "RISK_PREDICTION"
  action: "APPROVE" | "OVERRIDE"
  feedback?: string
  overrideReason?: string
  findings?: any
  confidenceScore?: number
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser()

    await db.insert(auditLogs).values({
      userId: user.id,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      feedback: data.feedback,
      overrideReason: data.overrideReason,
      doctorOverride: data.action === "OVERRIDE",
      findings: data.findings,
      confidence: data.confidenceScore ? (data.confidenceScore / 100).toString() : null,
    })

    await logActivity(`Doctor ${data.action.toLowerCase()}d AI result`, "system", {
      entityId: data.entityId,
      entityType: data.entityType,
    })

    return { success: true }
  } catch (error) {
    console.error("Error submitting feedback:", error)
    return { success: false, error: "Database error" }
  }
}

export async function predictHealthWithAI(patientData: any): Promise<any> {
  // Keeping this one using generateText for now as it's an AI-driven synthesis
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
    - Family History: ${patientData.familyHistory?.join?.(", ") || "None reported"}
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

/**
 * Gets the most recent scan for a patient before a specific time/ID for comparison.
 */
export async function getLatestScanForPatient(patientId: string, beforeScanId?: string) {
  try {
    await requireUser()

    // Find the latest scan for this patient
    let query = db
      .select({
        id: scans.id,
        scanType: scans.scanType,
        imageUrl: scans.imageUrl,
        createdAt: scans.createdAt,
        diagnosis: diagnoses.predictedCondition,
        severity: diagnoses.riskLevel,
        confidence: diagnoses.confidenceScore,
      })
      .from(scans)
      .leftJoin(diagnoses, eq(scans.id, diagnoses.scanId))
      .where(eq(scans.patientId, patientId))
      .$dynamic()

    if (beforeScanId) {
      query = query.where(ne(scans.id, beforeScanId))
    }

    const results = await query
      .orderBy(desc(scans.createdAt))
      .limit(1)

    if (results.length === 0) return null

    const r = results[0]
    return {
      id: r.id,
      scanType: r.scanType,
      imageUrl: r.imageUrl,
      diagnosis: r.diagnosis || "No diagnosis",
      severity: r.severity || "Unknown",
      confidence: r.confidence ? parseFloat(r.confidence) * 100 : 0,
      createdAt: r.createdAt
    }
  } catch (error) {
    console.error("Error getting latest scan:", error)
    return null
  }
}
/**
 * Fetches historical clinical data for a patient to build trend charts.
 */
export async function getHistoricalTrendsForPatient(patientId: string) {
  try {
    await requireUser()

    // 1. Get Image Analysis History
    const imageHistory = await db
      .select({
        date: scans.createdAt,
        type: scans.scanType,
        score: diagnoses.confidenceScore, // Using confidence as a marker for image clarity/severity
        label: diagnoses.predictedCondition
      })
      .from(scans)
      .innerJoin(diagnoses, eq(scans.id, diagnoses.scanId))
      .where(eq(scans.patientId, patientId))
      .orderBy(desc(scans.createdAt))

    // 2. Get Risk Prediction History
    const riskHistory = await db
      .select({
        date: riskPredictions.createdAt,
        type: riskPredictions.condition,
        score: riskPredictions.riskScore,
        label: riskPredictions.severity
      })
      .from(riskPredictions)
      .where(eq(riskPredictions.patientId, patientId))
      .orderBy(desc(riskPredictions.createdAt))

    // 3. Merge and Format
    const combined = [
      ...imageHistory.map(h => ({
        date: h.date?.toISOString(),
        category: 'Imaging',
        value: parseFloat(h.score || '0') * 100, // Normalize to 0-100
        label: h.label,
        sub: h.type
      })),
      ...riskHistory.map(h => ({
        date: h.date?.toISOString(),
        category: 'Risk',
        value: parseFloat(h.score || '0') * 100,
        label: h.label,
        sub: h.type
      }))
    ].sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())

    return combined
  } catch (error) {
    console.error("Trend fetch error:", error)
    return []
  }
}

export async function getAnalysisStats() {
  try {
    const user = await requireUser()

    // Base query builder helper
    const buildQuery = (conditions: any[] = []) => {
      let query = db.select({ count: count() })
        .from(scans)
        .leftJoin(diagnoses, eq(scans.id, diagnoses.scanId))
        .leftJoin(patients, eq(scans.patientId, patients.id))
        .$dynamic()

      if (user.role === "patient") {
        conditions.push(eq(patients.userId, user.id))
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions))
      }

      return query
    }

    // 1. Total Scans
    const totalRes = await buildQuery()
    const total = totalRes[0]?.count || 0

    // 2. Critical Cases
    // Looking for "Critical" or "High" severity
    const criticalRes = await buildQuery([
      sql`LOWER(${diagnoses.riskLevel}) IN ('critical', 'high')`
    ])
    const critical = criticalRes[0]?.count || 0

    // 3. Normal Results
    // Looking for "Normal" or "Low" severity
    const normalRes = await buildQuery([
      sql`LOWER(${diagnoses.riskLevel}) IN ('normal', 'low')`
    ])
    const normal = normalRes[0]?.count || 0

    return {
      total,
      critical,
      normal,
      accuracy: "94.8%" // Static for this model version
    }

  } catch (error) {
    console.error("Error fetching stats:", error)
    return {
      total: 0,
      critical: 0,
      normal: 0,
      accuracy: "94.8%"
    }
  }
}

