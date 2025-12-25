import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { patients, scans, riskPredictions } from "@/lib/schema";
import { eq, count, gte, and } from "drizzle-orm";
import { requireAuth, authErrorResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();

        // Get date range (last 30 days by default)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get patient count for this user
        const patientResult = await db
            .select({ count: count() })
            .from(patients)
            .where(eq(patients.userId, user.id));

        // Get scan count for this user
        const scanResult = await db
            .select({ count: count() })
            .from(scans)
            .where(eq(scans.uploadedBy, user.id));

        // Get recent scans (last 30 days)
        const recentScansResult = await db
            .select({ count: count() })
            .from(scans)
            .where(
                and(
                    eq(scans.uploadedBy, user.id),
                    gte(scans.createdAt, thirtyDaysAgo)
                )
            );

        // Get risk prediction count
        const predictionResult = await db
            .select({ count: count() })
            .from(riskPredictions)
            .where(eq(riskPredictions.userId, user.id));

        return NextResponse.json({
            totalPatients: patientResult[0]?.count || 0,
            totalAnalyses: scanResult[0]?.count || 0,
            recentAnalyses: recentScansResult[0]?.count || 0,
            totalPredictions: predictionResult[0]?.count || 0,
        });
    } catch (error) {
        return authErrorResponse(error);
    }
}
