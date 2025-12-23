"use server";

import { db } from "@/lib/db";
import { activityLog } from "@/lib/schema";
import { getSession } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export async function logActivity(action: string, actionType: string, details: Record<string, unknown> = {}) {
  const { user } = await getSession();
  if (!user) return;

  try {
    await db.insert(activityLog).values({
      userId: user.id,
      action,
      actionType,
      details,
    });
  } catch (error) {
    console.error("Activity Log Error:", error);
  }
}

export async function getAllActivity() {
  const { user } = await getSession();
  if (!user) return [];

  try {
    return await db
      .select()
      .from(activityLog)
      .where(eq(activityLog.userId, user.id))
      .orderBy(desc(activityLog.createdAt))
      .limit(50);
  } catch (error) {
    console.error("Get Activity Error:", error);
    return [];
  }
}
