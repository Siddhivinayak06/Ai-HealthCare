import { db } from "@/lib/db";
import { scans, riskPredictions } from "@/lib/schema";
import { requireAuth, authErrorResponse } from "@/lib/auth";
import { eq, sql, and, gte, lte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();

        // Get data for the current year
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        // Query scans count by month
        const scanStats = await db
            .select({
                month: sql<number>`EXTRACT(MONTH FROM ${scans.createdAt})`,
                count: sql<number>`count(*)`
            })
            .from(scans)
            .where(
                and(
                    eq(scans.uploadedBy, user.id),
                    gte(scans.createdAt, startOfYear)
                )
            )
            .groupBy(sql`EXTRACT(MONTH FROM ${scans.createdAt})`);

        // Query risk predictions count by month
        const predictionStats = await db
            .select({
                month: sql<number>`EXTRACT(MONTH FROM ${riskPredictions.createdAt})`,
                count: sql<number>`count(*)`
            })
            .from(riskPredictions)
            .where(
                and(
                    eq(riskPredictions.userId, user.id),
                    gte(riskPredictions.createdAt, startOfYear)
                )
            )
            .groupBy(sql`EXTRACT(MONTH FROM ${riskPredictions.createdAt})`);

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // Map stats to the 12 months
        const analytics = months.map((month, index) => {
            const monthNum = index + 1;
            const scanCount = scanStats.find(s => Number(s.month) === monthNum)?.count || 0;
            const predCount = predictionStats.find(p => Number(p.month) === monthNum)?.count || 0;

            return {
                month,
                analyses: Number(scanCount),
                predictions: Number(predCount),
            };
        });

        return NextResponse.json(analytics);
    } catch (error) {
        return authErrorResponse(error);
    }
}
