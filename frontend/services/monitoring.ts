import { db } from "@/lib/db";
import { modelVersions, auditLogs } from "@/lib/schema";
import { desc, sql } from "drizzle-orm";

export const getModelMetrics = async () => {
    const versions = await db
        .select()
        .from(modelVersions)
        .orderBy(desc(modelVersions.createdAt));

    // Simple drift detection: compare feedback vs AI predictions
    const stats = await db.select({
        total: sql<number>`count(*)`,
        overrides: sql<number>`sum(case when doctor_override = true then 1 else 0 end)`,
        avgConfidence: sql<number>`avg(confidence_score)`
    }).from(auditLogs);

    return {
        versions,
        summary: stats[0]
    };
};
