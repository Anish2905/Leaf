import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="text-center max-w-md space-y-6">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                    <FileText className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">Welcome to Polar Stellar</h1>
                    <p className="text-muted-foreground">
                        Your personal, cloud-synced workspace for notes and ideas.
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <Button asChild size="lg" className="w-full">
                        <Link href="/new">
                            <Plus className="h-5 w-5 mr-2" />
                            Create your first page
                        </Link>
                    </Button>
                    <p className="text-sm text-muted-foreground">
                        Or select a page from the sidebar to get started.
                    </p>
                </div>
            </div>
        </div>
    );
}
