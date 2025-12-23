import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { imageAnalyses, patients } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, authErrorResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "10");

        const result = await db
            .select({
                id: imageAnalyses.id,
                userId: imageAnalyses.userId,
                patientId: imageAnalyses.patientId,
                scanType: imageAnalyses.scanType,
                imageUrl: imageAnalyses.imageUrl,
                diagnosis: imageAnalyses.diagnosis,
                confidence: imageAnalyses.confidence,
                severity: imageAnalyses.severity,
                findings: imageAnalyses.findings,
                recommendations: imageAnalyses.recommendations,
                processingTime: imageAnalyses.processingTime,
                modelVersion: imageAnalyses.modelVersion,
                createdAt: imageAnalyses.createdAt,
                firstName: patients.firstName,
                lastName: patients.lastName,
            })
            .from(imageAnalyses)
            .leftJoin(patients, eq(imageAnalyses.patientId, patients.id))
            .where(eq(imageAnalyses.userId, user.id))
            .orderBy(desc(imageAnalyses.createdAt))
            .limit(limit);

        return NextResponse.json(result);
    } catch (error) {
        return authErrorResponse(error);
    }
}
