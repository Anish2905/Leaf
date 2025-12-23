import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { eq, isNull, asc, gt, sql, and as drizzleAnd } from "drizzle-orm";
import { z } from "zod";

const createPageSchema = z.object({
    title: z.string().optional(),
    parentId: z.string().uuid().optional().nullable(),
    databaseId: z.string().uuid().optional().nullable(),
    icon: z.string().optional(),
    properties: z.any().optional(), // JSON properties for database entries
});

// List pages
export async function GET(request: NextRequest) {
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
        const parentId = searchParams.get("parentId");
        const databaseId = searchParams.get("databaseId");
        const since = searchParams.get("since");

        const conditions = [eq(pages.userId, session.sub)];

        // Filter by parent (null = root pages)
        if (parentId === "root" || (parentId === null && !databaseId)) {
            conditions.push(isNull(pages.parentId));
        } else if (parentId) {
            conditions.push(eq(pages.parentId, parentId));
        }

        // Filter by database
        if (databaseId) {
            conditions.push(eq(pages.databaseId, databaseId));
        }

        // Delta sync - only pages updated since timestamp
        if (since) {
            conditions.push(gt(pages.updatedAt, since));
        }

        // Execute query
        const result = await db
            .select()
            .from(pages)
            .where(drizzleAnd(...conditions))
            .orderBy(asc(pages.position));

        return NextResponse.json({ pages: result });
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}

// Create page
export async function POST(request: NextRequest) {
    const rateLimit = await checkRateLimit("api");
    if (!rateLimit.success) {
        return NextResponse.json(
            { error: "Too many requests" },
            { status: 429, headers: rateLimitHeaders(rateLimit) }
        );
    }

    try {
        const session = await requireAuth();

        const body = await request.json();
        const parsed = createPageSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0].message },
                { status: 400 }
            );
        }

        const { title, parentId, databaseId, icon, properties } = parsed.data;

        // Get next position (scoped to parent or database)


        // Initialize base query with user check
        // We use dynamic construction to avoid type issues with re-assignment
        let conditions = [eq(pages.userId, session.sub)];

        if (databaseId) {
            conditions.push(eq(pages.databaseId, databaseId));
        } else {
            conditions.push(parentId ? eq(pages.parentId, parentId) : isNull(pages.parentId));
        }

        const maxPosition = await db
            .select({ max: sql<number>`MAX(position)` })
            .from(pages)
            .where(drizzleAnd(...conditions))
            .get();
        const position = (maxPosition?.max ?? -1) + 1;

        const [newPage] = await db
            .insert(pages)
            .values({
                userId: session.sub,
                title: title || "Untitled",
                parentId: parentId || null,
                databaseId: databaseId || null,
                icon,
                properties,
                position,
            })
            .returning();

        return NextResponse.json({ page: newPage }, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}
