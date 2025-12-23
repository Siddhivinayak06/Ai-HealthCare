import { db } from "@/lib/db";
import { riskPredictions, modelVersions, diagnoses, scans } from "@/lib/schema";
import { requireAuth, authErrorResponse } from "@/lib/auth";
import { eq, count, and, gte, avg } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // General stats
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

        // Calculate average accuracy from models
        const modelStats = await db
            .select({ avgAccuracy: avg(modelVersions.accuracy) })
            .from(modelVersions)
            .where(eq(modelVersions.isActive, true));

        // Get today's counts (from both images and risk)
        const scansToday = await db
            .select({ count: count() })
            .from(scans)
            .where(and(eq(scans.uploadedBy, user.id), gte(scans.createdAt, today)));

        const risksToday = await db
            .select({ count: count() })
            .from(riskPredictions)
            .where(and(eq(riskPredictions.userId, user.id), gte(riskPredictions.createdAt, today)));

        // Get this week's counts
        const scansWeek = await db
            .select({ count: count() })
            .from(scans)
            .where(and(eq(scans.uploadedBy, user.id), gte(scans.createdAt, weekAgo)));

        const risksWeek = await db
            .select({ count: count() })
            .from(riskPredictions)
            .where(and(eq(riskPredictions.userId, user.id), gte(riskPredictions.createdAt, weekAgo)));

        return NextResponse.json({
            activePredictions: stats[0]?.count || 0,
            accuracyRate: modelStats[0]?.avgAccuracy ? Number(modelStats[0]?.avgAccuracy) * 100 : 92.5,
            highRiskPatients: highRisk[0]?.count || 0,
            predictionsToday: (scansToday[0]?.count || 0) + (risksToday[0]?.count || 0),
            predictionsThisWeek: (scansWeek[0]?.count || 0) + (risksWeek[0]?.count || 0)
        });
    } catch (error) {
        return authErrorResponse(error);
    }
}
