import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pages, blocks } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { eq, sql, asc } from "drizzle-orm";
import { z } from "zod";

const updatePageSchema = z.object({
    title: z.string().optional(),
    icon: z.string().optional().nullable(),
    coverUrl: z.string().url().optional().nullable(),
    parentId: z.string().uuid().optional().nullable(),
    position: z.number().int().min(0).optional(),
    isArchived: z.boolean().optional(),
});

interface RouteContext {
    params: Promise<{ id: string }>;
}

// Get single page with blocks
export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    const rateLimit = await checkRateLimit("api");
    if (!rateLimit.success) {
        return NextResponse.json(
            { error: "Too many requests" },
            { status: 429, headers: rateLimitHeaders(rateLimit) }
        );
    }

    try {
        await requireAuth();

        const { id } = await context.params;

        const page = await db.select().from(pages).where(eq(pages.id, id)).get();

        if (!page) {
            return NextResponse.json({ error: "Page not found" }, { status: 404 });
        }

        // Get child pages
        const childPages = await db
            .select()
            .from(pages)
            .where(eq(pages.parentId, id))
            .orderBy(asc(pages.position));

        // Get blocks
        const pageBlocks = await db
            .select()
            .from(blocks)
            .where(eq(blocks.pageId, id))
            .orderBy(asc(blocks.position));

        return NextResponse.json({
            page,
            childPages,
            blocks: pageBlocks,
        });
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}

// Update page
export async function PATCH(
    request: NextRequest,
    context: RouteContext
) {
    const rateLimit = await checkRateLimit("api");
    if (!rateLimit.success) {
        return NextResponse.json(
            { error: "Too many requests" },
            { status: 429, headers: rateLimitHeaders(rateLimit) }
        );
    }

    try {
        await requireAuth();

        const { id } = await context.params;
        const body = await request.json();
        const parsed = updatePageSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0].message },
                { status: 400 }
            );
        }

        const updates = {
            ...parsed.data,
            updatedAt: sql`datetime('now')`,
        };

        const [updated] = await db
            .update(pages)
            .set(updates)
            .where(eq(pages.id, id))
            .returning();

        if (!updated) {
            return NextResponse.json({ error: "Page not found" }, { status: 404 });
        }

        return NextResponse.json({ page: updated });
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}

// Delete page
export async function DELETE(
    request: NextRequest,
    context: RouteContext
) {
    const rateLimit = await checkRateLimit("api");
    if (!rateLimit.success) {
        return NextResponse.json(
            { error: "Too many requests" },
            { status: 429, headers: rateLimitHeaders(rateLimit) }
        );
    }

    try {
        await requireAuth();

        const { id } = await context.params;

        const [deleted] = await db
            .delete(pages)
            .where(eq(pages.id, id))
            .returning();

        if (!deleted) {
            return NextResponse.json({ error: "Page not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}
