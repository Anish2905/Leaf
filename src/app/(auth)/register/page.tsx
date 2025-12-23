"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
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

function RegisterContent() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        username: "",
        passphrase: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Registration failed");
            }

            toast.success("Account created! Redirecting...");
            router.push("/");
            router.refresh(); // Refresh to update session state
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <UserPlus className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl">Create Account</CardTitle>
                        <CardDescription className="mt-2">
                            Join Polar Stellar
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                                minLength={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="passphrase">Passphrase</Label>
                            <Input
                                id="passphrase"
                                type="password"
                                placeholder="Strong passphrase (min 12 chars)"
                                value={formData.passphrase}
                                onChange={(e) => setFormData({ ...formData, passphrase: e.target.value })}
                                required
                                minLength={12}
                            />
                            <p className="text-xs text-muted-foreground">
                                Use a sentence or multiple random words for security.
                            </p>
                        </div>
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full h-12"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            ) : null}
                            Create Account
                        </Button>
                        <div className="text-center text-sm text-muted-foreground mt-4">
                            Already have an account?{" "}
                            <Link href="/login" className="text-primary hover:underline">
                                Sign in
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
            <RegisterContent />
        </Suspense>
    );
}
