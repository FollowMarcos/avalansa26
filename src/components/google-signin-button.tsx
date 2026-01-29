"use client";

import { signInWith } from "@/app/auth/actions";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GoogleSignInButton() {
    const [isLoading, setIsLoading] = useState(false);
    const [lastUser, setLastUser] = useState<string | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('last_google_user');
        if (storedUser) {
            setLastUser(storedUser);
        }
    }, []);

    const handleSignIn = async () => {
        setIsLoading(true);
        try {
            await signInWith("google");
        } catch (error) {
            console.error("Sign in failed", error);
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-3 w-full">
            <Button
                onClick={handleSignIn}
                disabled={isLoading}
                aria-label={isLoading ? "Signing in…" : undefined}
                variant="default"
                size="lg"
                className="w-full rounded-full flex items-center gap-3 font-medium"
            >
                {isLoading ? (
                    <div role="status" className="flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="sr-only">Loading…</span>
                    </div>
                ) : (
                    <svg
                        className="h-4 w-4"
                        aria-hidden="true"
                        focusable="false"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 488 512"
                    >
                        <path
                            fill="currentColor"
                            d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                        ></path>
                    </svg>
                )}
                <span>
                    {isLoading ? "Signing in…" : "Continue with Google"}
                </span>
            </Button>

            {lastUser && (
                <p className="text-[10px] text-muted-foreground/60">
                    Detected: <span className="text-foreground">{lastUser}</span>
                </p>
            )}
        </div>
    );
}
