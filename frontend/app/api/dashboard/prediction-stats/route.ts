import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { riskPredictions } from "@/lib/schema";
import { requireAuth, authErrorResponse } from "@/lib/auth";
import { eq, count, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();

        const stats = await db
            .select({ count: count() })
            .from(riskPredictions)
            .where(eq(riskPredictions.userId, user.id));

        const highRisk = await db
            .select({ count: count() })
            .from(riskPredictions)
            .where(
                and(
                    eq(riskPredictions.userId, user.id),
                    eq(riskPredictions.severity, "High")
                )
            );

        return NextResponse.json({
            activePredictions: stats[0]?.count || 0,
            accuracyRate: 92.5, // Mocked for now (needs feedback loop)
            highRiskPatients: highRisk[0]?.count || 0,
            predictionsToday: 5, // Mocked
            predictionsThisWeek: 24 // Mocked
        });
    } catch (error) {
        return authErrorResponse(error);
    }
}
