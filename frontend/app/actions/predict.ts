"use server"

import { getSession } from "@/lib/auth"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { riskPredictions, patients } from "@/lib/schema"
import { eq } from "drizzle-orm"

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

            let targetPatientId = data.patientId;

            // Enforce ownership / resolve patient
            if (user.role === "patient") {
                const patientRecord = await db.query.patients.findFirst({
                    where: eq(patients.userId, user.id)
                });
                if (!patientRecord) {
                    console.warn("Skipping risk prediction persistence: No patient profile found for patient user", user.id);
                    targetPatientId = null;
                } else if (targetPatientId && targetPatientId !== patientRecord.id) {
                    console.warn("IDOR attempt: Patient", user.id, "tried to predict risk for patientId", targetPatientId);
                    targetPatientId = patientRecord.id; // Force to their own ID
                } else {
                    targetPatientId = patientRecord.id;
                }
            } else if (!targetPatientId) {
                // For doctors, targetPatientId should be provided. If not, fallback.
                const patientRecord = await db.select().from(patients).where(eq(patients.userId, user.id)).limit(1);
                if (patientRecord.length > 0) {
                    targetPatientId = patientRecord[0].id;
                }
            }

            if (targetPatientId) {
                await db.insert(riskPredictions).values({
                    userId: user.id,
                    patientId: targetPatientId,
                    condition: result.prediction || "Cardiovascular Risk",
                    riskScore: result.risk_score?.toString() || "0",
                    severity: result.severity || "Low",
                    contributingFactors: JSON.stringify(result.factors || {}),
                    recommendations: JSON.stringify(result.recommendations || []),
                    modelVersion: "3.0.0",
                })
            } else {
                console.warn("Skipping risk prediction persistence: No patient ID found for user", user.id);
            }
        } catch (dbError) {
            console.error("Failed to persist risk prediction:", dbError)
        }


        return { success: true, data: result }
    } catch (error) {
        console.error("Error predicting risk:", error)
        return { success: false, error: "Network error" }
    }
}
