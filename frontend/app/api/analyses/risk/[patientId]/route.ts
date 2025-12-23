import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { riskPredictions } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, authErrorResponse } from "@/lib/auth";

type RouteParams = { params: Promise<{ patientId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await requireAuth();
        const { patientId } = await params;

        const result = await db
            .select()
            .from(riskPredictions)
            .where(
                and(
                    eq(riskPredictions.patientId, patientId),
                    eq(riskPredictions.userId, user.id)
                )
            )
            .orderBy(desc(riskPredictions.createdAt));

        return NextResponse.json(result);
    } catch (error) {
        return authErrorResponse(error);
    }
}
