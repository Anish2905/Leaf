import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pages, blocks } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { like, or, sql } from "drizzle-orm";

// Global search
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
        const query = searchParams.get("q");

        if (!query || query.length < 2) {
            return NextResponse.json({ pages: [], blocks: [] });
        }

        const searchPattern = `%${query}%`;

        // Search pages by title
        const matchedPages = await db
            .select({
                id: pages.id,
                title: pages.title,
                icon: pages.icon,
                parentId: pages.parentId,
                updatedAt: pages.updatedAt,
            })
            .from(pages)
            .where(like(pages.title, searchPattern))
            .limit(20);

        // Search blocks by content
        const matchedBlocks = await db
            .select({
                id: blocks.id,
                pageId: blocks.pageId,
                type: blocks.type,
                content: blocks.content,
                updatedAt: blocks.updatedAt,
            })
            .from(blocks)
            .where(like(blocks.content, searchPattern))
            .limit(20);

        // Get page titles for matched blocks
        const blockPageIds = [...new Set(matchedBlocks.map((b) => b.pageId))];
        const blockPages = blockPageIds.length
            ? await db
                .select({ id: pages.id, title: pages.title, icon: pages.icon })
                .from(pages)
                .where(
                    or(...blockPageIds.map((id) => sql`${pages.id} = ${id}`))
                )
            : [];

        const pageMap = new Map(blockPages.map((p) => [p.id, p]));

        const blocksWithPages = matchedBlocks.map((block) => ({
            ...block,
            page: pageMap.get(block.pageId),
        }));

        return NextResponse.json({
            pages: matchedPages,
            blocks: blocksWithPages,
        });
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}
