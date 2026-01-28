"use client";

import { signInWith } from "@/app/auth/actions";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

export function GoogleSignInButton() {
    const [isLoading, setIsLoading] = useState(false);

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
        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSignIn}
            disabled={isLoading}
            className="relative group overflow-hidden flex items-center gap-3 px-8 py-4 text-sm font-semibold rounded-full bg-background border border-border/50 hover:bg-muted/50 text-foreground transition-all duration-300"
        >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-primary/5 to-transparent skew-x-[-25deg] -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />

            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
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
            <span className="relative z-10">Continue with Google</span>
        </motion.button>
    );
}
