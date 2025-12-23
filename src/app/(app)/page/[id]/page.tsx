"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { BlockEditor } from "@/components/editor";
import { toast } from "sonner";

interface Page {
    id: string;
    title: string;
    icon: string | null;
    coverUrl: string | null;
    parentId: string | null;
    updatedAt: string;
}

interface Block {
    id: string;
    type: string;
    content: string | null;
    position: number;
}

export default function PageContent() {
    const params = useParams();
    const router = useRouter();
    const pageId = params?.id as string;

    const [page, setPage] = useState<Page | null>(null);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [title, setTitle] = useState("");

    // Fetch page data
    useEffect(() => {
        async function fetchPage() {
            try {
                const res = await fetch(`/api/pages/${pageId}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        toast.error("Page not found");
                        router.replace("/");
                        return;
                    }
                    throw new Error("Failed to fetch page");
                }

                const data = await res.json();
                setPage(data.page);
                setBlocks(data.blocks);
                setTitle(data.page.title);
            } catch (error) {
                console.error("Error fetching page:", error);
                toast.error("Failed to load page");
            } finally {
                setIsLoading(false);
            }
        }

        fetchPage();
    }, [pageId, router]);

    // Update title
    const updateTitle = useCallback(
        async (newTitle: string) => {
            try {
                const res = await fetch(`/api/pages/${pageId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: newTitle }),
                });

                if (!res.ok) throw new Error("Failed to update title");
            } catch (error) {
                console.error("Error updating title:", error);
            }
        },
        [pageId]
    );

    // Debounced title update
    useEffect(() => {
        if (!page || title === page.title) return;

        const timer = setTimeout(() => {
            updateTitle(title);
        }, 500);

        return () => clearTimeout(timer);
    }, [title, page, updateTitle]);

    // Save content
    const handleSaveContent = useCallback(
        async (content: string) => {
            // For now, we'll save as the first block
            // In a full implementation, this would handle individual block updates
            if (blocks.length > 0) {
                // Update existing block
                await fetch(`/api/blocks/${blocks[0].id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content }),
                });
            } else {
                // Create new block
                const res = await fetch("/api/blocks", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        pageId,
                        type: "paragraph",
                        content,
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    setBlocks([data.block]);
                }
            }
        },
        [pageId, blocks]
    );

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    if (!page) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-muted-foreground">Page not found</div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Page header */}
            <div className="px-8 py-6 border-b">
                <div className="max-w-3xl mx-auto flex items-center gap-3">
                    <span className="text-3xl">{page.icon || "📄"}</span>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Untitled"
                        className="text-3xl font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto"
                    />
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-hidden">
                <BlockEditor
                    pageId={pageId}
                    initialContent={blocks[0]?.content || undefined}
                    onSave={handleSaveContent}
                />
            </div>
        </div>
    );
}
