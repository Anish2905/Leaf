import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { Node } from "@tiptap/core";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export interface BookmarkMetadata {
    title?: string;
    description?: string;
    image?: string;
}

export const BookmarkComponent = ({ node }: { node: any }) => {
    const url = node.attrs.url;
    const [metadata, setMetadata] = useState<BookmarkMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!url) return;

        const fetchMetadata = async () => {
            try {
                const res = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
                if (!res.ok) throw new Error("Failed");
                const data = await res.json();
                setMetadata(data);
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchMetadata();
    }, [url]);

    return (
        <NodeViewWrapper className="my-4 not-prose">
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex border rounded-lg overflow-hidden hover:bg-muted/50 transition-colors h-32 no-underline"
            >
                <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
                    {loading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Fetching metadata...
                        </div>
                    ) : error ? (
                        <div className="text-sm text-muted-foreground break-all">{url}</div>
                    ) : (
                        <>
                            <div className="font-semibold truncate text-foreground mb-1">
                                {metadata?.title || url}
                            </div>
                            <div className="text-sm text-muted-foreground line-clamp-2">
                                {metadata?.description}
                            </div>
                            <div className="mt-auto text-xs text-muted-foreground truncate opacity-70">
                                {new URL(url).hostname}
                            </div>
                        </>
                    )}
                </div>
                {metadata?.image && !loading && !error && (
                    <div className="w-48 h-full relative bg-muted shrink-0 hidden sm:block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={metadata.image}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </div>
                )}
            </a>
        </NodeViewWrapper>
    );
};

export const BookmarkBlock = Node.create({
    name: "bookmark",

    group: "block",

    atom: true,

    addAttributes() {
        return {
            url: {
                default: "",
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: "bookmark-block",
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ["bookmark-block", HTMLAttributes];
    },

    addNodeView() {
        return ReactNodeViewRenderer(BookmarkComponent);
    },
});
