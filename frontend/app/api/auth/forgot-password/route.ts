import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";
import { sendEmail } from "@/lib/mail";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { message: "Please provide email" },
                { status: 400 }
            );
        }

        const userResult = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase()));

        const user = userResult[0];

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        // Generate reset token
        const resetToken = randomBytes(20).toString("hex");

        // Hash token for storage
        const resetPasswordToken = createHash("sha256")
            .update(resetToken)
            .digest("hex");

        // Set expire (10 minutes)
        const resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);

        await db
            .update(users)
            .set({
                resetPasswordToken,
                resetPasswordExpires,
            })
            .where(eq(users.id, user.id));

        // Create reset URL
        const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password.\n\nPlease click on the following link to reset your password:\n\n${resetUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: "Password Reset Token",
                message,
                html: `<p>You requested a password reset</p><p>Click this link to reset your password:</p><a href="${resetUrl}">${resetUrl}</a>`,
            });

            return NextResponse.json({ success: true, data: "Email sent" });
        } catch (err) {
            console.error("Email send error:", err);

            // Clear fields if email fails
            await db
                .update(users)
                .set({
                    resetPasswordToken: null,
                    resetPasswordExpires: null,
                })
                .where(eq(users.id, user.id));

            return NextResponse.json(
                { message: "Email could not be sent" },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json(
            { message: "Server error" },
            { status: 500 }
        );
    }
}
