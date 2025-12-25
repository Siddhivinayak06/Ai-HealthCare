"use server";

import { db } from "@/lib/db";
import { appointments, patients, users } from "@/lib/schema";
import { eq, and, desc, or, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getAppointments() {
    const { user } = await getSession();
    if (!user) throw new Error("Unauthorized");

    try {
        if (user.role === "doctor") {
            return await db
                .select({
                    id: appointments.id,
                    title: appointments.title,
                    startTime: appointments.startTime,
                    endTime: appointments.endTime,
                    status: appointments.status,
                    type: appointments.type,
                    notes: appointments.notes,
                    patientName: sql<string>`${patients.firstName} || ' ' || ${patients.lastName}`,
                })
                .from(appointments)
                .leftJoin(patients, eq(appointments.patientId, patients.id))
                .where(eq(appointments.userId, user.id))
                .orderBy(desc(appointments.startTime));
        } else {
            // Patient view - find their patient record first
            const patientRecord = await db.query.patients.findFirst({
                where: eq(patients.userId, user.id)
            });

            if (!patientRecord) return [];

            return await db
                .select({
                    id: appointments.id,
                    title: appointments.title,
                    startTime: appointments.startTime,
                    endTime: appointments.endTime,
                    status: appointments.status,
                    type: appointments.type,
                    notes: appointments.notes,
                    doctorName: users.name,
                })
                .from(appointments)
                .leftJoin(users, eq(appointments.userId, users.id))
                .where(eq(appointments.patientId, patientRecord.id))
                .orderBy(desc(appointments.startTime));
        }
    } catch (error) {
        console.error("Error fetching appointments:", error);
        return [];
    }
}

export async function createAppointment(data: {
    patientId: string;
    userId: string; // Doctor ID
    title: string;
    startTime: string;
    endTime: string;
    type?: string;
    notes?: string;
}) {
    const { user } = await getSession();
    if (!user) throw new Error("Unauthorized");

    try {
        const result = await db.insert(appointments).values({
            userId: data.userId,
            patientId: data.patientId,
            title: data.title,
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime),
            type: data.type || "checkup",
            notes: data.notes,
            status: "scheduled"
        }).returning();

        revalidatePath("/appointments");
        return { success: true, data: result[0] };
    } catch (error) {
        console.error("Error creating appointment:", error);
        return { success: false, error: "Failed to create appointment" };
    }
}

export async function updateAppointmentStatus(id: string, status: string) {
    const { user } = await getSession();
    if (!user) throw new Error("Unauthorized");

    try {
        await db.update(appointments)
            .set({
                status: status as any,
                updatedAt: new Date()
            })
            .where(eq(appointments.id, id));

        revalidatePath("/appointments");
        return { success: true };
    } catch (error) {
        console.error("Error updating appointment:", error);
        return { success: false, error: "Failed to update status" };
    }
}

export async function getDoctorsList() {
    try {
        return await db.select({
            id: users.id,
            name: users.name,
            email: users.email
        })
            .from(users)
            .where(eq(users.role, "doctor"));
    } catch (error) {
        console.error("Error fetching doctors:", error);
        return [];
    }
}

