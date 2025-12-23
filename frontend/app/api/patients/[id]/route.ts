import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { patients } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, authErrorResponse } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await requireAuth();
        const { id } = await params;

        const result = await db
            .select()
            .from(patients)
            .where(and(eq(patients.id, id), eq(patients.userId, user.id)));

        if (result.length === 0) {
            return NextResponse.json(
                { message: "Patient not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(result[0]);
    } catch (error) {
        return authErrorResponse(error);
    }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await requireAuth();
        const { id } = await params;
        const body = await request.json();

        const {
            firstName,
            lastName,
            dateOfBirth,
            gender,
            email,
            phone,
            address,
            emergencyContactName,
            emergencyContactPhone,
            bloodType,
            allergies,
            medicalConditions,
        } = body;

        const result = await db
            .update(patients)
            .set({
                firstName,
                lastName,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                gender,
                email,
                phone,
                address,
                emergencyContactName,
                emergencyContactPhone,
                bloodType,
                allergies,
                medicalConditions,
                updatedAt: new Date(),
            })
            .where(and(eq(patients.id, id), eq(patients.userId, user.id)))
            .returning();

        if (result.length === 0) {
            return NextResponse.json(
                { message: "Patient not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(result[0]);
    } catch (error) {
        return authErrorResponse(error);
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await requireAuth();
        const { id } = await params;

        const result = await db
            .delete(patients)
            .where(and(eq(patients.id, id), eq(patients.userId, user.id)))
            .returning({ id: patients.id });

        if (result.length === 0) {
            return NextResponse.json(
                { message: "Patient not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: "Patient removed" });
    } catch (error) {
        return authErrorResponse(error);
    }
}
