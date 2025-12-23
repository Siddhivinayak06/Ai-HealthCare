import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { imageAnalyses, riskPredictions } from "@/lib/schema";
import { requireAuth, authErrorResponse } from "@/lib/auth";
import { eq, sql, and, gte } from "drizzle-orm";

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();

        // Check if data exists for this user
        // Note: For now, returning mocked trend data to populate the chart
        // In a real app, this would aggregate `imageAnalyses` and `riskPredictions` by month

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // Mock data structure - typically you'd query DB with GROUP BY month
        const analytics = months.map(month => ({
            month,
            analyses: Math.floor(Math.random() * 50) + 10,
            predictions: Math.floor(Math.random() * 40) + 5,
        }));

        return NextResponse.json(analytics);
    } catch (error) {
        return authErrorResponse(error);
    }
}
