import { NextRequest, NextResponse } from "next/server";
import { decrypt, updateSession } from "@/lib/auth";

// ==================== PAGE ROUTES ====================
// Routes that require authentication
const protectedRoutes = ["/dashboard", "/analysis", "/risk", "/reports", "/patients", "/model-monitoring"];
// Routes that require doctor role
const doctorOnlyRoutes = ["/model-monitoring", "/patients"];
// Public routes
const publicRoutes = ["/login", "/register", "/"];

// ==================== API ROUTES ====================
// Protected API routes (require authentication)
const protectedAPIRoutes = [
    "/api/dashboard",
    "/api/patients",
    "/api/analyses",
    "/api/appointments",
    "/api/reports",
    "/api/prescriptions",
    "/api/settings",
    "/api/activity",
    "/api/predict",
    "/api/chat",
    "/api/auth/me",
    "/api/auth/doctors",
    "/api/auth/profile",
    "/api/auth/password",
];
// Doctor-only API routes
const doctorOnlyAPIRoutes = ["/api/model-monitoring", "/api/audit"];
// Public API routes (no auth required)
const publicAPIRoutes = [
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
];

export default async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    // ==================== PAGE ROUTE CHECKS ====================
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
    const isPublicRoute = publicRoutes.some(route => path === route);
    const isDoctorRoute = doctorOnlyRoutes.some(route => path.startsWith(route));

    // ==================== API ROUTE CHECKS ====================
    const isAPIRoute = path.startsWith('/api/');
    const isProtectedAPI = protectedAPIRoutes.some(route => path.startsWith(route));
    const isDoctorAPI = doctorOnlyAPIRoutes.some(route => path.startsWith(route));
    const isPublicAPI = publicAPIRoutes.some(route => path.startsWith(route));

    // 1. Get the session
    const cookie = req.cookies.get("auth_token")?.value;
    let session = null;
    if (cookie) {
        try {
            session = await decrypt(cookie);
        } catch (e) {
            console.error("Session decryption failed", e);
        }
    }

    // ==================== API ROUTE PROTECTION ====================
    if (isAPIRoute && !isPublicAPI) {
        // 2a. Check authentication for protected API routes
        if ((isProtectedAPI || isDoctorAPI) && !session) {
            return NextResponse.json(
                { message: "Unauthorized", code: "AUTH_REQUIRED" },
                { status: 401 }
            );
        }

        // 2b. Check role for doctor-only API routes
        if (isDoctorAPI && session?.role !== "doctor") {
            return NextResponse.json(
                { message: "Forbidden", code: "INSUFFICIENT_ROLE" },
                { status: 403 }
            );
        }
    }

    // ==================== PAGE ROUTE PROTECTION ====================
    // 3. Redirect to /login if the user is not authenticated and trying to access a protected route
    if (isProtectedRoute && !session) {
        return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    // 4. Redirect to /dashboard if the user is authenticated and trying to access a public route (login/register)
    if (isPublicRoute && session && !path.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }

    // 5. RBAC: Redirect to /dashboard if user is not a doctor and trying to access doctor-only routes
    if (isDoctorRoute && session?.role !== "doctor") {
        return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }

    // 6. Update session if it exists to slide the expiration
    if (session) {
        return await updateSession(req);
    }

    return NextResponse.next();
}

// Routes Middleware should run on (now includes API routes)
export const config = {
    matcher: [
        // Match all routes except static files and images
        "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
    ],
};
