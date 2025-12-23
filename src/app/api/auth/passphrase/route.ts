import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassphrase, setAuthCookies } from "@/lib/auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

// Verify passphrase and login
export async function POST(request: NextRequest) {
    // Strict rate limit for passphrase attempts
    const rateLimit = await checkRateLimit("passphrase");
    if (!rateLimit.success) {
        return NextResponse.json(
            { error: "Too many attempts. Please try again in 15 minutes." },
            { status: 429, headers: rateLimitHeaders(rateLimit) }
        );
    }

    try {
        const body = await request.json();
        const { passphrase } = body;

        if (!passphrase || typeof passphrase !== "string") {
            return NextResponse.json(
                { error: "Passphrase is required" },
                { status: 400 }
            );
        }

        // Get user
        const user = await db.select().from(users).get();

        if (!user) {
            return NextResponse.json(
                { error: "No user found. Please set up the app first." },
                { status: 404 }
            );
        }

        // Verify passphrase
        const valid = await verifyPassphrase(passphrase, user.passphraseHash);

        if (!valid) {
            return NextResponse.json(
                { error: "Invalid passphrase" },
                { status: 401 }
            );
        }

        // Set auth cookies
        await setAuthCookies(user.id);

        return NextResponse.json({
            success: true,
            message: "Authentication successful. Consider registering a passkey for this device.",
        });
    } catch (error) {
        console.error("Passphrase verification error:", error);
        return NextResponse.json(
            { error: "Authentication failed" },
            { status: 500 }
        );
    }
}
