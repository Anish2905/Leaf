"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NewPage() {
    const router = useRouter();

    useEffect(() => {
        async function createPage() {
            try {
                const res = await fetch("/api/pages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                });

                if (!res.ok) throw new Error("Failed to create page");

                const data = await res.json();
                router.replace(`/page/${data.page.id}`);
            } catch (error) {
                toast.error("Failed to create page");
                router.replace("/");
            }
        }
        createPage();
    }, [router]);

    return (
        <div className="h-full flex items-center justify-center">
            <div className="text-muted-foreground">Creating page...</div>
        </div>
    );
}
