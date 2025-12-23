import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyPasskeyRegistration, setAuthCookies, requireAuth } from "@/lib/auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

// Verify registration and store credential
export async function POST(request: NextRequest) {
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
        const body = await request.json();
        const { response, deviceName } = body;

        if (!response) {
            return NextResponse.json(
                { error: "Registration response is required" },
                { status: 400 }
            );
        }

        // Get challenge from cookie
        const cookieStore = await cookies();
        const challenge = cookieStore.get("webauthn_challenge")?.value;

        if (!challenge) {
            return NextResponse.json(
                { error: "Challenge expired. Please try again." },
                { status: 400 }
            );
        }

        // Verify and store credential
        const verification = await verifyPasskeyRegistration(
            session.sub,
            response,
            challenge,
            deviceName
        );

        // Clear challenge cookie
        cookieStore.delete("webauthn_challenge");

        if (!verification.verified) {
            return NextResponse.json(
                { error: "Verification failed" },
                { status: 400 }
            );
        }

        // Update session with credential ID
        await setAuthCookies(session.sub, verification.registrationInfo?.credentialID);

        return NextResponse.json({
            success: true,
            message: "Passkey registered successfully",
        });
    } catch (error) {
        console.error("Passkey registration error:", error);
        return NextResponse.json(
            { error: "Registration failed" },
            { status: 500 }
        );
    }
}
