"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "circular" | "text";
    animation?: "pulse" | "shimmer" | "none";
}

function Skeleton({
    className,
    variant = "default",
    animation = "pulse",
    ...props
}: SkeletonProps) {
    return (
        <div
            className={cn(
                "rounded-md bg-muted",
                {
                    "rounded-full": variant === "circular",
                    "h-4 w-full": variant === "text",
                    "animate-pulse": animation === "pulse",
                    "animate-shimmer": animation === "shimmer",
                },
                className
            )}
            {...props}
        />
    );
}

function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
    return (
        <div className={cn("space-y-2", className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    variant="text"
                    className={cn(
                        i === lines - 1 ? "w-3/4" : "w-full"
                    )}
                />
            ))}
        </div>
    );
}

function SkeletonCard({ className }: { className?: string }) {
    return (
        <div className={cn("rounded-lg border p-4 space-y-3", className)}>
            <Skeleton className="h-32 w-full" />
            <Skeleton variant="text" className="w-2/3" />
            <Skeleton variant="text" className="w-1/2" />
        </div>
    );
}

function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
    const sizeClasses = {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12",
    };

    return <Skeleton variant="circular" className={sizeClasses[size]} />;
}

function SkeletonPage() {
    return (
        <div className="p-8 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10" />
                <Skeleton variant="text" className="h-8 w-64" />
            </div>
            {/* Content */}
            <div className="max-w-3xl space-y-4">
                <SkeletonText lines={5} />
                <Skeleton className="h-48 w-full" />
                <SkeletonText lines={3} />
            </div>
        </div>
    );
}

function SkeletonSidebar() {
    return (
        <div className="p-3 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton variant="text" className="flex-1" />
                </div>
            ))}
        </div>
    );
}

export {
    Skeleton,
    SkeletonText,
    SkeletonCard,
    SkeletonAvatar,
    SkeletonPage,
    SkeletonSidebar,
};
