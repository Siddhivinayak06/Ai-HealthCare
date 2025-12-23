"use server"

import { getSession } from "@/lib/auth"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { riskPredictions } from "@/lib/schema"

const API_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000"

async function getSessionToken() {
    const cookieStore = await cookies()
    return cookieStore.get("auth_token")?.value || ""
}

async function requireUser() {
    const { user } = await getSession()
    if (!user) throw new Error("Unauthorized")
    return user
}

export async function predictRisk(data: any, explain: boolean = false) {
    try {
        const token = await getSessionToken()

        const res = await fetch(`${API_URL}/predict/risk?explain=${explain}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        })

        if (!res.ok) {
            const errorText = await res.text()
            return { success: false, error: errorText || "Failed to calculate risk" }
        }

        const result = await res.json()

        // Persistence: Save to DB
        try {
            const user = await requireUser()
            await db.insert(riskPredictions).values({
                userId: user.id,
                patientId: data.patientId || "", // Assuming patientId is in data
                condition: result.prediction || "Unknown",
                riskScore: result.risk_score?.toString() || "0",
                severity: result.severity || "Low",
                contributingFactors: JSON.stringify(result.factors || {}),
                recommendations: JSON.stringify(result.recommendations || []),
                modelVersion: "3.0.0",
            })
        } catch (dbError) {
            console.error("Failed to persist risk prediction:", dbError)
        }

        return { success: true, data: result }
    } catch (error) {
        console.error("Error predicting risk:", error)
        return { success: false, error: "Network error" }
    }
}
