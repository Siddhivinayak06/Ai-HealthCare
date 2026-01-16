"use server"

import { getSession } from "@/lib/auth"
import type { UserSettings } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { logActivity } from "./activity"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

import { db } from "@/lib/db"
import { userSettings } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function getUserSettings(): Promise<UserSettings | null> {
  const { user } = await getSession()
  if (!user) return null

  try {
    const settings = await db.select().from(userSettings).where(eq(userSettings.userId, user.id))

    if (settings.length === 0) {
      return {
        userId: user.id,
        notificationsEnabled: true,
        emailAlerts: true,
        darkMode: false,
        language: "en",
        timezone: "UTC",
        defaultScanType: "X-Ray"
      } as any
    }

    return settings[0] as any
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
  const { user } = await getSession()
  if (!user) return { success: false, error: "Unauthorized" }

  try {
    const existingSettings = await db.select().from(userSettings).where(eq(userSettings.userId, user.id))

    if (existingSettings.length === 0) {
      await db.insert(userSettings).values({
        userId: user.id,
        notificationsEnabled: data.notificationsEnabled ?? true,
        emailAlerts: data.emailAlerts ?? true,
        darkMode: data.darkMode ?? false,
        language: data.language || "en",
        timezone: data.timezone || "UTC",
        defaultScanType: data.defaultScanType || "X-Ray"
      })
    } else {
      await db.update(userSettings)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(userSettings.userId, user.id))
    }

    await logActivity("Settings updated", "system", data)
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error updating settings:", error)
    return { success: false, error: "Database error" }
  }
}

import bcrypt from "bcryptjs"
import { users } from "@/lib/schema"

export async function updateProfile(data: {
  name?: string
  email?: string
}): Promise<{ success: boolean; error?: string }> {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Unauthorized" }

  try {
    await db.update(users)
      .set({
        name: data.name,
        email: data.email,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))

    await logActivity("Profile updated", "system", { updatedFields: Object.keys(data) })
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error updating profile:", error)
    return { success: false, error: "Database error" }
  }
}

export async function changePassword(data: {
  currentPassword: string
  newPassword: string
}): Promise<{ success: boolean; error?: string }> {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Unauthorized" }

  try {
    // 1. Fetch current user with password hash
    const currentUser = await db.select().from(users).where(eq(users.id, user.id)).limit(1)

    if (currentUser.length === 0) {
      return { success: false, error: "User not found" }
    }

    // 2. Verify current password
    const isValid = await bcrypt.compare(data.currentPassword, currentUser[0].passwordHash)

    if (!isValid) {
      return { success: false, error: "Incorrect current password" }
    }

    // 3. Hash new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(data.newPassword, salt)

    // 4. Update password in DB
    await db.update(users)
      .set({
        passwordHash: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))

    await logActivity("Password changed", "system", {})
    return { success: true }
  } catch (error) {
    console.error("Error changing password:", error)
    return { success: false, error: "Database error" }
  }
}

// Helper to get raw token for Authorization header
import { cookies } from "next/headers"
async function getSessionToken() {
  const cookieStore = await cookies()
  return cookieStore.get("auth_token")?.value || ""
}
