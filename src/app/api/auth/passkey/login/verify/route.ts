import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyPasskeyAuthentication, setAuthCookies } from "@/lib/auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

// Verify authentication
export async function POST(request: NextRequest) {
    // Rate limit check
    const rateLimit = await checkRateLimit("passkey");
    if (!rateLimit.success) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429, headers: rateLimitHeaders(rateLimit) }
        );
    }

    try {
        const body = await request.json();
        const { response } = body;

        if (!response) {
            return NextResponse.json(
                { error: "Authentication response is required" },
                { status: 400 }
            );
        }

        // Get challenge from cookie
        const cookieStore = await cookies();
        const challenge = cookieStore.get("webauthn_auth_challenge")?.value;

        if (!challenge) {
            return NextResponse.json(
                { error: "Challenge expired. Please try again." },
                { status: 400 }
            );
        }

        // Verify authentication
        const result = await verifyPasskeyAuthentication(response, challenge);

        // Clear challenge cookie
        cookieStore.delete("webauthn_auth_challenge");

        if (!result.verified || !result.userId) {
            return NextResponse.json(
                { error: "Authentication failed" },
                { status: 401 }
            );
        }

        // Set auth cookies
        await setAuthCookies(result.userId, result.credentialId);

        return NextResponse.json({
            success: true,
            message: "Authentication successful",
        });
    } catch (error) {
        console.error("Passkey authentication error:", error);
        return NextResponse.json(
            { error: "Authentication failed" },
            { status: 500 }
        );
    }
}
