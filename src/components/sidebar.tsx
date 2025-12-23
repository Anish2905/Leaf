"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    Plus,
    Search,
    Settings,
    ChevronRight,
    ChevronDown,
    FileText,
    MoreHorizontal,
    Trash2,
    Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { StatusIndicator } from "@/components/status-indicator";

interface Page {
    id: string;
    title: string;
    icon: string | null;
    parentId: string | null;
    position: number;
    isArchived: boolean;
}

interface SidebarProps {
    onOpenSearch: () => void;
    onOpenSettings: () => void;
}

export function Sidebar({ onOpenSearch, onOpenSettings }: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [pages, setPages] = useState<Page[]>([]);
    const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
    const [childrenCache, setChildrenCache] = useState<Record<string, Page[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Fetch root pages
    const fetchRootPages = useCallback(async () => {
        try {
            const res = await fetch("/api/pages?parentId=root");
            if (!res.ok) throw new Error("Failed to fetch pages");
            const data = await res.json();
            setPages(data.pages.filter((p: Page) => !p.isArchived));
        } catch (error) {
            console.error("Error fetching pages:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRootPages();
    }, [fetchRootPages]);

    // Fetch children when expanding
    const fetchChildren = async (parentId: string) => {
        if (childrenCache[parentId]) return;

        try {
            const res = await fetch(`/api/pages?parentId=${parentId}`);
            if (!res.ok) throw new Error("Failed to fetch children");
            const data = await res.json();
            setChildrenCache((prev) => ({
                ...prev,
                [parentId]: data.pages.filter((p: Page) => !p.isArchived),
            }));
        } catch (error) {
            console.error("Error fetching children:", error);
        }
    };

    const toggleExpand = async (pageId: string) => {
        const newExpanded = new Set(expandedPages);
        if (newExpanded.has(pageId)) {
            newExpanded.delete(pageId);
        } else {
            newExpanded.add(pageId);
            await fetchChildren(pageId);
        }
        setExpandedPages(newExpanded);
    };

    const createPage = async (parentId?: string) => {
        try {
            const res = await fetch("/api/pages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ parentId }),
            });

            if (!res.ok) throw new Error("Failed to create page");

            const data = await res.json();

            if (parentId) {
                setChildrenCache((prev) => ({
                    ...prev,
                    [parentId]: [...(prev[parentId] || []), data.page],
                }));
                setExpandedPages((prev) => new Set(prev).add(parentId));
            } else {
                setPages((prev) => [...prev, data.page]);
            }

            router.push(`/page/${data.page.id}`);
            toast.success("Page created");
        } catch (error) {
            toast.error("Failed to create page");
        }
    };

    const deletePage = async (pageId: string) => {
        try {
            const res = await fetch(`/api/pages/${pageId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete page");

            setPages((prev) => prev.filter((p) => p.id !== pageId));
            setChildrenCache((prev) => {
                const newCache = { ...prev };
                Object.keys(newCache).forEach((key) => {
                    newCache[key] = newCache[key].filter((p) => p.id !== pageId);
                });
                return newCache;
            });

            if (pathname === `/page/${pageId}`) {
                router.push("/");
            }

            toast.success("Page deleted");
        } catch (error) {
            toast.error("Failed to delete page");
        }
    };

    const renderPageItem = (page: Page, depth: number = 0) => {
        const isActive = pathname === `/page/${page.id}`;
        const isExpanded = expandedPages.has(page.id);
        const children = childrenCache[page.id] || [];
        const hasChildren = children.length > 0;

        return (
            <div key={page.id}>
                <div
                    className={cn(
                        "group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                        isActive
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50"
                    )}
                    style={{ paddingLeft: `${8 + depth * 12}px` }}
                >
                    <button
                        className="p-0.5 rounded hover:bg-accent"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(page.id);
                        }}
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                    </button>

                    <div
                        className="flex-1 flex items-center gap-2 overflow-hidden"
                        onClick={() => router.push(`/page/${page.id}`)}
                    >
                        <span className="shrink-0">
                            {page.icon || <FileText className="h-4 w-4 text-muted-foreground" />}
                        </span>
                        <span className="truncate text-sm">{page.title}</span>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 flex items-center">
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        className="p-1 rounded hover:bg-accent"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            createPage(page.id);
                                        }}
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right">Add subpage</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="p-1 rounded hover:bg-accent"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem
                                    onClick={() => router.push(`/page/${page.id}`)}
                                >
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => deletePage(page.id)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {isExpanded && hasChildren && (
                    <div>
                        {children.map((child) => renderPageItem(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-60 h-full bg-sidebar border-r flex flex-col">
            {/* Header */}
            <div className="p-3 border-b">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">P</span>
                    </div>
                    <span className="font-semibold text-sm">Polar Stellar</span>
                </div>
            </div>

            {/* Actions */}
            <div className="p-2 space-y-1">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8"
                    onClick={onOpenSearch}
                >
                    <Search className="h-4 w-4 mr-2" />
                    Search
                    <kbd className="ml-auto text-xs text-muted-foreground">⌘K</kbd>
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8"
                    onClick={onOpenSettings}
                >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                </Button>
            </div>

            {/* Pages */}
            <div className="flex-1 overflow-hidden">
                <div className="px-3 py-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Pages
                    </span>
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    className="p-1 rounded hover:bg-accent"
                                    onClick={() => createPage()}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>New page</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <ScrollArea className="h-[calc(100%-40px)]">
                    <div className="px-2 pb-2">
                        {isLoading ? (
                            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                                Loading...
                            </div>
                        ) : pages.length === 0 ? (
                            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                                No pages yet.
                                <button
                                    className="block mx-auto mt-1 text-primary hover:underline"
                                    onClick={() => createPage()}
                                >
                                    Create your first page
                                </button>
                            </div>
                        ) : (
                            pages.map((page) => renderPageItem(page))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Status */}
            <div className="p-3 border-t">
                <StatusIndicator className="w-full justify-center" />
            </div>
        </div>
    );
}
