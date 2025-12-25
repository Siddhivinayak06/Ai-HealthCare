import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// ==================== SECURITY: Fail-fast if no secret ====================
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required for security");
}
const key = new TextEncoder().encode(process.env.JWT_SECRET);

// Session configuration
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

// Session user type
export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
}

// Backward compatibility alias
export type User = SessionUser;

interface SessionPayload extends SessionUser {
  expires: string;
  iat: number;
  exp: number;
}

/**
 * Encrypt a payload into a signed JWT
 */
export async function encrypt(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(key);
}

/**
 * Decrypt and verify a JWT token
 */
export async function decrypt(input: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload as unknown as SessionPayload;
}

/**
 * Create a session and set the auth cookie
 */
export async function login(user: SessionUser) {
  const expires = new Date(Date.now() + SESSION_DURATION_MS);
  const session = await encrypt({ ...user, expires: expires.toISOString() });

  const cookieStore = await cookies();
  cookieStore.set("auth_token", session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Destroy the session by clearing the auth cookie
 */
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("auth_token", "", { expires: new Date(0), path: "/" });
}

/**
 * Get the current session, returns { user: null } if expired or invalid
 * Returns { user: SessionUser } if valid session exists.
 * SELF-HEALING: If name is missing, it fetches from DB and updates session.
 */
export async function getSession(): Promise<{ user: SessionUser | null }> {
  const cookieStore = await cookies();
  const session = cookieStore.get("auth_token")?.value;
  if (!session) return { user: null };

  try {
    const parsed = await decrypt(session);

    // Check if session is expired (defense in depth)
    if (parsed.expires && new Date(parsed.expires) < new Date()) {
      return { user: null };
    }

    let userName = parsed.name;

    // 🩹 UI-LEVEL HEALING: Fetch name from DB if missing in token 
    // (Actual cookie update happens in middleware/updateSession)
    if (!userName) {
      try {
        const { db } = await import("@/lib/db");
        const { users } = await import("@/lib/schema");
        const { eq } = await import("drizzle-orm");

        const userResult = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, parsed.id))
          .limit(1);

        if (userResult.length > 0 && userResult[0].name) {
          userName = userResult[0].name;
        }
      } catch (dbError) {
        // Silently fail, UI will fallback to email
      }
    }

    return {
      user: {
        id: parsed.id,
        email: parsed.email,
        name: userName,
        role: parsed.role,
      },
    };
  } catch {
    // Token invalid or expired
    return { user: null };
  }
}

/**
 * Update session expiration (sliding window)
 */
export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("auth_token")?.value;
  if (!session) return NextResponse.next();

  try {
    const parsed = await decrypt(session);
    const newExpires = new Date(Date.now() + SESSION_DURATION_MS);

    let userName = parsed.name;

    // 🩹 COOKIE-LEVEL HEALING: Fetch name from DB if missing
    if (!userName) {
      try {
        const { db } = await import("@/lib/db");
        const { users } = await import("@/lib/schema");
        const { eq } = await import("drizzle-orm");

        const userResult = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, parsed.id))
          .limit(1);

        if (userResult.length > 0 && userResult[0].name) {
          userName = userResult[0].name;
        }
      } catch (e) {
        // Fallback to null
      }
    }

    const res = NextResponse.next();
    res.cookies.set({
      name: "auth_token",
      value: await encrypt({
        ...parsed,
        name: userName,
        expires: newExpires.toISOString()
      }),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: newExpires,
      path: "/",
      sameSite: "lax"
    });
    return res;
  } catch {
    return NextResponse.next();
  }
}

/**
 * Require authentication for API Route Handlers.
 * Throws an error if user is not authenticated.
 */
export async function requireAuth(): Promise<SessionUser> {
  const { user } = await getSession();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Require specific role(s) for API Route Handlers.
 * Throws an error if user doesn't have required role.
 */
export async function requireRole(allowedRoles: string[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}

/**
 * Helper to create standardized error responses for Route Handlers
 */
export function authErrorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message : "Unknown error";
  const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
  return Response.json({ success: false, error: { message } }, { status });
}
