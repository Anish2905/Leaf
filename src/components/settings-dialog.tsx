"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import {
    LogOut,
    Fingerprint,
    Monitor,
    Trash2,
    Plus,
    Loader2,
    Moon,
    Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface Device {
    id: string;
    name: string | null;
    lastUsed: string | null;
    createdAt: string;
    isCurrent: boolean;
}

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [devices, setDevices] = useState<Device[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
    const [newDeviceName, setNewDeviceName] = useState("");
    const [showAddPasskey, setShowAddPasskey] = useState(false);

    // Fetch devices
    useEffect(() => {
        if (open) {
            fetchDevices();
        }
    }, [open]);

    const fetchDevices = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/devices");
            if (res.ok) {
                const data = await res.json();
                setDevices(data.devices);
            }
        } catch (error) {
            console.error("Error fetching devices:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterPasskey = async () => {
        setIsRegisteringPasskey(true);
        try {
            const optionsRes = await fetch("/api/auth/passkey/register");
            if (!optionsRes.ok) throw new Error("Failed to get registration options");
            const options = await optionsRes.json();

            const regResponse = await startRegistration(options);

            const verifyRes = await fetch("/api/auth/passkey/register/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    response: regResponse,
                    deviceName: newDeviceName || "New Device",
                }),
            });

            if (!verifyRes.ok) throw new Error("Failed to register passkey");

            toast.success("Passkey registered successfully");
            setShowAddPasskey(false);
            setNewDeviceName("");
            fetchDevices();
        } catch (error) {
            toast.error("Failed to register passkey");
        } finally {
            setIsRegisteringPasskey(false);
        }
    };

    const handleRevokeDevice = async (deviceId: string) => {
        try {
            const res = await fetch(`/api/auth/devices?id=${deviceId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to revoke device");

            toast.success("Device revoked");
            setDevices((prev) => prev.filter((d) => d.id !== deviceId));
        } catch (error) {
            toast.error("Failed to revoke device");
        }
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.replace("/login");
        } catch (error) {
            toast.error("Failed to logout");
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "Never";
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Manage your account and preferences
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Theme */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Appearance</Label>
                        <div className="flex gap-2">
                            <Button
                                variant={theme === "light" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setTheme("light")}
                            >
                                <Sun className="h-4 w-4 mr-2" />
                                Light
                            </Button>
                            <Button
                                variant={theme === "dark" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setTheme("dark")}
                            >
                                <Moon className="h-4 w-4 mr-2" />
                                Dark
                            </Button>
                            <Button
                                variant={theme === "system" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setTheme("system")}
                            >
                                System
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    {/* Devices */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Registered Devices</Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAddPasskey(true)}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Passkey
                            </Button>
                        </div>

                        {showAddPasskey && (
                            <div className="p-3 rounded-lg border bg-muted/50 space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="deviceName" className="text-xs">
                                        Device Name
                                    </Label>
                                    <Input
                                        id="deviceName"
                                        placeholder="e.g., MacBook Pro"
                                        value={newDeviceName}
                                        onChange={(e) => setNewDeviceName(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handleRegisterPasskey}
                                        disabled={isRegisteringPasskey}
                                    >
                                        {isRegisteringPasskey ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Fingerprint className="h-4 w-4 mr-2" />
                                        )}
                                        Register
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowAddPasskey(false);
                                            setNewDeviceName("");
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}

                        {isLoading ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                                Loading devices...
                            </div>
                        ) : devices.length === 0 ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                                No passkeys registered
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {devices.map((device) => (
                                    <div
                                        key={device.id}
                                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Monitor className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <div className="text-sm font-medium flex items-center gap-2">
                                                    {device.name || "Unknown Device"}
                                                    {device.isCurrent && (
                                                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                                            Current
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Last used: {formatDate(device.lastUsed)}
                                                </div>
                                            </div>
                                        </div>
                                        {!device.isCurrent && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() => handleRevokeDevice(device.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Logout */}
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
