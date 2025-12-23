import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
    await requireAuth();

    const url = req.nextUrl.searchParams.get("url");
    if (!url) {
        return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "PolarStellar-Bot/1.0",
            },
        });
        const html = await response.text();
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        const getMeta = (prop: string) =>
            doc.querySelector(`meta[property='${prop}']`)?.getAttribute("content") ||
            doc.querySelector(`meta[name='${prop}']`)?.getAttribute("content");

        const title = getMeta("og:title") || doc.title;
        const description = getMeta("og:description") || getMeta("description");
        const image = getMeta("og:image");

        return NextResponse.json({ title, description, image });

    } catch (error) {
        console.error("Failed to fetch metadata:", error);
        return NextResponse.json({ error: "Failed to fetch metadata" }, { status: 500 });
    }
}
