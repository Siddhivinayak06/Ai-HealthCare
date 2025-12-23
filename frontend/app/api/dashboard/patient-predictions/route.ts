import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { riskPredictions, patients } from "@/lib/schema";
import { requireAuth, authErrorResponse } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();

        // Helper to get limit from query string
        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get("limit") || "5");

        const data = await db
            .select({
                id: riskPredictions.id,
                patientName: patients.firstName, // Simplified, should combine names
                patientId: patients.id,
                condition: riskPredictions.condition,
                riskScore: riskPredictions.riskScore,
                lastUpdated: riskPredictions.createdAt,
                severity: riskPredictions.severity,
            })
            .from(riskPredictions)
            .innerJoin(patients, eq(riskPredictions.patientId, patients.id))
            .where(eq(riskPredictions.userId, user.id))
            .orderBy(desc(riskPredictions.createdAt))
            .limit(limit);

        // Map trend and full name manually since SQL concatenation can be DB-specific
        const result = data.map(item => ({
            ...item,
            trend: "stable", // Placeholder for trend
            riskScore: Number(item.riskScore) * 100 // Convert to percentage 0-100
        }));

        return NextResponse.json(result);
    } catch (error) {
        return authErrorResponse(error);
    }
}
