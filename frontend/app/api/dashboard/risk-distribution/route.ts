import { db } from "@/lib/db";
import { diagnoses, scans } from "@/lib/schema";
import { requireAuth, authErrorResponse } from "@/lib/auth";
import { eq, sql, and, gte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();

        // Get data for the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const stats = await db
            .select({
                month: sql<number>`EXTRACT(MONTH FROM ${diagnoses.createdAt})`,
                riskLevel: diagnoses.riskLevel,
                count: sql<number>`count(*)`
            })
            .from(diagnoses)
            .innerJoin(scans, eq(diagnoses.scanId, scans.id))
            .where(
                and(
                    eq(scans.uploadedBy, user.id),
                    gte(diagnoses.createdAt, sixMonthsAgo)
                )
            )
            .groupBy(
                sql`EXTRACT(MONTH FROM ${diagnoses.createdAt})`,
                diagnoses.riskLevel
            );

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // Post-process to group by month
        const monthlyData: Record<string, any> = {};

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const m = monthNames[d.getMonth()];
            monthlyData[m] = { month: m, low: 0, moderate: 0, high: 0, critical: 0 };
        }

        stats.forEach(s => {
            const m = monthNames[Number(s.month) - 1];
            if (monthlyData[m]) {
                const level = (s.riskLevel || "Low").toLowerCase();
                if (level in monthlyData[m]) {
                    monthlyData[m][level] += Number(s.count);
                }
            }
        });

        return NextResponse.json(Object.values(monthlyData));
    } catch (error) {
        return authErrorResponse(error);
    }
}
