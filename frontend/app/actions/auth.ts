"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { login, logout } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please provide email and password" };
  }

  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (result.length === 0) {
      return { error: "Invalid credentials" };
    }

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return { error: "Invalid credentials" };
    }

    // Set session cookie
    await login({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || "patient",
    });

  } catch (error) {
    console.error("Login error:", error);
    return { error: "An unexpected error occurred" };
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const role = formData.get("role") as string || "patient";

  if (!email || !password || !name) {
    return { error: "Please provide name, email and password" };
  }

  try {
    // Check if user exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (existing.length > 0) {
      return { error: "User already exists" };
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await db.insert(users).values({
      email: email.toLowerCase(),
      name,
      passwordHash: hashedPassword,
      role: role as any,
    }).returning();

    const user = newUser[0];

    // Set session cookie
    await login({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || "patient",
    });

  } catch (error) {
    console.error("Registration error:", error);
    return { error: "An unexpected error occurred" };
  }

  redirect("/dashboard");
}

export async function signOut() {
  await logout();
  redirect("/login");
}

// Forgot password - sends email with reset link
export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Please provide your email" };
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.message || "Failed to send reset email" };
    }

    return { success: true, message: "Password reset email sent" };
  } catch (error) {
    console.error("Reset password error:", error);
    return { error: "An unexpected error occurred" };
  }
}

// Update password with reset token
export async function updatePassword(formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;

  if (!token || !password) {
    return { error: "Invalid request" };
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/reset-password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.message || "Failed to reset password" };
    }

    return { success: true };
  } catch (error) {
    console.error("Update password error:", error);
    return { error: "An unexpected error occurred" };
  }
}
