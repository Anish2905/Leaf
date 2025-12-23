import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generatePasskeyAuthenticationOptions } from "@/lib/auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

// Generate authentication options
export async function GET() {
    // Rate limit check
    const rateLimit = await checkRateLimit("passkey");
    if (!rateLimit.success) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429, headers: rateLimitHeaders(rateLimit) }
        );
    }

    try {
        // For single-user app, we don't specify userId - allow any registered credential
        const options = await generatePasskeyAuthenticationOptions();

        // Store challenge in cookie for verification
        const cookieStore = await cookies();
        cookieStore.set("webauthn_auth_challenge", options.challenge, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 5 * 60, // 5 minutes
            path: "/",
        });

        return NextResponse.json(options);
    } catch (error) {
        console.error("Authentication options error:", error);
        return NextResponse.json(
            { error: "Failed to generate authentication options" },
            { status: 500 }
        );
    }
}
