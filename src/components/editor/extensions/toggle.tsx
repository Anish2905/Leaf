"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

// Toggle node view component
const ToggleView = ({ node, updateAttributes }: any) => {
    const [isOpen, setIsOpen] = useState(node.attrs.open);

    const toggle = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        updateAttributes({ open: newState });
    };

    return (
        <NodeViewWrapper className="toggle-block my-2">
            <div className="flex items-start gap-1">
                <button
                    onClick={toggle}
                    className="mt-1 p-0.5 rounded hover:bg-muted shrink-0"
                    contentEditable={false}
                >
                    {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                </button>
                <div className="flex-1">
                    <div className="font-medium">
                        <NodeViewContent as="span" className="toggle-title" />
                    </div>
                    {isOpen && (
                        <div className="mt-1 pl-4 border-l-2 border-muted">
                            <div data-toggle-content className="text-muted-foreground">
                                Click to add content...
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </NodeViewWrapper>
    );
};

export const Toggle = Node.create({
    name: "toggle",

    group: "block",

    content: "inline*",

    defining: true,

    addAttributes() {
        return {
            open: {
                default: false,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="toggle"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "div",
            mergeAttributes(HTMLAttributes, { "data-type": "toggle" }),
            0,
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ToggleView);
    },

    addCommands() {
        return {
            setToggle:
                () =>
                    ({ commands }: any) => {
                        return commands.insertContent({
                            type: this.name,
                            content: [{ type: "text", text: "Toggle heading" }],
                        });
                    },
        } as any;
    },
});

export default Toggle;
