import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { riskPredictions } from "@/lib/schema";
import { requireAuth, authErrorResponse } from "@/lib/auth";
import { eq, sql, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();

        // Get conditions breakdown from risk predictions
        const conditions = await db
            .select({
                condition: riskPredictions.condition,
                count: sql<number>`cast(count(*) as int)`,
            })
            .from(riskPredictions)
            .where(eq(riskPredictions.userId, user.id))
            .groupBy(riskPredictions.condition)
            .orderBy(desc(sql`count(*)`))
            .limit(5);

        // Fallback for empty data
        if (conditions.length === 0) {
            return NextResponse.json([
                { condition: "Normal", count: 4, percentage: 40, color: "#10b981" },
                { condition: "Pneumonia", count: 2, percentage: 20, color: "#f59e0b" },
                { condition: "Covid-19", count: 1, percentage: 10, color: "#ef4444" },
                { condition: "Tuberculosis", count: 1, percentage: 10, color: "#8b5cf6" },
                { condition: "Other", count: 2, percentage: 20, color: "#6b7280" },
            ]);
        }

        // Calculate total for percentage
        const total = conditions.reduce((sum, item) => sum + item.count, 0);

        // Add color and percentage
        const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];

        const result = conditions.map((item, index) => ({
            ...item,
            percentage: Math.round((item.count / total) * 100),
            color: colors[index % colors.length]
        }));

        return NextResponse.json(result);
    } catch (error) {
        return authErrorResponse(error);
    }
}
