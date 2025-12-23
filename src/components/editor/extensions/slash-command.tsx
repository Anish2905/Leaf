"use client";

import { Extension } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import tippy, { Instance as TippyInstance } from "tippy.js";
import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
    useCallback,
} from "react";
import {
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    CheckSquare,
    Quote,
    Code,
    Minus,
    Type,
    AlertCircle,
    ChevronRight,
    Image,
    Table,
    Database,
    Youtube as YoutubeIcon,
    Bookmark,
} from "lucide-react";

interface CommandItem {
    title: string;
    description: string;
    icon: React.ReactNode;
    command: (props: { editor: any; range: any }) => void;
}

const commands: CommandItem[] = [
    {
        title: "Text",
        description: "Just start writing with plain text",
        icon: <Type className="h-4 w-4" />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setParagraph().run();
        },
    },
    {
        title: "Heading 1",
        description: "Large section heading",
        icon: <Heading1 className="h-4 w-4" />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
        },
    },
    {
        title: "Heading 2",
        description: "Medium section heading",
        icon: <Heading2 className="h-4 w-4" />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
        },
    },
    {
        title: "Heading 3",
        description: "Small section heading",
        icon: <Heading3 className="h-4 w-4" />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
        },
    },
    {
        title: "Bullet List",
        description: "Create a simple bullet list",
        icon: <List className="h-4 w-4" />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
    },
    {
        title: "Numbered List",
        description: "Create a numbered list",
        icon: <ListOrdered className="h-4 w-4" />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
    },
    {
        title: "To-do List",
        description: "Track tasks with a to-do list",
        icon: <CheckSquare className="h-4 w-4" />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleTaskList().run();
        },
    },
    {
        title: "Toggle",
        description: "Toggles can hide and show content",
        icon: <ChevronRight className="h-4 w-4" />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setToggle().run();
        },
    },
    {
        title: "Quote",
        description: "Capture a quote",
        icon: <Quote className="h-4 w-4" />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleBlockquote().run();
        },
    },
    {
        title: "Code Block",
        description: "Capture a code snippet",
        icon: <Code className="h-4 w-4" />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
        },
    },
    {
        title: "Divider",
        description: "Visually divide blocks",
        icon: <Minus className="h-4 w-4" />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setHorizontalRule().run();
        },
    },
    {
        title: "Callout",
        description: "Make writing stand out",
        icon: <AlertCircle className="h-4 w-4" />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setCallout().run();
        },
    },
    {
        title: "Image",
        description: "Upload or embed an image",
        // eslint-disable-next-line jsx-a11y/alt-text
        icon: <Image className="h-4 w-4" />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).run();
            // Trigger image upload dialog
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    // For now, use data URL. Later: upload to storage
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
        },
    },
    {
        title: "Table",
        description: "Add a simple table",
        icon: <Table className="h-4 w-4" />,
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run();
        },
    },
    {
        title: "Database",
        description: "Create a new inline database",
        icon: <Database className="h-4 w-4" />,
        command: async ({ editor, range }) => {
            // Delete the slash command text first
            editor.chain().focus().deleteRange(range).run();

            try {
                // Create a new database via API
                const res = await fetch("/api/databases", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: "Untitled Database",
                        views: [{ type: "table", name: "Table View" }],
                        schema: { "Status": { type: "select", options: ["To Do", "In Progress", "Done"] } }
                    }),
                });

                if (!res.ok) throw new Error("Failed to create database");

                const db = await res.json();

                // Insert the database block
                editor
                    .chain()
                    .focus()
                    .insertContent({
                        type: "database",
                        attrs: { id: db.id },
                    })
                    .run();
            } catch (error) {
                console.error("Failed to create database", error);
                // toast.error("Failed to create database"); // ideally import toast
            }
        },
    },
    {
        title: "Youtube",
        description: "Embed a Youtube video",
        icon: <YoutubeIcon className="h-4 w-4" />,
        command: ({ editor, range }) => {
            const url = prompt("Enter Youtube URL");
            if (url) {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setYoutubeVideo({ src: url })
                    .run();
            }
        },
    },
    {
        title: "Bookmark",
        description: "Save a URL as a visual bookmark",
        icon: <Bookmark className="h-4 w-4" />,
        command: ({ editor, range }) => {
            const url = prompt("Enter URL to bookmark");
            if (url) {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .insertContent({
                        type: "bookmark",
                        attrs: { url },
                    })
                    .run();
            }
        },
    },
];

interface CommandListProps {
    items: CommandItem[];
    command: (item: CommandItem) => void;
}

interface CommandListRef {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const CommandList = forwardRef<CommandListRef, CommandListProps>(
    ({ items, command }, ref) => {
        const [selectedIndex, setSelectedIndex] = useState(0);

        const selectItem = useCallback(
            (index: number) => {
                const item = items[index];
                if (item) {
                    command(item);
                }
            },
            [items, command]
        );

        useEffect(() => {
            setSelectedIndex(0);
        }, [items]);

        useImperativeHandle(ref, () => ({
            onKeyDown: ({ event }: { event: KeyboardEvent }) => {
                if (event.key === "ArrowUp") {
                    setSelectedIndex((selectedIndex + items.length - 1) % items.length);
                    return true;
                }
                if (event.key === "ArrowDown") {
                    setSelectedIndex((selectedIndex + 1) % items.length);
                    return true;
                }
                if (event.key === "Enter") {
                    selectItem(selectedIndex);
                    return true;
                }
                return false;
            },
        }));

        if (items.length === 0) {
            return (
                <div className="p-2 text-sm text-muted-foreground">No results</div>
            );
        }

        return (
            <div className="z-50 max-h-80 overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
                {items.map((item, index) => (
                    <button
                        key={item.title}
                        className={`flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-left text-sm outline-none ${index === selectedIndex
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50"
                            }`}
                        onClick={() => selectItem(index)}
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background">
                            {item.icon}
                        </div>
                        <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs text-muted-foreground">
                                {item.description}
                            </div>
                        </div>
                    </button>
                ))}
            </div >
        );
    }
);

CommandList.displayName = "CommandList";

export const SlashCommand = Extension.create({
    name: "slashCommand",

    addOptions() {
        return {
            suggestion: {
                char: "/",
                command: ({
                    editor,
                    range,
                    props,
                }: {
                    editor: any;
                    range: any;
                    props: CommandItem;
                }) => {
                    props.command({ editor, range });
                },
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
                items: ({ query }: { query: string }) => {
                    return commands.filter((item) =>
                        item.title.toLowerCase().includes(query.toLowerCase())
                    );
                },
                render: () => {
                    let component: ReactRenderer | null = null;
                    let popup: TippyInstance[] | null = null;

                    return {
                        onStart: (props: any) => {
                            component = new ReactRenderer(CommandList, {
                                props,
                                editor: props.editor,
                            });

                            if (!props.clientRect) {
                                return;
                            }

                            popup = tippy("body", {
                                getReferenceClientRect: props.clientRect,
                                appendTo: () => document.body,
                                content: component.element,
                                showOnCreate: true,
                                interactive: true,
                                trigger: "manual",
                                placement: "bottom-start",
                            });
                        },

                        onUpdate(props: any) {
                            component?.updateProps(props);

                            if (!props.clientRect) {
                                return;
                            }

                            popup?.[0]?.setProps({
                                getReferenceClientRect: props.clientRect,
                            });
                        },

                        onKeyDown(props: any) {
                            if (props.event.key === "Escape") {
                                popup?.[0]?.hide();
                                return true;
                            }

                            return (component?.ref as CommandListRef)?.onKeyDown(props);
                        },

                        onExit() {
                            popup?.[0]?.destroy();
                            component?.destroy();
                        },
                    };
                },
            }),
        ];
    },
});

export default SlashCommand;
