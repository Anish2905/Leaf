"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileText, Search } from "lucide-react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

interface SearchResult {
    pages: Array<{
        id: string;
        title: string;
        icon: string | null;
    }>;
    blocks: Array<{
        id: string;
        pageId: string;
        content: string;
        page?: {
            id: string;
            title: string;
            icon: string | null;
        };
    }>;
}

interface SearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult>({ pages: [], blocks: [] });
    const [isSearching, setIsSearching] = useState(false);

    // Keyboard shortcut
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onOpenChange(!open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [open, onOpenChange]);

    // Search
    const search = useCallback(async (q: string) => {
        if (q.length < 2) {
            setResults({ pages: [], blocks: [] });
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data);
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            search(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, search]);

    const handleSelect = (pageId: string) => {
        router.push(`/page/${pageId}`);
        onOpenChange(false);
        setQuery("");
    };

    const getContentPreview = (content: string) => {
        try {
            const parsed = JSON.parse(content);
            return parsed.text?.slice(0, 100) || "...";
        } catch {
            return content.slice(0, 100);
        }
    };

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput
                placeholder="Search pages and content..."
                value={query}
                onValueChange={setQuery}
            />
            <CommandList>
                <CommandEmpty>
                    {isSearching ? "Searching..." : "No results found."}
                </CommandEmpty>

                {results.pages.length > 0 && (
                    <CommandGroup heading="Pages">
                        {results.pages.map((page) => (
                            <CommandItem
                                key={page.id}
                                value={page.id}
                                onSelect={() => handleSelect(page.id)}
                            >
                                <span className="mr-2">
                                    {page.icon || <FileText className="h-4 w-4" />}
                                </span>
                                <span>{page.title}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {results.blocks.length > 0 && (
                    <CommandGroup heading="Content">
                        {results.blocks.map((block) => (
                            <CommandItem
                                key={block.id}
                                value={block.id}
                                onSelect={() => handleSelect(block.pageId)}
                            >
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            {block.page?.icon || <FileText className="h-3 w-3" />}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {block.page?.title || "Untitled"}
                                        </span>
                                    </div>
                                    <span className="text-sm truncate">
                                        {getContentPreview(block.content)}
                                    </span>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}
            </CommandList>
        </CommandDialog>
    );
}
