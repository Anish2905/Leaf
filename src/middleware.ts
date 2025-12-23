import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "fallback-secret-change-in-production-min-32-chars"
);

// Routes that don't require authentication
const publicRoutes = [
    "/login",

    "/api/auth/passkey/login",
    "/api/auth/passkey/login/verify",
    "/api/auth/passphrase",
    "/api/reset",
    "/register",
    "/api/auth/register",
    "/api/auth/login",
];

// Check if path matches any public route
function isPublicRoute(path: string): boolean {
    return publicRoutes.some(
        (route) => path === route || path.startsWith(route + "/")
    );
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip static files and public routes
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // Allow public routes
    if (isPublicRoute(pathname)) {
        return NextResponse.next();
    }

    // Check for valid session
    const accessToken = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;

    let isAuthenticated = false;

    if (accessToken) {
        try {
            await jwtVerify(accessToken, JWT_SECRET);
            isAuthenticated = true;
        } catch {
            // Token expired or invalid
        }
    }

    // Try refresh token if access token is invalid
    if (!isAuthenticated && refreshToken) {
        try {
            await jwtVerify(refreshToken, JWT_SECRET);
            // Refresh token is valid, let the API handle token rotation
            isAuthenticated = true;
        } catch {
            // Refresh token also invalid
        }
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        // Redirect to login

        // For API routes, return 401
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // For pages, redirect to login (or setup if no user)
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
