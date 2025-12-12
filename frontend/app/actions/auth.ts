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
