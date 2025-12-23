import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { DatabaseView } from "@/components/database/database-view";

export const DatabaseBlock = Node.create({
    name: "database",
    group: "block",
    atom: true,

    addAttributes() {
        return {
            id: {
                default: null,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="database"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ["div", mergeAttributes(HTMLAttributes, { "data-type": "database" })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(({ node }) => {
            const id = node.attrs.id;

            return (
                <NodeViewWrapper className="database-block my-4 border rounded-lg overflow-hidden">
                    {id ? (
                        <DatabaseView databaseId={id} />
                    ) : (
                        <div className="p-4 bg-muted text-muted-foreground">
                            Database not found (ID missing)
                        </div>
                    )}
                </NodeViewWrapper>
            );
        });
    },
});
