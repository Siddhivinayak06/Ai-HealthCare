"use server"

import type { ActivityLog } from "@/lib/db"
import { getSession } from "@/lib/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// Helper to get raw token for Authorization header
import { cookies } from "next/headers"
async function getSessionToken() {
  const cookieStore = await cookies()
  return cookieStore.get("medai_session")?.value || ""
}

export async function logActivity(action: string, actionType: string, details?: object): Promise<void> {
  // Front-end logging is optional or can be done via API if needed.
  // Generally, backend actions should log their own activity internally.
  // However, for explicit client-side events, we can call the API.
  try {
    await fetch(`${API_URL}/activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getSessionToken()}`,
      },
      body: JSON.stringify({ action, actionType, details }),
    })
  } catch (error) {
    console.error("Error logging activity:", error)
  }
}

export async function getRecentActivity(limit = 20): Promise<ActivityLog[]> {
  try {
    const res = await fetch(`${API_URL}/activity?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${await getSessionToken()}`,
      },
      cache: "no-store"
    })

    if (!res.ok) return []
    return await res.json()
  } catch (error) {
    console.error("Error getting recent activity:", error)
    return []
  }
}

export async function getAllActivity(): Promise<ActivityLog[]> {
  try {
    const res = await fetch(`${API_URL}/activity?limit=100`, {
      headers: {
        Authorization: `Bearer ${await getSessionToken()}`,
      },
      cache: "no-store"
    })

    if (!res.ok) return []
    return await res.json()
  } catch (error) {
    console.error("Error getting all activity:", error)
    return []
  }
}
