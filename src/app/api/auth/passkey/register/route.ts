import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generatePasskeyRegistrationOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/auth/jwt";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

// Generate registration options
export async function GET() {
    // Rate limit check
    const rateLimit = await checkRateLimit("auth");
    if (!rateLimit.success) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429, headers: rateLimitHeaders(rateLimit) }
        );
    }

    try {
        const session = await requireAuth();
        const options = await generatePasskeyRegistrationOptions(session.sub);

        // Store challenge in cookie for verification
        const cookieStore = await cookies();
        cookieStore.set("webauthn_challenge", options.challenge, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 5 * 60, // 5 minutes
            path: "/",
        });

        return NextResponse.json(options);
    } catch (error) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }
}
