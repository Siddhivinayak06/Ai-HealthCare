"use server"

import { cookies } from "next/headers"

const API_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000"

async function getSessionToken() {
    const cookieStore = await cookies()
    return cookieStore.get("auth_token")?.value || ""
}

export async function analyzeReport(text: string) {
    try {
        const token = await getSessionToken()

        const res = await fetch(`${API_URL}/nlp/analyze`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ text }),
        })

        if (!res.ok) {
            const errorText = await res.text()
            return { success: false, error: errorText || "Failed to analyze report" }
        }

        const result = await res.json()
        return { success: true, data: result }
    } catch (error) {
        console.error("Error analyzing report:", error)
        return { success: false, error: "Network error" }
    }
}
