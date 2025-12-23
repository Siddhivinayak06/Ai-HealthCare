import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, password } = body;

        if (!token || !password) {
            return NextResponse.json(
                { message: "Invalid request" },
                { status: 400 }
            );
        }

        // Hash the token from URL to compare with stored hash
        const resetPasswordToken = createHash("sha256")
            .update(token)
            .digest("hex");

        const userResult = await db
            .select()
            .from(users)
            .where(eq(users.resetPasswordToken, resetPasswordToken));

        const user = userResult[0];

        if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
            return NextResponse.json(
                { message: "Invalid or expired token" },
                { status: 400 }
            );
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password and clear reset fields
        await db
            .update(users)
            .set({
                passwordHash: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
                updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));

        return NextResponse.json({ success: true, data: "Password updated" });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json(
            { message: "Server error" },
            { status: 500 }
        );
    }
}
