import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, name, role } = body;

        if (!email || !password) {
            return NextResponse.json(
                { message: "Please provide email and password" },
                { status: 400 }
            );
        }

        // Check if user exists
        const userCheck = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase()));

        if (userCheck.length > 0) {
            return NextResponse.json(
                { message: "User already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user - SECURITY: Always patient on self-registration
        // Doctor role must be assigned by admin
        const result = await db
            .insert(users)
            .values({
                email: email.toLowerCase(),
                passwordHash: hashedPassword,
                name,
                role: "patient",
            })
            .returning({
                id: users.id,
                email: users.email,
                name: users.name,
                role: users.role,
            });

        const user = result[0];

        // Create session token
        const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
        const session = await encrypt({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role || "patient",
            expires
        });

        // Set HTTP-only cookie
        const cookieStore = await cookies();
        cookieStore.set("auth_token", session, {
            expires,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        });

        return NextResponse.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        }, { status: 201 });

    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { message: "Server error" },
            { status: 500 }
        );
    }
}
