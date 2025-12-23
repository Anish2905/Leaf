import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blocks, pages } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

const updateBlockSchema = z.object({
    type: z.enum([
        "paragraph",
        "heading_1",
        "heading_2",
        "heading_3",
        "bulleted_list",
        "numbered_list",
        "toggle",
        "quote",
        "code",
        "divider",
        "callout",
        "image",
        "page_link",
    ]).optional(),
    content: z.string().optional(),
    position: z.number().int().min(0).optional(),
    parentBlockId: z.string().uuid().optional().nullable(),
});

interface RouteContext {
    params: Promise<{ id: string }>;
}

// Get single block
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

        const block = await db.select().from(blocks).where(eq(blocks.id, id)).get();

        if (!block) {
            return NextResponse.json({ error: "Block not found" }, { status: 404 });
        }

        return NextResponse.json({ block });
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}

// Update block
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
        const parsed = updateBlockSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0].message },
                { status: 400 }
            );
        }

        // Get current block to find its page
        const currentBlock = await db
            .select()
            .from(blocks)
            .where(eq(blocks.id, id))
            .get();

        if (!currentBlock) {
            return NextResponse.json({ error: "Block not found" }, { status: 404 });
        }

        const updates = {
            ...parsed.data,
            updatedAt: sql`datetime('now')`,
        };

        const [updated] = await db
            .update(blocks)
            .set(updates)
            .where(eq(blocks.id, id))
            .returning();

        // Update page's updated_at
        await db
            .update(pages)
            .set({ updatedAt: sql`datetime('now')` })
            .where(eq(pages.id, currentBlock.pageId));

        return NextResponse.json({ block: updated });
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}

// Delete block
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

        // Get block to find its page
        const currentBlock = await db
            .select()
            .from(blocks)
            .where(eq(blocks.id, id))
            .get();

        if (!currentBlock) {
            return NextResponse.json({ error: "Block not found" }, { status: 404 });
        }

        await db.delete(blocks).where(eq(blocks.id, id));

        // Update page's updated_at
        await db
            .update(pages)
            .set({ updatedAt: sql`datetime('now')` })
            .where(eq(pages.id, currentBlock.pageId));

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}
