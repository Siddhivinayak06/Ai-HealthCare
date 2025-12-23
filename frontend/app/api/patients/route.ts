import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { patients, healthRecords } from "@/lib/schema";
import { eq, or, ilike, and, desc } from "drizzle-orm";
import { requireAuth, authErrorResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("query");

        let whereClause = eq(patients.userId, user.id);

        if (query) {
            whereClause = and(
                whereClause,
                or(
                    ilike(patients.firstName, `%${query}%`),
                    ilike(patients.lastName, `%${query}%`),
                    ilike(patients.email, `%${query}%`)
                )
            ) as typeof whereClause;
        }

        let selectQuery = db
            .select()
            .from(patients)
            .where(whereClause)
            .orderBy(desc(patients.createdAt));

        if (query) {
            selectQuery = selectQuery.limit(20) as typeof selectQuery;
        }

        const result = await selectQuery;
        return NextResponse.json(result);
    } catch (error) {
        return authErrorResponse(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
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

        // For patients, check if profile already exists
        if (user.role === "patient") {
            const existing = await db
                .select()
                .from(patients)
                .where(eq(patients.userId, user.id));

            if (existing.length > 0) {
                return NextResponse.json(
                    { message: "Patient profile already exists" },
                    { status: 400 }
                );
            }
        }

        const result = await db
            .insert(patients)
            .values({
                userId: user.id,
                firstName,
                lastName,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                gender,
                email,
                phone,
                address,
                emergencyContactName,
                emergencyContactPhone,
                bloodType,
                allergies,
                medicalConditions,
            })
            .returning();

        return NextResponse.json(result[0], { status: 201 });
    } catch (error) {
        return authErrorResponse(error);
    }
}
