import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { patients, imageAnalyses, riskPredictions } from "@/lib/schema";
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

        // Get analysis count for this user
        const analysisResult = await db
            .select({ count: count() })
            .from(imageAnalyses)
            .where(eq(imageAnalyses.userId, user.id));

        // Get recent analyses (last 30 days)
        const recentAnalysesResult = await db
            .select({ count: count() })
            .from(imageAnalyses)
            .where(
                and(
                    eq(imageAnalyses.userId, user.id),
                    gte(imageAnalyses.createdAt, thirtyDaysAgo)
                )
            );

        // Get risk prediction count
        const predictionResult = await db
            .select({ count: count() })
            .from(riskPredictions)
            .where(eq(riskPredictions.userId, user.id));

        return NextResponse.json({
            totalPatients: patientResult[0]?.count || 0,
            totalAnalyses: analysisResult[0]?.count || 0,
            recentAnalyses: recentAnalysesResult[0]?.count || 0,
            totalPredictions: predictionResult[0]?.count || 0,
        });
    } catch (error) {
        return authErrorResponse(error);
    }
}
