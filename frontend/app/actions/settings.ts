"use server"

import { getSession } from "@/lib/auth"
import type { UserSettings } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { logActivity } from "./activity"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export async function getUserSettings(): Promise<UserSettings | null> {
  const { user } = await getSession()
  if (!user) return null

  try {
    const res = await fetch(`${API_URL}/settings`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getSessionToken()}`,
      },
      cache: "no-store"
    })

    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    console.error("Error getting settings:", error)
    return null
  }
}

export async function updateUserSettings(data: {
  notificationsEnabled?: boolean
  emailAlerts?: boolean
  darkMode?: boolean
  language?: string
  timezone?: string
  defaultScanType?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getSessionToken()}`,
      },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      // Log error only if request fails
      const errorData = await res.json()
      return { success: false, error: errorData.message || "Failed to update settings" }
    }

    await logActivity("Settings updated", "system", data)
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error updating settings:", error)
    return { success: false, error: "Network error" }
  }
}

export async function updateProfile(data: {
  name?: string
  email?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getSessionToken()}`,
      },
      body: JSON.stringify(data),
    })

    const result = await res.json()

    if (!res.ok) {
      return { success: false, error: result.message || "Failed to update profile" }
    }

    await logActivity("Profile updated", "system", { updatedFields: Object.keys(data) })
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error updating profile:", error)
    return { success: false, error: "Network error" }
  }
}

export async function changePassword(data: {
  currentPassword: string
  newPassword: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getSessionToken()}`,
      },
      body: JSON.stringify(data),
    })

    const result = await res.json()

    if (!res.ok) {
      return { success: false, error: result.message || "Failed to change password" }
    }

    await logActivity("Password changed", "system", {})
    return { success: true }
  } catch (error) {
    console.error("Error changing password:", error)
    return { success: false, error: "Network error" }
  }
}

// Helper to get raw token for Authorization header
import { cookies } from "next/headers"
async function getSessionToken() {
  const cookieStore = await cookies()
  return cookieStore.get("medai_session")?.value || ""
}
