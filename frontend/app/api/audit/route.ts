import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { requireRole, authErrorResponse } from "@/lib/auth";

// Doctor-only route for viewing AI audit logs
export async function GET(request: NextRequest) {
    try {
        // Require doctor role for audit log access
        await requireRole(["doctor"]);

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const entityType = searchParams.get("entityType");

        let query = db
            .select({
                id: auditLogs.id,
                userId: auditLogs.userId,
                action: auditLogs.action,
                entityType: auditLogs.entityType,
                entityId: auditLogs.entityId,
                findings: auditLogs.findings,
                confidenceScore: auditLogs.confidenceScore,
                doctorOverride: auditLogs.doctorOverride,
                overrideReason: auditLogs.overrideReason,
                feedback: auditLogs.feedback,
                createdAt: auditLogs.createdAt,
                userName: users.name,
                userEmail: users.email,
            })
            .from(auditLogs)
            .leftJoin(users, eq(auditLogs.userId, users.id))
            .orderBy(desc(auditLogs.createdAt))
            .limit(limit);

        const result = await query;
        return NextResponse.json(result);
    } catch (error) {
        return authErrorResponse(error);
    }
}

// Record doctor override of AI prediction
export async function POST(request: NextRequest) {
    try {
        const user = await requireRole(["doctor"]);
        const body = await request.json();

        const { entityType, entityId, overrideReason, feedback, originalFindings } = body;

        const result = await db
            .insert(auditLogs)
            .values({
                userId: user.id,
                action: "OVERRIDE",
                entityType,
                entityId,
                findings: originalFindings,
                doctorOverride: true,
                overrideReason,
                feedback,
            })
            .returning();

        return NextResponse.json(result[0], { status: 201 });
    } catch (error) {
        return authErrorResponse(error);
    }
}
