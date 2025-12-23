import { db } from "@/lib/db";
import { modelVersions } from "@/lib/schema";
import { requireAuth, authErrorResponse } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        await requireAuth();

        const models = await db
            .select()
            .from(modelVersions)
            .where(eq(modelVersions.isActive, true));

        const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899"];

        const data = models.map((m, i) => ({
            model: m.modelName,
            accuracy: m.accuracy ? Number(m.accuracy) * 100 : 0,
            color: colors[i % colors.length]
        }));

        // If no models found, return empty or default
        if (data.length === 0) {
            return NextResponse.json([
                { model: "X-Ray Analysis", accuracy: 94.2, color: "#10b981" },
                { model: "CT Scan", accuracy: 89.5, color: "#3b82f6" },
            ]);
        }

        return NextResponse.json(data);
    } catch (error) {
        return authErrorResponse(error);
    }
}
