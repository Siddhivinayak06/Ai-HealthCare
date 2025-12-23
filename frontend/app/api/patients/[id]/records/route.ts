import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { patients, healthRecords } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, authErrorResponse } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await requireAuth();
        const { id: patientId } = await params;

        // Verify patient ownership
        const patientCheck = await db
            .select()
            .from(patients)
            .where(and(eq(patients.id, patientId), eq(patients.userId, user.id)));

        if (patientCheck.length === 0) {
            return NextResponse.json(
                { message: "Patient not found" },
                { status: 404 }
            );
        }

        const result = await db
            .select()
            .from(healthRecords)
            .where(eq(healthRecords.patientId, patientId))
            .orderBy(desc(healthRecords.recordDate));

        return NextResponse.json(result);
    } catch (error) {
        return authErrorResponse(error);
    }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await requireAuth();
        const { id: patientId } = await params;
        const body = await request.json();

        // Verify patient ownership
        const patientCheck = await db
            .select()
            .from(patients)
            .where(and(eq(patients.id, patientId), eq(patients.userId, user.id)));

        if (patientCheck.length === 0) {
            return NextResponse.json(
                { message: "Patient not found" },
                { status: 404 }
            );
        }

        const {
            weightKg,
            heightCm,
            bloodPressureSystolic,
            bloodPressureDiastolic,
            heartRate,
            temperatureCelsius,
            oxygenSaturation,
            bloodSugar,
            cholesterolTotal,
            cholesterolHdl,
            cholesterolLdl,
            smokingStatus,
            alcoholConsumption,
            exerciseFrequency,
            notes,
        } = body;

        const result = await db
            .insert(healthRecords)
            .values({
                patientId,
                recordedBy: user.id,
                weightKg,
                heightCm,
                bloodPressureSystolic,
                bloodPressureDiastolic,
                heartRate,
                temperatureCelsius,
                oxygenSaturation,
                bloodSugar,
                cholesterolTotal,
                cholesterolHdl,
                cholesterolLdl,
                smokingStatus,
                alcoholConsumption,
                exerciseFrequency,
                notes,
            })
            .returning();

        return NextResponse.json(result[0], { status: 201 });
    } catch (error) {
        return authErrorResponse(error);
    }
}
