"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        if (typeof window === "undefined") return;

        setIsOnline(window.navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return isOnline;
}

export function StatusIndicator({ className }: { className?: string }) {
    const isOnline = useNetworkStatus();

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            "flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium cursor-help transition-colors",
                            isOnline
                                ? "text-green-600 bg-green-500/10 hover:bg-green-500/20"
                                : "text-destructive bg-destructive/10 hover:bg-destructive/20",
                            className
                        )}
                    >
                        <div
                            className={cn(
                                "h-2 w-2 rounded-full",
                                isOnline ? "bg-green-500" : "bg-destructive"
                            )}
                        />
                        <span className="hidden sm:inline">
                            {isOnline ? "Online" : "Offline"}
                        </span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>
                        {isOnline
                            ? "Connected to Polar Stellar servers"
                            : "No internet connection"}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
