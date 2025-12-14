"use server"

import { createUser, authenticateUser, createSession, setSessionCookie, deleteSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string
  const role = formData.get("role") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  const result = await createUser(email, password, name, role)

  if (!result.success || !result.user || !result.token) {
    return { error: result.error }
  }

  // Set session cookie with JWT
  await createSession(result.token)

  redirect("/")
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const result = await authenticateUser(email, password)
  console.log("SignIn Result:", result)

  if (!result.success || !result.user || !result.token) {
    return { error: result.error }
  }

  // Set session cookie with JWT
  await createSession(result.token)

  redirect("/")
}

export async function signOut() {
  await deleteSession()
  redirect("/login")
}

export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string
  if (!email) return { success: false, error: "Email is required" }

  // Dynamic import or binding could be needed if using lib directly, but we imported at top level
  const { requestPasswordReset } = await import("@/lib/auth"); // Ensuring no circular deps if any
  const result = await requestPasswordReset(email);
  return result;
}

export async function updatePassword(token: string, formData: FormData) {
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!password || !confirmPassword) return { success: false, error: "Passwords are required" }
  if (password !== confirmPassword) return { success: false, error: "Passwords do not match" }
  if (password.length < 8) return { success: false, error: "Password must be at least 8 characters" }

  const { performPasswordReset } = await import("@/lib/auth");
  const result = await performPasswordReset(token, password);
  return result;
}
