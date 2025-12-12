"use server"

import { getSession } from "@/lib/auth"
import { cookies } from "next/headers"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

async function getSessionToken() {
    const cookieStore = await cookies()
    return cookieStore.get("medai_session")?.value || ""
}

export async function predictRisk(data: any) {
    try {
        const token = await getSessionToken()

        const res = await fetch(`${API_URL}/predict/risk`, {
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
        return { success: true, data: result }
    } catch (error) {
        console.error("Error predicting risk:", error)
        return { success: false, error: "Network error" }
    }
}
