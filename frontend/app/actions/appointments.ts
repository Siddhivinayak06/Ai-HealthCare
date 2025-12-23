"use server"

import { db } from "@/lib/db"
import { appointments, users } from "@/lib/schema"
import { eq, and, gte, lte, desc } from "drizzle-orm"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { logActivity } from "./activity"

async function requireUser() {
    const { user } = await getSession()
    if (!user) {
        throw new Error("Unauthorized")
    }
    return user
}

export async function getDoctorsList() {
    try {
        await requireUser()
        const result = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email
            })
            .from(users)
            .where(eq(users.role, "doctor"))

        return result
    } catch (error) {
        console.error("Get doctors error:", error)
        return []
    }
}

export async function getAppointments(startDate?: string, endDate?: string) {
    try {
        const user = await requireUser()

        let query = db.select().from(appointments).$dynamic()

        const filters = []
        if (user.role === "patient") {
            filters.push(eq(appointments.userId, user.id))
        }

        if (startDate) {
            filters.push(gte(appointments.startTime, new Date(startDate)))
        }

        if (endDate) {
            filters.push(lte(appointments.endTime, new Date(endDate)))
        }

        if (filters.length > 0) {
            query = query.where(and(...filters))
        }

        const result = await query.orderBy(desc(appointments.startTime))
        return result
    } catch (error) {
        console.error("Get appointments error:", error)
        return []
    }
}

export async function createAppointment(data: {
    patientId: string
    title: string
    startTime: string
    endTime: string
    notes?: string
    type?: string
}) {
    try {
        const user = await requireUser()

        const result = await db.insert(appointments).values({
            userId: user.id,
            patientId: data.patientId,
            title: data.title,
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime),
            notes: data.notes,
            type: data.type || "checkup",
            status: "scheduled"
        }).returning()

        await logActivity("Appointment scheduled", "appointment", {
            appointmentId: result[0].id,
            title: data.title
        })

        revalidatePath("/appointments")
        return { success: true, appointment: result[0] }
    } catch (error) {
        console.error("Create appointment error:", error)
        return { error: "Failed to create appointment" }
    }
}

export async function updateAppointment(id: string, data: any) {
    try {
        await requireUser()

        const result = await db
            .update(appointments)
            .set({
                ...data,
                startTime: data.startTime ? new Date(data.startTime) : undefined,
                endTime: data.endTime ? new Date(data.endTime) : undefined,
                updatedAt: new Date()
            })
            .where(eq(appointments.id, id))
            .returning()

        revalidatePath("/appointments")
        return { success: true, appointment: result[0] }
    } catch (error) {
        console.error("Update appointment error:", error)
        return { error: "Failed to update appointment" }
    }
}
