"use server"

import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function getUserProfile() {
    try {
        const { user: sessionUser } = await getSession()
        if (!sessionUser) return null

        const result = await db
            .select({
                id: users.id,
                email: users.email,
                name: users.name,
                role: users.role,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
            })
            .from(users)
            .where(eq(users.id, sessionUser.id));

        if (result.length === 0) return null

        return {
            id: result[0].id,
            email: result[0].email,
            name: result[0].name,
            role: result[0].role,
            created_at: result[0].createdAt?.toISOString(),
            updated_at: result[0].updatedAt?.toISOString(),
        }
    } catch (error) {
        console.error("Get profile error:", error)
        return null
    }
}

export async function updateUserProfile(data: { name: string; email: string }) {
    try {
        const { user } = await getSession()
        if (!user) return { error: "Not authenticated" }

        await db.update(users)
            .set({
                name: data.name,
                email: data.email,
                updatedAt: new Date(),
            })
            .where(eq(users.id, user.id))

        revalidatePath("/profile")
        revalidatePath("/settings")
        return { success: true, user: { name: data.name, email: data.email } }
    } catch (error) {
        console.error("Update profile error:", error)
        return { error: "Failed to update profile" }
    }
}

export async function changePassword(data: { currentPassword: string; newPassword: string }) {
    try {
        const { user } = await getSession()
        if (!user) return { error: "Not authenticated" }

        // 1. Fetch current user with password hash
        const currentUser = await db.select().from(users).where(eq(users.id, user.id)).limit(1)
        if (currentUser.length === 0) return { error: "User not found" }

        // 2. Verify current password
        const isValid = await bcrypt.compare(data.currentPassword, currentUser[0].passwordHash)
        if (!isValid) return { error: "Incorrect current password" }

        // 3. Hash new password and update
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(data.newPassword, salt)

        await db.update(users)
            .set({
                passwordHash: hashedPassword,
                updatedAt: new Date(),
            })
            .where(eq(users.id, user.id))

        return { success: true, message: "Password updated successfully" }
    } catch (error) {
        console.error("Change password error:", error)
        return { error: "Failed to change password" }
    }
}
