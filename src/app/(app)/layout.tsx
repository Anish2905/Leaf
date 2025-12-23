"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { SearchDialog } from "@/components/search-dialog";
import { SettingsDialog } from "@/components/settings-dialog";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Close mobile sidebar on route change
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMobileSidebarOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className="h-screen flex overflow-hidden relative">
            {/* Mobile menu button */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 md:hidden"
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            >
                {isMobileSidebarOpen ? (
                    <X className="h-5 w-5" />
                ) : (
                    <Menu className="h-5 w-5" />
                )}
            </Button>

            {/* Mobile backdrop */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden animate-fade-in"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar - hidden on mobile, slide in when open */}
            <div
                className={`
                    fixed md:relative inset-y-0 left-0 z-40
                    transform transition-transform duration-300 ease-out
                    ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
                    md:translate-x-0
                `}
            >
                <Sidebar
                    onOpenSearch={() => {
                        setIsSearchOpen(true);
                        setIsMobileSidebarOpen(false);
                    }}
                    onOpenSettings={() => {
                        setIsSettingsOpen(true);
                        setIsMobileSidebarOpen(false);
                    }}
                />
            </div>

            {/* Main content */}
            <main className="flex-1 overflow-hidden pt-14 md:pt-0">
                {children}
            </main>

            <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
            <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
        </div>
    );
}
