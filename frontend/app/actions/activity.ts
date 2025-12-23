"use server";

import { db } from "@/lib/db";
import { activityLog } from "@/lib/schema";
import { getSession } from "@/lib/auth";

export async function logActivity(action: string, actionType: string, details: any = {}) {
  const session = await getSession();
  if (!session) return;

  try {
    await db.insert(activityLog).values({
      userId: session.id,
      action,
      actionType,
      details,
    });
  } catch (error) {
    console.error("Activity Log Error:", error);
  }
}
