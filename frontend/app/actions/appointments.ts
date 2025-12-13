"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"

export async function getSessionToken() {
    const cookieStore = await cookies()
    return cookieStore.get("medai_session")?.value
}

export async function getDoctorsList() {
    const token = await getSessionToken()
    if (!token) return []

    try {
        const res = await fetch(`${API_URL}/auth/doctors`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
        })

        if (!res.ok) return []
        return await res.json()
    } catch (error) {
        console.error("Get doctors error:", error)
        return []
    }
}

export async function getAppointments(startDate?: string, endDate?: string) {
    const token = await getSessionToken()
    if (!token) return []

    try {
        const queryParams = new URLSearchParams()
        if (startDate) queryParams.append("start", startDate)
        if (endDate) queryParams.append("end", endDate)

        const res = await fetch(`${API_URL}/appointments?${queryParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
        })

        if (!res.ok) throw new Error("Failed to fetch appointments")
        return await res.json()
    } catch (error) {
        console.error("Get appointments error:", error)
        return []
    }
}

export async function createAppointment(data: any) {
    const token = await getSessionToken()
    if (!token) return { error: "Not authenticated" }

    try {
        const res = await fetch(`${API_URL}/appointments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        })

        if (!res.ok) {
            const error = await res.json()
            return { error: error.message || "Failed to create appointment" }
        }

        revalidatePath("/appointments")
        return await res.json()
    } catch (error) {
        console.error("Create appointment error:", error)
        return { error: "Failed to create appointment" }
    }
}

export async function updateAppointment(id: string, data: any) {
    const token = await getSessionToken()
    if (!token) return { error: "Not authenticated" }

    try {
        const res = await fetch(`${API_URL}/appointments/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        })

        if (!res.ok) {
            const error = await res.json()
            return { error: error.message || "Failed to update appointment" }
        }

        revalidatePath("/appointments")
        return await res.json()
    } catch (error) {
        console.error("Update appointment error:", error)
        return { error: "Failed to update appointment" }
    }
}
