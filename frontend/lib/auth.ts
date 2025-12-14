import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
const COOKIE_NAME = "medai_session"
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

export type User = {
  id: string
  email: string
  name: string | null
  role: string
  created_at: string
  updated_at?: string
}

export async function createUser(
  email: string,
  password: string,
  name?: string,
  role?: string
): Promise<{ success: boolean; error?: string; user?: User; token?: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, role }),
    })

    const data = await res.json()

    if (!res.ok) {
      return { success: false, error: data.message || "Registration failed" }
    }

    return { success: true, user: data, token: data.token }
  } catch (error) {
    console.error("Error creating user:", error)
    return { success: false, error: "Network error" }
  }
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User; token?: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      return { success: false, error: data.message || "Login failed" }
    }

    return { success: true, user: data, token: data.token }
  } catch (error) {
    console.error("Error authenticating user:", error)
    return { success: false, error: "Network error" }
  }
}

export async function createSession(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION / 1000,
  })
}

export async function setSessionCookie(token: string): Promise<void> {
  // Alias for createSession to maintain compatibility if needed, or just use createSession
  return createSession(token);
}

export async function getSession(): Promise<{ user: User | null }> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return { user: null }

  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) return { user: null }

    const user = await res.json()
    return { user }
  } catch (error) {
    return { user: null }
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || "Failed to send reset email" };
    }
    return { success: true, message: data.data };
  } catch (error) {
    return { success: false, error: "Network error" };
  }
}

export async function performPasswordReset(token: string, password: string): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || "Failed to reset password" };
    }
    return { success: true, message: data.data };
  } catch (error) {
    return { success: false, error: "Network error" };
  }
}

