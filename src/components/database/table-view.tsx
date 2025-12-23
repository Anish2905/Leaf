"use client";

import { Database, Page } from "@/lib/db/schema";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface TableViewProps {
    database: Database;
    entries: Page[];
    onCreateEntry: () => void;
    onUpdateEntry: (id: string, updates: Partial<Page>) => void;
}

export function TableView({
    database,
    entries,
    onCreateEntry,
    onUpdateEntry,
}: TableViewProps) {
    // Parse schema if it's a string, though drizzle handles JSON mode
    // But type safety might be tricky.
    const schema = (typeof database.schema === 'string'
        ? JSON.parse(database.schema)
        : database.schema) as Record<string, any>;

    const properties = Object.keys(schema || {});

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[300px]">Name</TableHead>
                        {properties.map((prop) => (
                            <TableHead key={prop}>{prop}</TableHead>
                        ))}
                        {/* Add Property Button column could go here */}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {entries.map((entry) => (
                        <DatabaseRow
                            key={entry.id}
                            entry={entry}
                            schema={schema}
                            onUpdate={(updates) => onUpdateEntry(entry.id, updates)}
                        />
                    ))}
                    {/* Empty row to create new */}
                    <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={onCreateEntry}
                    >
                        <TableCell className="text-muted-foreground">+ New</TableCell>
                        {properties.map(p => <TableCell key={p} />)}
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}

function DatabaseRow({
    entry,
    schema,
    onUpdate,
}: {
    entry: Page;
    schema: Record<string, any>;
    onUpdate: (updates: Partial<Page>) => void;
}) {
    const [title, setTitle] = useState(entry.title);

    // Parse entry properties
    const entryProps = (typeof entry.properties === 'string'
        ? JSON.parse(entry.properties || '{}')
        : entry.properties) as Record<string, any> || {};

    const handleTitleBlur = () => {
        if (title !== entry.title) {
            onUpdate({ title });
        }
    };

    return (
        <TableRow>
            <TableCell className="font-medium p-0">
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    className="border-0 shadow-none focus-visible:ring-0 h-full px-4 rounded-none"
                />
            </TableCell>
            {Object.keys(schema).map((prop) => (
                <TableCell key={prop}>
                    {/* Placeholder for property cell editors */}
                    <span className="text-sm text-muted-foreground">
                        {JSON.stringify(entryProps[prop] ?? null)}
                    </span>
                </TableCell>
            ))}
        </TableRow>
    );
}
