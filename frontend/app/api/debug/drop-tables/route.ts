import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        await db.execute(sql`DROP TABLE IF EXISTS "image_analyses" CASCADE`);
        return NextResponse.json({ success: true, message: "Dropped image_analyses table" });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
