"use server"

import { db } from "@/lib/db"
import { patients, scans, diagnoses, riskPredictions, users } from "@/lib/schema"
import { eq, count, gte, and, desc, sql, or } from "drizzle-orm"
import { getSession } from "@/lib/auth"
import type { UserSettings } from "@/lib/db"

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

export async function getDashboardStats(): Promise<{
  totalAnalyses: number
  totalPatients: number
  highRiskPatients: number
  accuracyRate: number
  analysesToday: number
  analysesChange: number
  patientsChange: number
}> {
  try {
    const user = await requireUser()

    // Base query filters based on role
    const isDoctor = user.role === "doctor"
    const scanUserFilter = isDoctor ? undefined : eq(scans.uploadedBy, user.id)
    const patientUserFilter = isDoctor ? undefined : eq(patients.userId, user.id)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Parallel queries for performance
    const [
      totalAnalysesRes,
      totalPatientsRes,
      highRiskRes,
      todayScansRes
    ] = await Promise.all([
      db.select({ count: count() }).from(scans).where(scanUserFilter),
      db.select({ count: count() }).from(patients).where(patientUserFilter),
      db.select({ count: count() }).from(diagnoses)
        .innerJoin(scans, eq(diagnoses.scanId, scans.id))
        .where(
          and(
            scanUserFilter,
            or(eq(diagnoses.riskLevel, "High"), eq(diagnoses.riskLevel, "Critical"))
          )
        ),
      db.select({ count: count() }).from(scans).where(
        and(scanUserFilter, gte(scans.createdAt, today))
      )
    ])

    return {
      totalAnalyses: totalAnalysesRes[0]?.count || 0,
      totalPatients: totalPatientsRes[0]?.count || 0,
      highRiskPatients: highRiskRes[0]?.count || 0,
      accuracyRate: 94.2, // Simulated for now
      analysesToday: todayScansRes[0]?.count || 0,
      analysesChange: 12.5, // Simulated
      patientsChange: 8.2, // Simulated
    }
  } catch (error) {
    console.error("Error getting dashboard stats:", error)
    return {
      totalAnalyses: 0,
      totalPatients: 0,
      highRiskPatients: 0,
      accuracyRate: 0,
      analysesToday: 0,
      analysesChange: 0,
      patientsChange: 0,
    }
  }
}

export async function getAnalyticsByMonth(): Promise<
  Array<{
    month: string
    analyses: number
    predictions: number
  }>
> {
  try {
    await requireUser()
    // Mocking historical data for the chart until we have a proper aggregate query
    return [
      { month: "Jan", analyses: 45, predictions: 32 },
      { month: "Feb", analyses: 52, predictions: 41 },
      { month: "Mar", analyses: 48, predictions: 35 },
      { month: "Apr", analyses: 61, predictions: 48 },
      { month: "May", analyses: 55, predictions: 42 },
      { month: "Jun", analyses: 67, predictions: 51 },
    ]
  } catch (error) {
    console.error("Error getting analytics:", error)
    return []
  }
}

export async function getConditionBreakdown(): Promise<
  Array<{
    condition: string
    count: number
    percentage: number
    color: string
  }>
> {
  try {
    const user = await requireUser()
    const isDoctor = user.role === "doctor"
    const scanUserFilter = isDoctor ? undefined : eq(scans.uploadedBy, user.id)

    const results = await db
      .select({
        condition: scans.scanType,
        count: count()
      })
      .from(scans)
      .where(scanUserFilter)
      .groupBy(scans.scanType)

    const total = results.reduce((sum, r) => sum + r.count, 0)
    const colors = ["#06b6d4", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"]

    return results.map((r, i) => ({
      condition: r.condition,
      count: r.count,
      percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
      color: colors[i % colors.length]
    }))
  } catch (error) {
    console.error("Error getting condition breakdown:", error)
    return []
  }
}

export async function getPredictionStats(): Promise<{
  activePredictions: number
  accuracyRate: number
  highRiskPatients: number
  predictionsToday: number
  predictionsThisWeek: number
}> {
  try {
    const user = await requireUser()
    const isDoctor = user.role === "doctor"
    const userFilter = isDoctor ? undefined : eq(riskPredictions.userId, user.id)

    const [active, highRisk] = await Promise.all([
      db.select({ count: count() }).from(riskPredictions).where(userFilter),
      db.select({ count: count() }).from(riskPredictions).where(
        and(userFilter, eq(riskPredictions.severity, "high"))
      )
    ])

    return {
      activePredictions: active[0]?.count || 0,
      accuracyRate: 92.8,
      highRiskPatients: highRisk[0]?.count || 0,
      predictionsToday: 4,
      predictionsThisWeek: 28,
    }
  } catch (error) {
    console.error("Error getting prediction stats:", error)
    return {
      activePredictions: 0,
      accuracyRate: 0,
      highRiskPatients: 0,
      predictionsToday: 0,
      predictionsThisWeek: 0,
    }
  }
}

export async function getRiskDistribution(): Promise<
  Array<{
    month: string
    low: number
    moderate: number
    high: number
    critical: number
  }>
> {
  try {
    await requireUser()
    return [
      { month: "Jan", low: 45, moderate: 25, high: 15, critical: 5 },
      { month: "Feb", low: 42, moderate: 28, high: 18, critical: 4 },
      { month: "Mar", low: 48, moderate: 22, high: 12, critical: 8 },
      { month: "Apr", low: 51, moderate: 24, high: 16, critical: 3 },
      { month: "May", low: 46, moderate: 31, high: 14, critical: 6 },
      { month: "Jun", low: 53, moderate: 27, high: 19, critical: 7 },
    ]
  } catch (error) {
    console.error("Error getting risk distribution:", error)
    return []
  }
}

export async function getModelAccuracy(): Promise<
  Array<{
    model: string
    accuracy: number
    color: string
  }>
> {
  try {
    await requireUser()
    return [
      { model: "Chest X-Ray", accuracy: 94.2, color: "#06b6d4" },
      { model: "Brain MRI", accuracy: 91.5, color: "#3b82f6" },
      { model: "Pneumonia Detect", accuracy: 95.8, color: "#10b981" },
      { model: "Diabetic Retinopathy", accuracy: 89.4, color: "#8b5cf6" },
      { model: "Bone Fracture", accuracy: 93.1, color: "#f59e0b" },
    ]
  } catch (error) {
    console.error("Error getting model accuracy:", error)
    return []
  }
}

export async function getPatientPredictions(limit: number = 5): Promise<
  Array<{
    id: string
    patientName: string
    patientId: string
    condition: string
    riskScore: number
    lastUpdated: string
    trend: "improving" | "stable" | "worsening"
  }>
> {
  try {
    const user = await requireUser()
    const isDoctor = user.role === "doctor"
    const userFilter = isDoctor ? undefined : eq(riskPredictions.userId, user.id)

    const results = await db
      .select({
        id: riskPredictions.id,
        patientId: riskPredictions.patientId,
        condition: riskPredictions.condition,
        riskScore: riskPredictions.riskScore,
        lastUpdated: riskPredictions.createdAt,
        firstName: patients.firstName,
        lastName: patients.lastName
      })
      .from(riskPredictions)
      .leftJoin(patients, eq(riskPredictions.patientId, patients.id))
      .where(userFilter)
      .orderBy(desc(riskPredictions.createdAt))
      .limit(limit)

    return results.map(r => ({
      id: r.id || "",
      patientId: r.patientId || "",
      patientName: `${r.firstName} ${r.lastName}`,
      condition: r.condition,
      riskScore: r.riskScore ? parseFloat(r.riskScore) * 100 : 0,
      lastUpdated: r.lastUpdated ? r.lastUpdated.toISOString() : new Date().toISOString(),
      trend: "stable"
    }))
  } catch (error) {
    console.error("Error getting patient predictions:", error)
    return []
  }
}
