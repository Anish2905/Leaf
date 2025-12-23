import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassphrase, setAuthCookies } from "@/lib/auth";
import { eq, or } from "drizzle-orm";
import { z } from "zod";

const loginSchema = z.object({
    identifier: z.string(), // email or username
    passphrase: z.string()
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = loginSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid input" },
                { status: 400 }
            );
        }

        const { identifier, passphrase } = validation.data;

        // Find user by email or username
        const user = await db.select().from(users).where(
            or(eq(users.email, identifier), eq(users.username, identifier))
        ).get();

        if (!user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Verify password
        const isValid = await verifyPassphrase(passphrase, user.passphraseHash);
        if (!isValid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Set session
        await setAuthCookies(user.id);

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                username: user.username
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
