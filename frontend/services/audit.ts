import { db } from "@/lib/db";
import { auditLogs } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

export const getAuditLogs = async (limit = 100) => {
    return await db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);
};

export const createAuditLog = async (data: {
    userId?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    findings?: any;
    confidenceScore?: string | number;
    doctorOverride?: boolean;
    overrideReason?: string;
    feedback?: string;
}) => {
    const result = await db.insert(auditLogs).values({
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        findings: data.findings,
        confidenceScore: data.confidenceScore?.toString(),
        doctorOverride: data.doctorOverride,
        overrideReason: data.overrideReason,
        feedback: data.feedback,
    }).returning();

    return result[0];
};

export const updateAuditLog = async (id: string, data: {
    feedback?: string;
    doctorOverride?: boolean;
    overrideReason?: string;
}) => {
    const result = await db
        .update(auditLogs)
        .set({
            ...data,
            // updatedAt: new Date(), // If we add updatedAt to schema
        })
        .where(eq(auditLogs.id, id))
        .returning();

    return result[0];
};
