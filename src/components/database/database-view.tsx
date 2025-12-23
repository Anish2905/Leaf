"use client";

import { useEffect, useState } from "react";
import { Database, Page } from "@/lib/db/schema";
import { TableView } from "./table-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface DatabaseViewProps {
    databaseId: string;
}

export function DatabaseView({ databaseId }: DatabaseViewProps) {
    const [database, setDatabase] = useState<Database | null>(null);
    const [entries, setEntries] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState("table");

    useEffect(() => {
        fetchDatabase();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [databaseId]);

    const fetchDatabase = async () => {
        try {
            // Fetch DB metadata
            const dbRes = await fetch(`/api/databases/${databaseId}`);
            if (!dbRes.ok) throw new Error("Failed to load database");
            const dbData = await dbRes.json();
            setDatabase(dbData);

            // Fetch entries
            const entriesRes = await fetch(`/api/pages?databaseId=${databaseId}`);
            if (!entriesRes.ok) throw new Error("Failed to load entries");
            const entriesData = await entriesRes.json();
            setEntries(entriesData.pages);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load database");
        } finally {
            setLoading(false);
        }
    };

    const createEntry = async () => {
        try {
            const res = await fetch("/api/pages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    databaseId,
                    title: "",
                    icon: null,
                    properties: {}, // Initialize with default properties if needed
                }),
            });

            if (!res.ok) throw new Error("Failed to create entry");
            const { page } = await res.json();
            setEntries([...entries, page]);
            toast.success("Entry created");
        } catch (error) {
            toast.error("Failed to create entry");
        }
    };

    const updateEntry = async (id: string, updates: Partial<Page>) => {
        // Optimistic update
        setEntries(
            entries.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry))
        );

        try {
            // TODO: Use a proper update endpoint for pages/properties
            /*
            const res = await fetch(`/api/pages/${id}`, {
              method: "PATCH",
              body: JSON.stringify(updates),
            });
            */
        } catch (error) {
            toast.error("Failed to update entry");
            // Revert on failure
            fetchDatabase();
        }
    };

    if (loading) {
        return <div className="p-4 text-muted-foreground">Loading database...</div>;
    }

    if (!database) {
        return <div className="p-4 text-destructive">Database not found</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{database.title}</h2>
                <div className="flex items-center gap-2">
                    {/* View switcher could go here */}
                </div>
            </div>

            <Tabs value={activeView} onValueChange={setActiveView}>
                <TabsList>
                    <TabsTrigger value="table">Table</TabsTrigger>
                    <TabsTrigger value="kanban" disabled>Kanban (Coming Soon)</TabsTrigger>
                </TabsList>
                <TabsContent value="table" className="mt-4">
                    <TableView
                        database={database}
                        entries={entries}
                        onCreateEntry={createEntry}
                        onUpdateEntry={updateEntry}
                    />
                </TabsContent>
                {/* <TabsContent value="kanban"><KanbanView ... /></TabsContent> */}
            </Tabs>

            <div className="border-t pt-2">
                <Button variant="ghost" size="sm" onClick={createEntry}>
                    <Plus className="h-4 w-4 mr-2" />
                    New
                </Button>
            </div>
        </div>
    );
}
