import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { riskPredictions, activityLog } from "@/lib/schema";
import { requireAuth, authErrorResponse } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();

        const {
            patientId,
            healthRecordId,
            condition,
            riskScore,
            severity,
            contributingFactors,
            recommendations,
        } = body;

        await db.insert(riskPredictions).values({
            userId: user.id,
            patientId,
            healthRecordId: healthRecordId || null,
            condition,
            riskScore: riskScore ? riskScore.toString() : null,
            severity,
            contributingFactors,
            recommendations,
            modelVersion: "HealthPredict v2.1",
        });

        // Log activity
        await db.insert(activityLog).values({
            userId: user.id,
            action: "Risk prediction generated",
            actionType: "prediction",
            details: { patientId, condition, riskScore },
        });

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        return authErrorResponse(error);
    }
}
