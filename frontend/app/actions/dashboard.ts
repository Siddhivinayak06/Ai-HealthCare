"use server"

import { getSession } from "@/lib/auth"
import type { UserSettings } from "@/lib/db"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// Helper to get raw token for Authorization header
import { cookies } from "next/headers"
async function getSessionToken() {
  const cookieStore = await cookies()
  return cookieStore.get("medai_session")?.value || ""
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
    const res = await fetch(`${API_URL}/dashboard/stats`, {
      headers: {
        Authorization: `Bearer ${await getSessionToken()}`,
      },
      cache: "no-store"
    })

    if (!res.ok) {
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
    return await res.json()
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
    const res = await fetch(`${API_URL}/dashboard/analytics`, {
      headers: {
        Authorization: `Bearer ${await getSessionToken()}`,
      },
      cache: "no-store"
    })

    if (!res.ok) return []
    return await res.json()
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
    const res = await fetch(`${API_URL}/dashboard/conditions`, {
      headers: {
        Authorization: `Bearer ${await getSessionToken()}`,
      },
      cache: "no-store"
    })

    if (!res.ok) return []
    return await res.json()
  } catch (error) {
    console.error("Error getting condition breakdown:", error)
    return []
  }
}
