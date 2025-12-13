"use server"

import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"

async function getSessionToken() {
    const cookieStore = await cookies()
    return cookieStore.get("medai_session")?.value
}

export async function saveImageAnalysis(data: any) {
    const token = await getSessionToken()
    if (!token) return { error: "Not authenticated" }

    try {
        const res = await fetch(`${API_URL}/analyses/image`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        })

        if (!res.ok) {
            const error = await res.json()
            return { error: error.message || "Failed to save analysis" }
        }

        revalidatePath("/analysis")
        revalidatePath("/patients") // Also revalidate patients as they might show history
        return await res.json()
    } catch (error) {
        console.error("Save analysis error:", error)
        return { error: "Failed to save analysis" }
    }
}

export async function saveRiskPrediction(data: any) {
    const token = await getSessionToken()
    if (!token) return { error: "Not authenticated" }

    try {
        const res = await fetch(`${API_URL}/analyses/risk`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        })

        if (!res.ok) {
            const error = await res.json()
            return { error: error.message || "Failed to save prediction" }
        }

        revalidatePath("/risk")
        revalidatePath("/patients")
        return { success: true }
    } catch (error) {
        console.error("Save risk prediction error:", error)
        return { error: "Failed to save prediction" }
    }
}

export async function getRecentAnalyses(limit: number = 5) {
    const token = await getSessionToken()
    if (!token) return []

    try {
        const res = await fetch(`${API_URL}/analyses/recent?limit=${limit}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
        })

        if (!res.ok) return []
        return await res.json()
    } catch (error) {
        console.error("Get recent analyses error:", error)
        return []
    }
}

export async function getPatientPredictions(patientId: string) {
    const token = await getSessionToken()
    if (!token) return []

    try {
        const res = await fetch(`${API_URL}/analyses/risk/${patientId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
        })

        if (!res.ok) return []
        return await res.json()
    } catch (error) {
        console.error("Get patient predictions error:", error)
        return []
    }
}
