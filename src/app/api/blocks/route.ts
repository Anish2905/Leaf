import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blocks, pages } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { eq, sql, asc, gt } from "drizzle-orm";
import { z } from "zod";

const createBlockSchema = z.object({
    pageId: z.string().uuid(),
    parentBlockId: z.string().uuid().optional().nullable(),
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
    content: z.string().optional(), // JSON string
    position: z.number().int().min(0).optional(),
});

// List blocks (with optional since for sync)
export async function GET(request: NextRequest) {
    const rateLimit = await checkRateLimit("api");
    if (!rateLimit.success) {
        return NextResponse.json(
            { error: "Too many requests" },
            { status: 429, headers: rateLimitHeaders(rateLimit) }
        );
    }

    try {
        await requireAuth();

        const { searchParams } = new URL(request.url);
        const pageId = searchParams.get("pageId");
        const since = searchParams.get("since");

        let query = db.select().from(blocks);

        if (pageId) {
            query = query.where(eq(blocks.pageId, pageId)) as typeof query;
        }

        if (since) {
            query = query.where(gt(blocks.updatedAt, since)) as typeof query;
        }

        const result = await query.orderBy(asc(blocks.position));

        return NextResponse.json({ blocks: result });
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}

// Create block
export async function POST(request: NextRequest) {
    const rateLimit = await checkRateLimit("api");
    if (!rateLimit.success) {
        return NextResponse.json(
            { error: "Too many requests" },
            { status: 429, headers: rateLimitHeaders(rateLimit) }
        );
    }

    try {
        await requireAuth();

        const body = await request.json();
        const parsed = createBlockSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0].message },
                { status: 400 }
            );
        }

        const { pageId, parentBlockId, type, content, position } = parsed.data;

        // Verify page exists
        const page = await db.select().from(pages).where(eq(pages.id, pageId)).get();
        if (!page) {
            return NextResponse.json({ error: "Page not found" }, { status: 404 });
        }

        // Get next position if not specified
        let blockPosition = position;
        if (blockPosition === undefined) {
            const maxPosition = await db
                .select({ max: sql<number>`MAX(position)` })
                .from(blocks)
                .where(eq(blocks.pageId, pageId))
                .get();
            blockPosition = (maxPosition?.max ?? -1) + 1;
        }

        const [newBlock] = await db
            .insert(blocks)
            .values({
                pageId,
                parentBlockId: parentBlockId || null,
                type: type || "paragraph",
                content: content || JSON.stringify({ text: "" }),
                position: blockPosition,
            })
            .returning();

        // Update page's updated_at
        await db
            .update(pages)
            .set({ updatedAt: sql`datetime('now')` })
            .where(eq(pages.id, pageId));

        return NextResponse.json({ block: newBlock }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}
