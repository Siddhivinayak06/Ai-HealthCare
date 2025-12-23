import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { requireAuth, authErrorResponse } from "@/lib/auth";

export async function GET() {
    try {
        await requireAuth();

        const result = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
            })
            .from(users)
            .where(eq(users.role, "doctor"));

        return NextResponse.json(result);
    } catch (error) {
        return authErrorResponse(error);
    }
}
