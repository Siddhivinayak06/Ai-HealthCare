import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const secretKey = "secret";
const key = new TextEncoder().encode(process.env.JWT_SECRET || secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function login(user: { id: string; email: string; role: string }) {
  // Create the session
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  const session = await encrypt({ ...user, expires });

  // Save the session in a cookie
  const cookieStore = await cookies();
  cookieStore.set("auth_token", session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
}

export async function logout() {
  // Destroy the session
  const cookieStore = await cookies();
  cookieStore.set("auth_token", "", { expires: new Date(0), path: "/" });
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("auth_token")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("auth_token")?.value;
  if (!session) return;

  // Refresh the session so it doesn't expire
  const parsed = await decrypt(session);
  parsed.expires = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const res = NextResponse.next();
  res.cookies.set({
    name: "auth_token",
    value: await encrypt(parsed),
    httpOnly: true,
    expires: parsed.expires,
    path: "/"
  });
  return res;
}

// Session user type
export interface SessionUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Require authentication for API Route Handlers.
 * Throws an error if user is not authenticated.
 * @returns The authenticated user's session data
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return {
    id: session.id as string,
    email: session.email as string,
    role: session.role as string
  };
}

/**
 * Require specific role(s) for API Route Handlers.
 * Throws an error if user doesn't have required role.
 * @param allowedRoles - Array of roles that are permitted
 * @returns The authenticated user's session data
 */
export async function requireRole(allowedRoles: string[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden');
  }
  return user;
}

/**
 * Helper to create standardized error responses for Route Handlers
 */
export function authErrorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message : 'Unknown error';
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
  return Response.json({ message }, { status });
}
