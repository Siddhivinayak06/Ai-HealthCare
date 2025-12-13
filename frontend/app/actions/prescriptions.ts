"use server"

import { cookies } from "next/headers"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"

async function getSessionToken() {
    const cookieStore = await cookies()
    return cookieStore.get("medai_session")?.value
}

export async function getPatientPrescriptions(patientId: string) {
    const token = await getSessionToken()
    if (!token) return []

    try {
        const res = await fetch(`${API_URL}/prescriptions/patient/${patientId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
        })

        if (!res.ok) throw new Error("Failed to fetch prescriptions")
        return await res.json()
    } catch (error) {
        console.error("Get prescriptions error:", error)
        return []
    }
}
