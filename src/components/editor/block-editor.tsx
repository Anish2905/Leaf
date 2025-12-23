"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import { useCallback, useEffect, useState, useMemo } from "react";
import {
    Bold,
    Italic,
    Strikethrough,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Code,
    CheckSquare,
    Table as TableIcon,
    ImageIcon,
    MinusSquare,
    MoreHorizontal,
    Download,
    Upload,
} from "lucide-react";
import { SlashCommand, Toggle, Callout, DatabaseBlock, BookmarkBlock } from "./extensions";
import { htmlToMarkdown, markdownToHtml } from "@/lib/markdown";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BlockEditorProps {
    pageId: string;
    initialContent?: string;
    onSave?: (content: string) => void;
}

const debounce = <T extends (...args: Parameters<T>) => void>(
    fn: T,
    delay: number
) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

export function BlockEditor({ pageId, initialContent, onSave }: BlockEditorProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const extensions = useMemo(
        () => [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Placeholder.configure({
                placeholder: ({ node }) => {
                    if (node.type.name === "heading") {
                        return "Heading";
                    }
                    return "Press '/' for commands...";
                },
                emptyNodeClass: "is-editor-empty",
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableCell,
            TableHeader,
            Image.configure({
                HTMLAttributes: {
                    class: "rounded-lg max-w-full",
                },
            }),
            Youtube.configure({
                controls: false,
            }),
            Toggle,
            Callout,
            DatabaseBlock,
            BookmarkBlock,
            SlashCommand,
        ],
        []
    );

    const editor = useEditor({
        immediatelyRender: false,
        extensions,
        content: initialContent ? JSON.parse(initialContent) : "",
        editorProps: {
            attributes: {
                class: "prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert focus:outline-none max-w-none min-h-[300px]",
            },
        },
        onUpdate: ({ editor }) => {
            debouncedSave(editor);
        },
    });

    // Debounced save function
    const saveContent = useCallback(
        async (editor: Editor) => {
            if (!onSave) return;

            setIsSaving(true);
            try {
                const json = editor.getJSON();
                await onSave(JSON.stringify(json));
                setLastSaved(new Date());
            } catch (error) {
                console.error("Failed to save:", error);
            } finally {
                setIsSaving(false);
            }
        },
        [onSave]
    );


    const debouncedSave = useCallback(
        debounce((editor: Editor) => saveContent(editor), 1000),
        [saveContent]
    );

    // Update content when initialContent changes
    useEffect(() => {
        if (editor && initialContent) {
            try {
                const content = JSON.parse(initialContent);
                if (JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
                    editor.commands.setContent(content);
                }
            } catch {
                // Invalid JSON, set as empty
            }
        }
    }, [editor, initialContent]);

    // Cleanup
    useEffect(() => {
        return () => {
            editor?.destroy();
        };
    }, [editor]);

    // Insert image handler
    const handleInsertImage = useCallback(() => {
        if (!editor) return;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    editor
                        .chain()
                        .focus()
                        .setImage({ src: reader.result as string })
                        .run();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }, [editor]);

    // Insert table handler
    const handleInsertTable = useCallback(() => {
        if (!editor) return;
        editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run();
    }, [editor]);

    // Export handler
    const handleExport = useCallback(() => {
        if (!editor) return;
        const html = editor.getHTML();
        const markdown = htmlToMarkdown(html);
        const blob = new Blob([markdown], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "page.md";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Exported to Markdown");
    }, [editor]);

    // Import handler
    const handleImport = useCallback(() => {
        if (!editor) return;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".md,.markdown";
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const text = await file.text();
                const html = markdownToHtml(text);
                editor.commands.setContent(html);
                toast.success("Imported from Markdown");
            }
        };
        input.click();
    }, [editor]);

    if (!editor) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-muted-foreground">Loading editor...</div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b bg-muted/30 flex-wrap">
                {/* Text formatting */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive("bold")}
                    title="Bold (Ctrl+B)"
                >
                    <Bold className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive("italic")}
                    title="Italic (Ctrl+I)"
                >
                    <Italic className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    active={editor.isActive("strike")}
                    title="Strikethrough"
                >
                    <Strikethrough className="h-4 w-4" />
                </ToolbarButton>

                <Divider />

                {/* Headings */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    active={editor.isActive("heading", { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    active={editor.isActive("heading", { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    active={editor.isActive("heading", { level: 3 })}
                    title="Heading 3"
                >
                    <Heading3 className="h-4 w-4" />
                </ToolbarButton>

                <Divider />

                {/* Lists */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={editor.isActive("bulletList")}
                    title="Bullet List"
                >
                    <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={editor.isActive("orderedList")}
                    title="Numbered List"
                >
                    <ListOrdered className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                    active={editor.isActive("taskList")}
                    title="To-do List"
                >
                    <CheckSquare className="h-4 w-4" />
                </ToolbarButton>

                <Divider />

                {/* Blocks */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    active={editor.isActive("blockquote")}
                    title="Quote"
                >
                    <Quote className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    active={editor.isActive("codeBlock")}
                    title="Code Block"
                >
                    <Code className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    title="Divider"
                >
                    <MinusSquare className="h-4 w-4" />
                </ToolbarButton>

                <Divider />

                {/* Advanced */}
                <ToolbarButton onClick={handleInsertImage} title="Insert Image">
                    <ImageIcon className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={handleInsertTable} title="Insert Table">
                    <TableIcon className="h-4 w-4" />
                </ToolbarButton>

                <Divider />

                {/* More Actions */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded hover:bg-muted transition-colors text-muted-foreground" title="More options">
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleExport}>
                            <Download className="h-4 w-4 mr-2" />
                            Export to Markdown
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleImport}>
                            <Upload className="h-4 w-4 mr-2" />
                            Import from Markdown
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Save status */}
                <div className="ml-auto text-xs text-muted-foreground">
                    {isSaving ? (
                        "Saving..."
                    ) : lastSaved ? (
                        `Saved ${lastSaved.toLocaleTimeString()}`
                    ) : null}
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-auto">
                <EditorContent
                    editor={editor}
                    className="h-full px-8 py-6 max-w-3xl mx-auto"
                />
            </div>
        </div>
    );
}

// Toolbar button component
function ToolbarButton({
    onClick,
    active,
    title,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={`p-2 rounded hover:bg-muted transition-colors ${active ? "bg-muted text-foreground" : "text-muted-foreground"
                }`}
            title={title}
        >
            {children}
        </button>
    );
}

// Divider component
function Divider() {
    return <div className="w-px h-4 bg-border mx-1" />;
}
