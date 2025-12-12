import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
    // Get the session cookie
    const session = request.cookies.get("medai_session")

    // Define protected routes
    const protectedPaths = ["/", "/patients", "/analysis", "/risk", "/reports", "/activity", "/settings"]
    const isProtectedPath = protectedPaths.some(path =>
        request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
    )

    // Auth routes (login/signup) shoud redirect to dashboard if logged in
    const isAuthPath = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup")

    if (isProtectedPath && !session) {
        // Redirect to login if accessing protected route without session
        const url = new URL("/login", request.url)
        url.searchParams.set("callbackUrl", request.nextUrl.pathname)
        return NextResponse.redirect(url)
    }

    if (isAuthPath && session) {
        // Redirect to dashboard if accessing auth pages while logged in
        return NextResponse.redirect(new URL("/", request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files (images, etc)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
}
