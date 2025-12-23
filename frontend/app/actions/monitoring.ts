"use server"

import { cookies } from "next/headers"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

async function getSessionToken() {
    const cookieStore = await cookies()
    return cookieStore.get("auth_token")?.value || ""
}

export async function getModelMetrics() {
    try {
        const res = await fetch(`${API_URL}/model-monitoring`, {
            headers: {
                Authorization: `Bearer ${await getSessionToken()}`,
            },
            cache: "no-store"
        })

        if (!res.ok) return null
        return await res.json()
    } catch (error) {
        console.error("Error getting model monitoring data:", error)
        return null
    }
}

export async function getAuditLogs() {
    try {
        const res = await fetch(`${API_URL}/audit`, {
            headers: {
                Authorization: `Bearer ${await getSessionToken()}`,
            },
            cache: "no-store"
        })

        if (!res.ok) return []
        return await res.json()
    } catch (error) {
        console.error("Error getting audit logs:", error)
        return []
    }
}
