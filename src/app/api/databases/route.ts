import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { databases, pages } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const createDatabaseSchema = z.object({
    title: z.string().min(1, "Title is required"),
    parentId: z.string().optional(),
    schema: z.record(z.any()).optional(),
    views: z.array(z.any()).optional(),
});

export async function POST(request: NextRequest) {
    // Verify authentication
    const session = await requireAuth();

    try {
        const body = await request.json();
        const validatedData = createDatabaseSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: validatedData.error.errors[0].message },
                { status: 400 }
            );
        }

        const { title, parentId, schema, views } = validatedData.data;

        // Create the database
        const [newDatabase] = await db
            .insert(databases)
            .values({
                userId: session.sub,
                title,
                parentId, // Can be null (top-level) or page ID
                schema: schema || {},
                views: views || [{ type: "table", name: "Table View" }],
            })
            .returning();

        // If inserted into a page, we might want to create a block for it?
        // For now, simpler: Databases live in pages.

        return NextResponse.json(newDatabase);
    } catch (error) {
        console.error("Create database error:", error);
        return NextResponse.json(
            { error: "Failed to create database" },
            { status: 500 }
        );
    }
}
