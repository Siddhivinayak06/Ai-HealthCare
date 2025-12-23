"use server"

import { db } from "@/lib/db"
import { prescriptions } from "@/lib/schema"
import { eq, desc } from "drizzle-orm"
import { getSession } from "@/lib/auth"

async function requireUser() {
    const { user } = await getSession()
    if (!user) {
        throw new Error("Unauthorized")
    }
    return user
}

export async function getPatientPrescriptions(patientId: string) {
    try {
        await requireUser()

        const result = await db
            .select()
            .from(prescriptions)
            .where(eq(prescriptions.patientId, patientId))
            .orderBy(desc(prescriptions.createdAt))

        return result
    } catch (error) {
        console.error("Get prescriptions error:", error)
        return []
    }
}
