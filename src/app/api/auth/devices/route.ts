import { NextRequest, NextResponse } from "next/server";
import { requireAuth, listUserCredentials, revokeCredential } from "@/lib/auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

// List user's registered devices
export async function GET() {
    const rateLimit = await checkRateLimit("api");
    if (!rateLimit.success) {
        return NextResponse.json(
            { error: "Too many requests" },
            { status: 429, headers: rateLimitHeaders(rateLimit) }
        );
    }

    try {
        const session = await requireAuth();
        const devices = await listUserCredentials(session.sub);

        return NextResponse.json({
            devices: devices.map((d) => ({
                id: d.id,
                name: d.deviceName,
                lastUsed: d.lastUsedAt,
                createdAt: d.createdAt,
                isCurrent: d.id === session.credentialId,
            })),
        });
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}

// Revoke a device
export async function DELETE(request: NextRequest) {
    const rateLimit = await checkRateLimit("api");
    if (!rateLimit.success) {
        return NextResponse.json(
            { error: "Too many requests" },
            { status: 429, headers: rateLimitHeaders(rateLimit) }
        );
    }

    try {
        const session = await requireAuth();
        const { searchParams } = new URL(request.url);
        const credentialId = searchParams.get("id");

        if (!credentialId) {
            return NextResponse.json(
                { error: "Credential ID is required" },
                { status: 400 }
            );
        }

        const success = await revokeCredential(session.sub, credentialId);

        if (!success) {
            return NextResponse.json(
                { error: "Device not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Device revoked successfully",
        });
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}
