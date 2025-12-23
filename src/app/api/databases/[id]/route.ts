import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { databases } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateDatabaseSchema = z.object({
    title: z.string().optional(),
    schema: z.record(z.any()).optional(),
    views: z.array(z.any()).optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const database = await db.select().from(databases).where(eq(databases.id, id)).get();

        if (!database) {
            return NextResponse.json({ error: "Database not found" }, { status: 404 });
        }

        return NextResponse.json(database);
    } catch (error) {
        console.error("Get database error:", error);
        return NextResponse.json({ error: "Failed to fetch database" }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const validatedData = updateDatabaseSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: validatedData.error.errors[0].message },
                { status: 400 }
            );
        }

        const { title, schema, views } = validatedData.data;

        const [updatedDatabase] = await db
            .update(databases)
            .set({
                title,
                ...(schema ? { schema } : {}),
                ...(views ? { views } : {}),
                updatedAt: new Date().toISOString(),
            })
            .where(eq(databases.id, id))
            .returning();

        if (!updatedDatabase) {
            return NextResponse.json({ error: "Database not found" }, { status: 404 });
        }

        return NextResponse.json(updatedDatabase);
    } catch (error) {
        console.error("Update database error:", error);
        return NextResponse.json({ error: "Failed to update database" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const [deletedDatabase] = await db
            .delete(databases)
            .where(eq(databases.id, id))
            .returning();

        if (!deletedDatabase) {
            return NextResponse.json({ error: "Database not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Database deleted" });
    } catch (error) {
        console.error("Delete database error:", error);
        return NextResponse.json({ error: "Failed to delete database" }, { status: 500 });
    }
}
