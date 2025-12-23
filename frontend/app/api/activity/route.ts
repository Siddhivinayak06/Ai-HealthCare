import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activityLog } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, authErrorResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "20");

        const result = await db
            .select()
            .from(activityLog)
            .where(eq(activityLog.userId, user.id))
            .orderBy(desc(activityLog.createdAt))
            .limit(limit);

        return NextResponse.json(result);
    } catch (error) {
        return authErrorResponse(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();

        const { action, actionType, details } = body;

        const result = await db
            .insert(activityLog)
            .values({
                userId: user.id,
                action,
                actionType,
                details,
            })
            .returning();

        return NextResponse.json(result[0], { status: 201 });
    } catch (error) {
        return authErrorResponse(error);
    }
}
