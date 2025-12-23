import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, credentials, pages, blocks } from "@/lib/db/schema";

// Reset database - DELETE ALL DATA
export async function POST() {
    try {
        // Delete in order due to foreign key constraints
        await db.delete(blocks);
        await db.delete(pages);
        await db.delete(credentials);
        await db.delete(users);

        return NextResponse.json({
            success: true,
            message: "Database reset successfully. All data has been deleted.",
        });
    } catch (error) {
        console.error("Database reset error:", error);
        return NextResponse.json(
            { error: "Failed to reset database" },
            { status: 500 }
        );
    }
}
