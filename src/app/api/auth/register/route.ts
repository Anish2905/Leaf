import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassphrase, validatePassphraseStrength, setAuthCookies } from "@/lib/auth";
import { eq, or } from "drizzle-orm";
import { z } from "zod";

const registerSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
    passphrase: z.string()
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = registerSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { email, username, passphrase } = validation.data;

        // Check password strength
        const strength = validatePassphraseStrength(passphrase);
        if (!strength.valid) {
            return NextResponse.json(
                { error: strength.errors[0] },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await db.select().from(users).where(
            or(eq(users.email, email), eq(users.username, username))
        ).get();

        if (existingUser) {
            if (existingUser.email === email) {
                return NextResponse.json({ error: "Email already registered" }, { status: 409 });
            }
            return NextResponse.json({ error: "Username already taken" }, { status: 409 });
        }

        // Create user
        const passwordHash = await hashPassphrase(passphrase);
        const [newUser] = await db.insert(users).values({
            email,
            username,
            passphraseHash: passwordHash
        }).returning();

        // Set session
        await setAuthCookies(newUser.id);

        return NextResponse.json({
            user: {
                id: newUser.id,
                email: newUser.email,
                username: newUser.username
            }
        });

    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
