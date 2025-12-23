"use server"

import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"

async function getSessionToken() {
    const cookieStore = await cookies()
    return cookieStore.get("auth_token")?.value
}

export async function getUserProfile() {
    const token = await getSessionToken()
    if (!token) return null

    try {
        const res = await fetch(`${API_URL}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
        })

        if (!res.ok) throw new Error("Failed to fetch profile")
        return await res.json()
    } catch (error) {
        console.error("Get profile error:", error)
        return null
    }
}

export async function updateUserProfile(data: { name: string; email: string }) {
    const token = await getSessionToken()
    if (!token) return { error: "Not authenticated" }

    try {
        const res = await fetch(`${API_URL}/auth/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        })

        const responseData = await res.json()

        if (!res.ok) {
            return { error: responseData.message || "Failed to update profile" }
        }

        revalidatePath("/profile")
        return { success: true, user: responseData }
    } catch (error) {
        console.error("Update profile error:", error)
        return { error: "Failed to update profile" }
    }
}

export async function changePassword(data: { currentPassword: string; newPassword: string }) {
    const token = await getSessionToken()
    if (!token) return { error: "Not authenticated" }

    try {
        const res = await fetch(`${API_URL}/auth/password`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        })

        const responseData = await res.json()

        if (!res.ok) {
            return { error: responseData.message || "Failed to update password" }
        }

        return { success: true, message: responseData.message }
    } catch (error) {
        console.error("Change password error:", error)
        return { error: "Failed to change password" }
    }
}
