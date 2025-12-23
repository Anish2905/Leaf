"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { AlertCircle, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

type CalloutType = "info" | "warning" | "success" | "error" | "note";

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        callout: {
            setCallout: (attrs?: { type?: CalloutType }) => ReturnType;
        };
    }
}

const calloutStyles: Record<CalloutType, { bg: string; border: string; icon: React.ReactNode }> = {
    info: {
        bg: "bg-blue-50 dark:bg-blue-950/30",
        border: "border-blue-200 dark:border-blue-800",
        icon: <Info className="h-5 w-5 text-blue-500" />,
    },
    warning: {
        bg: "bg-yellow-50 dark:bg-yellow-950/30",
        border: "border-yellow-200 dark:border-yellow-800",
        icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    },
    success: {
        bg: "bg-green-50 dark:bg-green-950/30",
        border: "border-green-200 dark:border-green-800",
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    },
    error: {
        bg: "bg-red-50 dark:bg-red-950/30",
        border: "border-red-200 dark:border-red-800",
        icon: <XCircle className="h-5 w-5 text-red-500" />,
    },
    note: {
        bg: "bg-muted/50",
        border: "border-muted-foreground/20",
        icon: <AlertCircle className="h-5 w-5 text-muted-foreground" />,
    },
};

const CalloutView = ({ node, updateAttributes }: any) => {
    const type = (node.attrs.type || "note") as CalloutType;
    const style = calloutStyles[type];

    const cycleType = () => {
        const types: CalloutType[] = ["note", "info", "warning", "success", "error"];
        const currentIndex = types.indexOf(type);
        const nextType = types[(currentIndex + 1) % types.length];
        updateAttributes({ type: nextType });
    };

    return (
        <NodeViewWrapper className="callout-block my-3">
            <div
                className={`flex items-start gap-3 rounded-lg border p-4 ${style.bg} ${style.border}`}
            >
                <button
                    onClick={cycleType}
                    className="shrink-0 mt-0.5 hover:opacity-70 transition-opacity"
                    contentEditable={false}
                    title="Click to change callout type"
                >
                    {style.icon}
                </button>
                <div className="flex-1 min-w-0">
                    <NodeViewContent className="callout-content" />
                </div>
            </div>
        </NodeViewWrapper>
    );
};

export const Callout = Node.create({
    name: "callout",

    group: "block",

    content: "block+",

    defining: true,

    addAttributes() {
        return {
            type: {
                default: "note",
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="callout"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "div",
            mergeAttributes(HTMLAttributes, { "data-type": "callout" }),
            0,
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(CalloutView);
    },

    addCommands() {
        return {
            setCallout:
                (attrs?: { type?: CalloutType }) =>
                    ({ commands }: any) => {
                        return commands.insertContent({
                            type: this.name,
                            attrs: { type: attrs?.type || "note" },
                            content: [
                                {
                                    type: "paragraph",
                                    content: [{ type: "text", text: "Type your callout text here..." }],
                                },
                            ],
                        });
                    },
        } as any;
    },
});

export default Callout;
