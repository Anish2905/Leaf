"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";
import { KeyRound, Loader2, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const from = searchParams?.get("from") || "/";

    const [isLoading, setIsLoading] = useState(false);
    const [showPassphrase, setShowPassphrase] = useState(false);
    const [passphrase, setPassphrase] = useState("");
    const [identifier, setIdentifier] = useState("");

    // Check if user exists - Removed for multi-user
    // useEffect(() => { ... }, []);

    // Check if already authenticated
    useEffect(() => {
        async function checkSession() {
            try {
                const res = await fetch("/api/auth/session");
                const data = await res.json();
                if (data.authenticated) {
                    router.replace(from);
                }
            } catch {
                // Not authenticated
            }
        }
        checkSession();
    }, [router, from]);

    const handlePasskeyLogin = async () => {
        setIsLoading(true);
        try {
            // Get authentication options
            const optionsRes = await fetch("/api/auth/passkey/login");
            if (!optionsRes.ok) {
                throw new Error("Failed to get authentication options");
            }
            const options = await optionsRes.json();

            // Start authentication
            const authResponse = await startAuthentication(options);

            // Verify authentication
            const verifyRes = await fetch("/api/auth/passkey/login/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ response: authResponse }),
            });

            if (!verifyRes.ok) {
                const error = await verifyRes.json();
                throw new Error(error.error || "Authentication failed");
            }

            toast.success("Welcome back!");
            router.replace(from);
        } catch (error) {
            console.error("Passkey login error:", error);
            toast.error(
                error instanceof Error ? error.message : "Authentication failed"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handlePassphraseLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier, passphrase }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Authentication failed");
            }

            toast.success("Welcome back! Consider registering a passkey for this device.");
            router.replace(from);
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Authentication failed"
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (false) { // was hasUser check
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <KeyRound className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl">Welcome back</CardTitle>
                        <CardDescription className="mt-2">
                            Sign in to access your notes
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!showPassphrase ? (
                        <>
                            <Button
                                size="lg"
                                className="w-full h-12 text-base"
                                onClick={handlePasskeyLogin}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                ) : (
                                    <Fingerprint className="h-5 w-5 mr-2" />
                                )}
                                Sign in with Passkey
                            </Button>
                            <div className="text-center">
                                <button
                                    type="button"
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => setShowPassphrase(true)}
                                >
                                    Use passphrase instead →
                                </button>
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handlePassphraseLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="identifier">Email or Username</Label>
                                <Input
                                    id="identifier"
                                    type="text"
                                    placeholder="email or username"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="passphrase">Passphrase</Label>
                                <Input
                                    id="passphrase"
                                    type="password"
                                    placeholder="Enter your passphrase"
                                    value={passphrase}
                                    onChange={(e) => setPassphrase(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full h-12"
                                disabled={isLoading || !passphrase}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                ) : null}
                                Sign in
                            </Button>
                            <div className="text-center">
                                <button
                                    type="button"
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => setShowPassphrase(false)}
                                >
                                    ← Use passkey instead
                                </button>
                            </div>
                            <div className="text-center text-sm text-muted-foreground mt-4">
                                Don&apos;t have an account?{" "}
                                <Link href="/register" className="text-primary hover:underline">
                                    Register
                                </Link>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card >
        </div >
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            }
        >
            <LoginContent />
        </Suspense>
    );
}
