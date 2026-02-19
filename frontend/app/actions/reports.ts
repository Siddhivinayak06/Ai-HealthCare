"use server"

import { db } from "@/lib/db"
import { reports } from "@/lib/schema"
import { eq, desc, and } from "drizzle-orm"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { logActivity } from "./activity"

import type { Report } from "@/lib/db"

export async function getReports(): Promise<Report[]> {
  try {
    const { user } = await getSession()
    if (!user) return []

    const result = await db
      .select()
      .from(reports)
      .where(eq(reports.userId, user.id))
      .orderBy(desc(reports.createdAt))

    return result as Report[]
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
    const { user } = await getSession()
    if (!user) return { success: false, error: "Unauthorized" }

    const [newReport] = await db.insert(reports).values({
      userId: user.id,
      patientId: data.patientId || null,
      title: data.title,
      reportType: data.reportType,
      content: data.content,
      status: "ready",
    }).returning()

    await logActivity("Report generated", "report", {
      reportId: newReport.id,
      reportType: data.reportType,
      title: data.title,
    })

    revalidatePath("/reports")
    return { success: true, report: newReport as Report }
  } catch (error) {
    console.error("Error creating report:", error)
    return { success: false, error: "Failed to create report" }
  }
}

export async function deleteReport(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = await getSession()
    if (!user) return { success: false, error: "Unauthorized" }

    await db.delete(reports).where(
      and(eq(reports.id, id), eq(reports.userId, user.id))
    )

    await logActivity("Report deleted", "report", { reportId: id })
    revalidatePath("/reports")
    return { success: true }
  } catch (error) {
    console.error("Error deleting report:", error)
    return { success: false, error: "Failed to delete report" }
  }
}
