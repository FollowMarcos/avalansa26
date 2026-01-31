"use client";

import * as React from "react";
import { CreateProvider } from "@/components/create/create-context";
import { SiteDock } from "./site-dock";
import { cn } from "@/lib/utils";

interface PageShellProps {
    children: React.ReactNode;
    className?: string; // Classes for the root container
    contentClassName?: string; // Classes for the internal main element
    showDock?: boolean;
    dockPosition?: "bottom" | "top-left";
}

export function PageShell({ children, className, contentClassName, showDock = true, dockPosition = "bottom" }: PageShellProps) {
    const isTopLeft = dockPosition === "top-left";

    return (
        <CreateProvider>
            <div className={cn("relative min-h-screen bg-background text-foreground flex flex-col antialiased", className)}>
                {/* Analog Grain Texture */}
                <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] mix-blend-multiply bg-noise"></div>

                {/* Background Gradients / Effects could go here */}

                <main className={cn(
                    "flex-1 flex flex-col relative z-10 w-full",
                    showDock && !isTopLeft && "pb-24 lg:pb-32",
                    contentClassName
                )}>
                    {children}
                </main>

                {showDock && (
                    <div className={cn(
                        "fixed z-[60] pointer-events-none",
                        isTopLeft
                            ? "top-0 left-0 p-4"
                            : "bottom-0 left-0 right-0 p-6 flex justify-center"
                    )}>
                        <SiteDock />
                    </div>
                )}
            </div>
        </CreateProvider>
    );
}
