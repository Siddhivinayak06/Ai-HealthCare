import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { imageAnalyses, auditLogs } from "@/lib/schema";
import { requireAuth, authErrorResponse } from "@/lib/auth";
import { triageCase } from "@/services/triage";

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();

        const {
            patientId,
            scanType,
            imageUrl,
            diagnosis,
            confidence,
            severity,
            findings,
            recommendations,
            processingTime,
            modelVersion,
            confidence_metrics,
        } = body;

        // Save the analysis
        const result = await db
            .insert(imageAnalyses)
            .values({
                userId: user.id,
                patientId: patientId || null,
                scanType,
                imageUrl: imageUrl || null,
                diagnosis,
                confidence: confidence ? confidence.toString() : null,
                severity,
                findings,
                recommendations,
                processingTime: processingTime ? processingTime.toString() : null,
                modelVersion,
            })
            .returning();

        const newAnalysis = result[0];

        // Perform AI Triage
        const triageResult = triageCase({
            severity,
            confidence_metrics,
            diagnosis,
        });

        // Record in Audit Log for Governance
        await db.insert(auditLogs).values({
            userId: user.id,
            action: "PREDICTION",
            entityType: "IMAGE_ANALYSIS",
            entityId: newAnalysis.id,
            findings: findings,
            confidenceScore: confidence ? confidence.toString() : null,
            doctorOverride: false,
        });

        return NextResponse.json(
            { ...newAnalysis, triage: triageResult },
            { status: 201 }
        );
    } catch (error) {
        return authErrorResponse(error);
    }
}
