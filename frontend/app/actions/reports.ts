"use server"

import type { Report } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { logActivity } from "./activity"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// Helper to get raw token for Authorization header
import { cookies } from "next/headers"
async function getSessionToken() {
  const cookieStore = await cookies()
  return cookieStore.get("medai_session")?.value || ""
}

export async function getReports(): Promise<Report[]> {
  try {
    const res = await fetch(`${API_URL}/reports`, {
      headers: {
        Authorization: `Bearer ${await getSessionToken()}`,
      },
      cache: "no-store"
    })

    if (!res.ok) return []
    return await res.json()
  } catch (error) {
    console.error("Error getting reports:", error)
    return []
  }
}

export async function createReport(data: {
  patientId?: string
  title: string
  reportType: string
  content: object
}): Promise<{ success: boolean; error?: string; report?: Report }> {
  try {
    const res = await fetch(`${API_URL}/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getSessionToken()}`,
      },
      body: JSON.stringify(data),
    })

    const result = await res.json()
    if (!res.ok) {
      return { success: false, error: result.message || "Failed to create report" }
    }

    await logActivity("Report generated", "report", {
      reportId: result.id,
      reportType: data.reportType,
      title: data.title,
    })

    revalidatePath("/reports")
    return { success: true, report: result }
  } catch (error) {
    console.error("Error creating report:", error)
    return { success: false, error: "Network error" }
  }
}

export async function deleteReport(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/reports/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${await getSessionToken()}`,
      },
    })

    if (!res.ok) {
      return { success: false, error: "Failed to delete report" }
    }

    await logActivity("Report deleted", "report", { reportId: id })
    revalidatePath("/reports")
    return { success: true }
  } catch (error) {
    console.error("Error deleting report:", error)
    return { success: false, error: "Network error" }
  }
}
